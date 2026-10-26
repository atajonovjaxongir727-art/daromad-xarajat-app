import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { getTodayString, syncRecurringDebts } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Daromadlar ro'yxati (Filtr va qidiruv bilan)
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, userId, accountId, type, search } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.date = { gte: String(startDate), lte: String(endDate) };
    } else if (startDate) {
      where.date = { gte: String(startDate) };
    } else if (endDate) {
      where.date = { lte: String(endDate) };
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (accountId) {
      where.accountId = String(accountId);
    }

    if (type) {
      where.type = String(type);
    }

    if (search) {
      where.OR = [
        { source: { contains: String(search) } },
        { category: { contains: String(search) } },
        { note: { contains: String(search) } },
      ];
    }

    const items = await prisma.income.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        account: { select: { id: true, name: true, type: true, color: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daromad qo'shish (agar doimiy mijoz bo'lsa, qarzidan avtomatik chegiriladi)
router.post('/', async (req, res) => {
  try {
    const { date, amount, userId, source, category, accountId, paymentMethod, note, recurringIncomeId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Daromad summasi musbat bo‘lishi kerak' });
    }

    if (!userId || !accountId) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi va Hisob tanlanishi shart' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!user || !account) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi yoki Hisob topilmadi' });
    }

    const incAmount = Number(amount);
    const incDate = date || getTodayString();

    // 1. Agar doimiy daromad manbasi (mijoz) tanlangan bo'lsa, uni topamiz
    let matchedRecurring = null;
    if (recurringIncomeId) {
      matchedRecurring = await prisma.recurringIncome.findUnique({
        where: { id: recurringIncomeId },
      });
    } else if (source && source.trim()) {
      matchedRecurring = await prisma.recurringIncome.findFirst({
        where: { title: source.trim() },
      });
    }

    // 2. Daromad yozuvini yaratish
    const createdIncome = await prisma.income.create({
      data: {
        date: incDate,
        amount: incAmount,
        userId: user.id,
        type: matchedRecurring ? 'recurring_payment' : 'one_time',
        source: source || (matchedRecurring ? matchedRecurring.title : 'Mijozdan'),
        category: category || (matchedRecurring ? 'Mijoz to‘lovi' : 'Bir martalik daromad'),
        accountId: account.id,
        paymentMethod: paymentMethod || account.type,
        note: note || '',
      },
      include: {
        user: true,
        account: true,
      },
    });

    // 3. Agar mijozning ochiq qarzdorligi bo'lsa, kiritilgan summadan navbatma-navbat kamaytiramiz (FIFO)
    let remainingToDeduct = incAmount;
    const affectedPeriods: string[] = [];

    if (matchedRecurring) {
      const openInstances = await prisma.recurringIncomeInstance.findMany({
        where: {
          recurringIncomeId: matchedRecurring.id,
          status: { not: 'PAID' },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      for (const inst of openInstances) {
        if (remainingToDeduct <= 0) break;

        const needed = Math.max(0, inst.expectedAmount - inst.paidAmount);
        if (needed <= 0) continue;

        const payThis = Math.min(remainingToDeduct, needed);
        const newPaid = inst.paidAmount + payThis;
        const isFull = newPaid >= inst.expectedAmount;

        await prisma.recurringIncomeInstance.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaid,
            status: isFull ? 'PAID' : 'PARTIALLY_PAID',
          },
        });

        await prisma.payment.create({
          data: {
            recurringInstanceId: inst.id,
            amount: payThis,
            paymentDate: incDate,
            accountId: account.id,
            receivedById: user.id,
            incomeId: createdIncome.id,
            note: note || `${matchedRecurring.title} to‘lovi (${inst.yearMonth})`,
          },
        });

        if (!createdIncome.recurringInstanceId) {
          await prisma.income.update({
            where: { id: createdIncome.id },
            data: { recurringInstanceId: inst.id },
          });
        }

        remainingToDeduct -= payThis;
        affectedPeriods.push(inst.yearMonth);
      }

      // Qarzdorlik statuslarini yangilash
      await syncRecurringDebts();
    }

    // 4. Tanlangan hisob/hamyon balansini oshirish
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: incAmount } },
    });

    // 5. Tranzaksiyalar tarixiga yozish
    const nowTime = new Date().toTimeString().split(' ')[0];
    const txDesc = affectedPeriods.length > 0
      ? `${source || matchedRecurring?.title}: To‘lov qabul qilindi (Qarzdorlik yopildi: ${affectedPeriods.join(', ')})`
      : `${source || 'Mijozdan'}: ${category || 'Daromad'}`;

    await prisma.transaction.create({
      data: {
        date: `${incDate} ${nowTime}`,
        type: 'INCOME',
        amount: incAmount,
        accountId: account.id,
        userId: user.id,
        description: txDesc,
        referenceId: createdIncome.id,
        balanceAfter: updatedAccount.balance,
      },
    });

    // 6. Audit Log
    const auditDesc = affectedPeriods.length > 0
      ? `${user.name} ${new Intl.NumberFormat('uz-UZ').format(incAmount)} so‘mlik to‘lovni qabul qildi va ${matchedRecurring?.title} ning qarzdorligidan chegirildi (${affectedPeriods.join(', ')})`
      : `${user.name} ${new Intl.NumberFormat('uz-UZ').format(incAmount)} so‘mlik daromad qo‘shdi (${source || 'Mijoz'})`;

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entityType: 'INCOME',
      entityId: createdIncome.id,
      description: auditDesc,
      newData: createdIncome,
    });

    res.status(201).json({
      success: true,
      data: createdIncome,
      deductedFromDebts: affectedPeriods.length > 0,
      affectedPeriods,
      message: affectedPeriods.length > 0
        ? `Daromad saqlandi va ${matchedRecurring?.title} ning qarzdorligidan (${affectedPeriods.join(', ')}) chegirildi.`
        : 'Daromad muvaffaqiyatli saqlandi.',
    });
  } catch (error: any) {
    console.error('Add income error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daromadni o'chirish (Section 13)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, currentUserName } = req.body;

    const existing = await prisma.income.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad yozuvi topilmadi' });
    }

    // 1. Agar ushbu daromadga bog'liq qarz to'lovlari bo'lsa, ularni orqaga qaytarish
    if (existing.payments && existing.payments.length > 0) {
      for (const pay of existing.payments) {
        const inst = await prisma.recurringIncomeInstance.findUnique({
          where: { id: pay.recurringInstanceId },
        });

        if (inst) {
          const newPaid = Math.max(0, inst.paidAmount - pay.amount);
          const todayStr = getTodayString();
          let newStatus = 'PENDING';
          if (newPaid >= inst.expectedAmount) newStatus = 'PAID';
          else if (newPaid > 0) newStatus = 'PARTIALLY_PAID';
          else if (inst.dueDate < todayStr || inst.yearMonth === 'Oldingi qarz') newStatus = 'OVERDUE';

          await prisma.recurringIncomeInstance.update({
            where: { id: inst.id },
            data: { paidAmount: newPaid, status: newStatus },
          });
        }

        await prisma.payment.delete({ where: { id: pay.id } });
      }
      await syncRecurringDebts();
    }

    // 2. Hisobdan pulni ayirish
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: existing.amount } },
    });

    // 3. Daromadni o'chirish
    await prisma.income.delete({ where: { id } });

    // 4. Audit Log
    await createAuditLog({
      userId: currentUserId || existing.userId,
      userName: currentUserName || 'Foydalanuvchi',
      action: 'DELETE',
      entityType: 'INCOME',
      entityId: id,
      description: `${currentUserName || 'Foydalanuvchi'} ${new Intl.NumberFormat('uz-UZ').format(existing.amount)} so‘mlik daromadni o‘chirdi (${existing.source})`,
      oldData: existing,
    });

    res.json({ success: true, message: 'Daromad o‘chirildi va balans qaytarildi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
