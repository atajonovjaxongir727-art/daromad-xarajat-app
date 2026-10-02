import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { getTodayString } from '../services/syncService.js';

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

// Bir martalik daromad qo'shish (Section 9)
router.post('/', async (req, res) => {
  try {
    const { date, amount, userId, source, category, accountId, paymentMethod, note } = req.body;

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

    // 1. Daromad yozuvi yaratish
    const createdIncome = await prisma.income.create({
      data: {
        date: incDate,
        amount: incAmount,
        userId: user.id,
        type: 'one_time',
        source: source || 'Mijozdan',
        category: category || 'Bir martalik daromad',
        accountId: account.id,
        paymentMethod: paymentMethod || account.type,
        note: note || '',
      },
      include: {
        user: true,
        account: true,
      },
    });

    // 2. Tanlangan hisob/hamyon balansini oshirish (Section 20)
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: incAmount } },
    });

    // 3. Tranzaksiyalar tarixiga yozish (Section 21)
    const nowTime = new Date().toTimeString().split(' ')[0];
    await prisma.transaction.create({
      data: {
        date: `${incDate} ${nowTime}`,
        type: 'INCOME',
        amount: incAmount,
        accountId: account.id,
        userId: user.id,
        description: `${source || 'Mijozdan'}: ${category || 'Bir martalik daromad'}`,
        referenceId: createdIncome.id,
        balanceAfter: updatedAccount.balance,
      },
    });

    // 4. Audit Log (Section 33)
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entityType: 'INCOME',
      entityId: createdIncome.id,
      description: `${user.name} ${new Intl.NumberFormat('uz-UZ').format(incAmount)} so‘mlik bir martalik daromad qo‘shdi (${source || 'Mijoz'})`,
      newData: createdIncome,
    });

    res.json({ success: true, data: createdIncome });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daromadni tahrirlash (Section 24: Foydalanuvchi huquqi tekshiriladi)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, source, category, accountId, paymentMethod, note, currentUserId } = req.body;

    const existing = await prisma.income.findUnique({
      where: { id },
      include: { user: true, account: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad topilmadi' });
    }

    // Section 24: "Har bir foydalanuvchi faqat o‘zining shaxsiy yozuvlarini o‘zgartira olsin"
    if (currentUserId && existing.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Siz faqat o‘zingiz kiritgan yozuvlarni tahrirlashingiz mumkin',
      });
    }

    const newAmount = amount !== undefined ? Number(amount) : existing.amount;
    const newAccountId = accountId || existing.accountId;
    const diff = newAmount - existing.amount;

    // Balansni yangilash
    if (newAccountId === existing.accountId) {
      if (diff !== 0) {
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: diff } },
        });
      }
    } else {
      // Eski hisobdan ayirish, yangisiga qo'shish
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
      await prisma.account.update({
        where: { id: newAccountId },
        data: { balance: { increment: newAmount } },
      });
    }

    const updated = await prisma.income.update({
      where: { id },
      data: {
        date: date || existing.date,
        amount: newAmount,
        source: source !== undefined ? source : existing.source,
        category: category !== undefined ? category : existing.category,
        accountId: newAccountId,
        paymentMethod: paymentMethod || existing.paymentMethod,
        note: note !== undefined ? note : existing.note,
      },
      include: { user: true, account: true },
    });

    await createAuditLog({
      userId: existing.userId,
      userName: existing.user.name,
      action: 'UPDATE',
      entityType: 'INCOME',
      entityId: id,
      description: `${existing.user.name} daromad yozuvini tahrirladi (${new Intl.NumberFormat('uz-UZ').format(newAmount)} so‘m)`,
      oldData: existing,
      newData: updated,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daromadni o'chirish (Section 24 & 32: Audit saqlanadi)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.body;

    const existing = await prisma.income.findUnique({
      where: { id },
      include: { user: true, recurringInstance: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad topilmadi' });
    }

    if (currentUserId && existing.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Siz faqat o‘zingiz kiritgan yozuvlarni o‘chirishingiz mumkin',
      });
    }

    // Hisob balansidan ayirish
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: existing.amount } },
    });

    // Agar doimiy daromad to'lovi bilan bog'langan bo'lsa, instance paidAmount ini kamaytirish
    if (existing.recurringInstanceId && existing.recurringInstance) {
      const newPaid = Math.max(0, existing.recurringInstance.paidAmount - existing.amount);
      const isPastDue = existing.recurringInstance.dueDate < getTodayString();
      let newStatus = 'PENDING';
      if (newPaid >= existing.recurringInstance.expectedAmount) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIALLY_PAID';
      else if (isPastDue) newStatus = 'OVERDUE';

      await prisma.recurringIncomeInstance.update({
        where: { id: existing.recurringInstanceId },
        data: { paidAmount: newPaid, status: newStatus },
      });
    }

    await prisma.income.delete({ where: { id } });

    await createAuditLog({
      userId: existing.userId,
      userName: existing.user.name,
      action: 'DELETE',
      entityType: 'INCOME',
      entityId: id,
      description: `${existing.user.name} ${new Intl.NumberFormat('uz-UZ').format(existing.amount)} so‘mlik daromad yozuvini o‘chirdi`,
      oldData: existing,
    });

    res.json({ success: true, message: 'Daromad o‘chirildi va hisob balansi qayta hisoblandi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
