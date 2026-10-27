import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { getTodayString } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Barcha qarzdorliklar / Oylik instansiyalar ro'yxati
router.get('/', async (req, res) => {
  try {
    const { status, yearMonth, userId, search, onlyOpen } = req.query;
    const todayStr = getTodayString();

    // MUHIM TALAB: Qarzdorlikka faqat to'lov sanasi kelganda tushsin (oldingi qarz va to'lov sanasi <= bugun)
    const whereConditions: any[] = [
      {
        OR: [
          { yearMonth: 'Oldingi qarz' },
          { dueDate: { lte: todayStr } },
          { paidAmount: { gt: 0 } },
        ],
      },
    ];

    if (yearMonth) {
      whereConditions.push({ yearMonth: String(yearMonth) });
    }

    if (userId) {
      whereConditions.push({ assignedUserId: String(userId) });
    }

    if (onlyOpen === 'true') {
      whereConditions.push({ status: { not: 'PAID' } });
    } else if (status && status !== 'ALL') {
      if (status === 'OPEN') {
        whereConditions.push({ status: { not: 'PAID' } });
      } else {
        whereConditions.push({ status: String(status) });
      }
    }

    if (search) {
      whereConditions.push({
        recurringIncome: {
          title: { contains: String(search), mode: 'insensitive' },
        },
      });
    }

    const instances = await prisma.recurringIncomeInstance.findMany({
      where: { AND: whereConditions },
      include: {
        recurringIncome: true,
        assignedUser: {
          select: { id: true, name: true, avatarColor: true },
        },
        payments: {
          include: {
            account: true,
            receivedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { yearMonth: 'desc' }],
    });

    const enriched = instances.map((inst) => {
      const remainingAmount = Math.max(0, inst.expectedAmount - inst.paidAmount);
      const isPastDue = inst.dueDate < todayStr || inst.yearMonth === 'Oldingi qarz';
      let overdueDays = 0;

      if (isPastDue && remainingAmount > 0) {
        const d1 = new Date(inst.dueDate).getTime();
        const d2 = new Date(todayStr).getTime();
        overdueDays = Math.max(0, Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));
      }

      // Dinamik status: agar to'liq to'langan bo'lsa PAID, qisman to'langan bo'lsa PARTIALLY_PAID, agar kechikkan bo'lsa OVERDUE, aks holda PENDING
      let currentStatus = inst.status;
      if (inst.paidAmount >= inst.expectedAmount) {
        currentStatus = 'PAID';
      } else if (inst.paidAmount > 0) {
        currentStatus = 'PARTIALLY_PAID';
      } else if (isPastDue) {
        currentStatus = 'OVERDUE';
      }

      return {
        ...inst,
        status: currentStatus,
        remainingAmount,
        isOverdue: isPastDue && remainingAmount > 0,
        overdueDays,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// To'lovni qabul qilish (Sections 5 & 6: To'liq yoki Qisman to'lov)
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentDate, accountId, receivedById, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "To'lov summasi musbat bo'lishi kerak" });
    }

    if (!accountId) {
      return res.status(400).json({ success: false, message: "Pul qabul qilinadigan hisob/hamyon tanlanishi shart" });
    }

    if (!receivedById) {
      return res.status(400).json({ success: false, message: "To'lovni qabul qilgan foydalanuvchi tanlanishi shart" });
    }

    const payAmount = Number(amount);
    const payDate = paymentDate || getTodayString();

    // Instansiyani tekshirish
    const instance = await prisma.recurringIncomeInstance.findUnique({
      where: { id },
      include: {
        recurringIncome: true,
        assignedUser: true,
      },
    });

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Qarzdorlik yozuvi topilmadi' });
    }

    const remainingDebt = instance.expectedAmount - instance.paidAmount;
    if (payAmount > remainingDebt) {
      return res.status(400).json({
        success: false,
        message: `Kiritilgan summa (${new Intl.NumberFormat('uz-UZ').format(payAmount)} so'm) qolgan qarzdorlikdan (${new Intl.NumberFormat('uz-UZ').format(remainingDebt)} so'm) ko'p bo'lishi mumkin emas`,
      });
    }

    // Hisobni tekshirish
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Tanlangan hisob topilmadi' });
    }

    const user = await prisma.user.findUnique({
      where: { id: receivedById },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Yangi to'langan summa va holat
    const newPaidAmount = instance.paidAmount + payAmount;
    const isFullyPaid = newPaidAmount >= instance.expectedAmount;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    // 1. Qarzdorlik instansiyasini yangilash
    const updatedInstance = await prisma.recurringIncomeInstance.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // 2. To'lov (Payment) yozuvini yaratish
    const payment = await prisma.payment.create({
      data: {
        recurringInstanceId: instance.id,
        amount: payAmount,
        paymentDate: payDate,
        accountId: account.id,
        receivedById: user.id,
        note: note || `${instance.recurringIncome.title} to'lovi (${instance.yearMonth})`,
      },
    });

    // 3. HAQIQIY DAROMAD YARATISH (Section 5: Pul haqiqatan olingandan keyin daromadga aylanadi)
    const income = await prisma.income.create({
      data: {
        date: payDate,
        amount: payAmount,
        userId: user.id,
        type: 'recurring_payment',
        source: instance.recurringIncome.title,
        category: "Mijoz to'lovi",
        accountId: account.id,
        paymentMethod: account.type,
        recurringInstanceId: instance.id,
        note: note || `${instance.recurringIncome.title} (${instance.yearMonth}) oylik to'lovi`,
      },
    });

    // Payment ga incomeId ni bog'lash
    await prisma.payment.update({
      where: { id: payment.id },
      data: { incomeId: income.id },
    });

    // 4. TANLANGAN HISOB/HAMYON BALANSINI OSHIRISH (Section 20)
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: { increment: payAmount },
      },
    });

    // 5. TRANZAKSIYALAR TARIXIGA YOZISH (Section 21)
    const nowTime = new Date().toTimeString().split(' ')[0];
    await prisma.transaction.create({
      data: {
        date: `${payDate} ${nowTime}`,
        type: 'INCOME',
        amount: payAmount,
        accountId: account.id,
        userId: user.id,
        description: `${instance.recurringIncome.title} to'lovi (${instance.yearMonth})`,
        referenceId: income.id,
        balanceAfter: updatedAccount.balance,
      },
    });

    // 6. AUDIT JURNALIGA YOZISH (Section 33)
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(payAmount);
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RECEIVE_PAYMENT',
      entityType: 'DEBT',
      entityId: instance.id,
      description: `${user.name} '${instance.recurringIncome.title}' dan ${formattedAmount} so'm to'lov qabul qildi (${isFullyPaid ? "To'liq to'landi" : "Qisman to'landi"})`,
      newData: {
        instanceId: instance.id,
        amount: payAmount,
        newStatus,
        paymentId: payment.id,
        incomeId: income.id,
      },
    });

    res.json({
      success: true,
      data: {
        instance: updatedInstance,
        payment,
        income,
        account: updatedAccount,
        isFullyPaid,
        remainingDebt: Math.max(0, instance.expectedAmount - newPaidAmount),
      },
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// To'lovni bekor qilish (Xatolik bo'lsa orqaga qaytarish)
router.delete('/:instanceId/payments/:paymentId', async (req, res) => {
  try {
    const { instanceId, paymentId } = req.params;
    const { currentUserId, currentUserName } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        recurringInstance: { include: { recurringIncome: true } },
      },
    });

    if (!payment || payment.recurringInstanceId !== instanceId) {
      return res.status(404).json({ success: false, message: "To'lov topilmadi" });
    }

    // 1. Hisobdan pulni ayirish
    await prisma.account.update({
      where: { id: payment.accountId },
      data: { balance: { decrement: payment.amount } },
    });

    // 2. Daromad yozuvini o'chirish
    if (payment.incomeId) {
      await prisma.income.delete({
        where: { id: payment.incomeId },
      });
    }

    // 3. Qarzdorlik instansiyasining to'langan summasini kamaytirish
    const newPaidAmount = Math.max(0, payment.recurringInstance.paidAmount - payment.amount);
    let newStatus = 'PENDING';
    const todayStr = getTodayString();
    if (newPaidAmount >= payment.recurringInstance.expectedAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    } else if (payment.recurringInstance.dueDate < todayStr) {
      newStatus = 'OVERDUE';
    }

    await prisma.recurringIncomeInstance.update({
      where: { id: instanceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // 4. Payment ni o'chirish
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    await createAuditLog({
      userId: currentUserId || payment.receivedById,
      userName: currentUserName || 'Foydalanuvchi',
      action: 'DELETE',
      entityType: 'DEBT',
      entityId: instanceId,
      description: `${currentUserName || 'Foydalanuvchi'} ${new Intl.NumberFormat('uz-UZ').format(payment.amount)} so'mlik to'lovni bekor qildi`,
      oldData: payment,
    });

    res.json({ success: true, message: "To'lov bekor qilindi va balans qaytarildi" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
