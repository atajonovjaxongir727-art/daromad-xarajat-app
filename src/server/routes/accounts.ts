import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { getTodayString } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Barcha hisoblar ro'yxati va umumiy qoldiq (Section 20)
router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

    res.json({
      success: true,
      data: {
        accounts,
        totalBalance,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi hisob qo'shish
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, color, icon, isDefault, currentUserId, currentUserName } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Hisob nomi kiritilishi shart' });
    }

    const created = await prisma.account.create({
      data: {
        name,
        type: type || 'cash',
        balance: Number(balance) || 0,
        color: color || '#3b82f6',
        icon: icon || 'wallet',
        isDefault: Boolean(isDefault),
      },
    });

    await createAuditLog({
      userId: currentUserId || 'system',
      userName: currentUserName || 'Foydalanuvchi',
      action: 'CREATE',
      entityType: 'ACCOUNT',
      entityId: created.id,
      description: `${currentUserName || 'Foydalanuvchi'} '${name}' yangi hisobini yaratdi (boshlang‘ich qoldiq: ${new Intl.NumberFormat('uz-UZ').format(created.balance)} so‘m)`,
      newData: created,
    });

    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Hisoblar orasida pul o'tkazish (Transfer)
router.post('/transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, userId, note } = req.body;

    if (!fromAccountId || !toAccountId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Hisoblar va o‘tkazma summasi to‘g‘ri kiritilishi shart' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ success: false, message: 'Bir xil hisoblar orasida o‘tkazma qilib bo‘lmaydi' });
    }

    const fromAcc = await prisma.account.findUnique({ where: { id: fromAccountId } });
    const toAcc = await prisma.account.findUnique({ where: { id: toAccountId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!fromAcc || !toAcc || !user) {
      return res.status(404).json({ success: false, message: 'Hisob yoki foydalanuvchi topilmadi' });
    }

    const transferAmount = Number(amount);
    if (fromAcc.balance < transferAmount) {
      return res.status(400).json({
        success: false,
        message: `'${fromAcc.name}' hisobida yetarli mablag‘ mavjud emas (Mavjud: ${new Intl.NumberFormat('uz-UZ').format(fromAcc.balance)} so‘m)`,
      });
    }

    // 1. Manba hisobidan ayirish
    const updatedFrom = await prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: transferAmount } },
    });

    // 2. Qabul qiluvchi hisobga qo'shish
    const updatedTo = await prisma.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: transferAmount } },
    });

    // 3. Tranzaksiyalarni qayd qilish
    const todayStr = getTodayString();
    const nowTime = new Date().toTimeString().split(' ')[0];

    await prisma.transaction.create({
      data: {
        date: `${todayStr} ${nowTime}`,
        type: 'TRANSFER',
        amount: transferAmount,
        accountId: fromAccountId,
        userId: user.id,
        description: `'${toAcc.name}' hisobiga o‘tkazildi. ${note || ''}`,
        balanceAfter: updatedFrom.balance,
      },
    });

    await prisma.transaction.create({
      data: {
        date: `${todayStr} ${nowTime}`,
        type: 'TRANSFER',
        amount: transferAmount,
        accountId: toAccountId,
        userId: user.id,
        description: `'${fromAcc.name}' hisobidan qabul qilindi. ${note || ''}`,
        balanceAfter: updatedTo.balance,
      },
    });

    // 4. Audit log
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'TRANSFER',
      entityType: 'ACCOUNT',
      entityId: fromAccountId,
      description: `${user.name} '${fromAcc.name}' hisobidan '${toAcc.name}' hisobiga ${new Intl.NumberFormat('uz-UZ').format(transferAmount)} so‘m o‘tkazdi`,
    });

    res.json({
      success: true,
      message: 'Mablag‘ muvaffaqiyatli o‘tkazildi',
      data: { fromAccount: updatedFrom, toAccount: updatedTo },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
