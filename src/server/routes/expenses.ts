import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { getTodayString } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Xarajatlar ro'yxati (Filtr va qidiruv bilan)
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, userId, categoryId, accountId, search } = req.query;

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

    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    if (accountId) {
      where.accountId = String(accountId);
    }

    if (search) {
      where.OR = [
        { note: { contains: String(search) } },
        { category: { name: { contains: String(search) } } },
      ];
    }

    const items = await prisma.expense.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        category: true,
        account: { select: { id: true, name: true, type: true, color: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat kiritish (Section 10 & 35)
router.post('/', async (req, res) => {
  try {
    const { date, amount, userId, categoryId, accountId, paymentMethod, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Xarajat summasi musbat bo‘lishi kerak' });
    }

    if (!userId || !categoryId || !accountId) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi, Kategoriya va Hisob tanlanishi shart' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });

    if (!user || !account || !category) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi, Hisob yoki Kategoriya topilmadi' });
    }

    const expAmount = Number(amount);
    const expDate = date || getTodayString();

    // 1. Xarajat yozuvini yaratish
    const createdExpense = await prisma.expense.create({
      data: {
        date: expDate,
        amount: expAmount,
        userId: user.id,
        categoryId: category.id,
        accountId: account.id,
        paymentMethod: paymentMethod || account.type,
        note: note || '',
      },
      include: {
        user: true,
        category: true,
        account: true,
      },
    });

    // 2. Tanlangan hisobdan pulni ayirish (Section 20 & 35)
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: { balance: { decrement: expAmount } },
    });

    // 3. Tranzaksiyalar tarixiga yozish (Section 21)
    const nowTime = new Date().toTimeString().split(' ')[0];
    await prisma.transaction.create({
      data: {
        date: `${expDate} ${nowTime}`,
        type: 'EXPENSE',
        amount: expAmount,
        accountId: account.id,
        userId: user.id,
        description: `${category.name}: ${note || 'Xarajat'}`,
        referenceId: createdExpense.id,
        balanceAfter: updatedAccount.balance,
      },
    });

    // 4. Audit Log (Section 33)
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entityType: 'EXPENSE',
      entityId: createdExpense.id,
      description: `${user.name} ${new Intl.NumberFormat('uz-UZ').format(expAmount)} so‘mlik '${category.name}' xarajati kiritdi`,
      newData: createdExpense,
    });

    res.json({ success: true, data: createdExpense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni tahrirlash (Section 24: Huquq tekshiriladi)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, categoryId, accountId, paymentMethod, note, currentUserId } = req.body;

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { user: true, category: true, account: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    if (currentUserId && existing.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Siz faqat o‘zingiz kiritgan yozuvlarni tahrirlashingiz mumkin',
      });
    }

    const newAmount = amount !== undefined ? Number(amount) : existing.amount;
    const newAccountId = accountId || existing.accountId;
    const diff = newAmount - existing.amount;

    // Balansni qayta moslashtirish (xarajat oshsa hisob kamayadi, xarajat kamaysa hisob oshadi)
    if (newAccountId === existing.accountId) {
      if (diff !== 0) {
        await prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: diff } },
        });
      }
    } else {
      // Eski hisobga pulni qaytarish, yangisidan ayirish
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
      await prisma.account.update({
        where: { id: newAccountId },
        data: { balance: { decrement: newAmount } },
      });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        date: date || existing.date,
        amount: newAmount,
        categoryId: categoryId || existing.categoryId,
        accountId: newAccountId,
        paymentMethod: paymentMethod || existing.paymentMethod,
        note: note !== undefined ? note : existing.note,
      },
      include: { user: true, category: true, account: true },
    });

    await createAuditLog({
      userId: existing.userId,
      userName: existing.user.name,
      action: 'UPDATE',
      entityType: 'EXPENSE',
      entityId: id,
      description: `${existing.user.name} '${updated.category.name}' xarajatini tahrirladi (${new Intl.NumberFormat('uz-UZ').format(newAmount)} so‘m)`,
      oldData: existing,
      newData: updated,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni o'chirish (Section 24 & 32)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.body;

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { user: true, category: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    if (currentUserId && existing.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Siz faqat o‘zingiz kiritgan yozuvlarni o‘chirishingiz mumkin',
      });
    }

    // Hisob balansiga pulni qaytarish
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: existing.amount } },
    });

    await prisma.expense.delete({ where: { id } });

    await createAuditLog({
      userId: existing.userId,
      userName: existing.user.name,
      action: 'DELETE',
      entityType: 'EXPENSE',
      entityId: id,
      description: `${existing.user.name} ${new Intl.NumberFormat('uz-UZ').format(existing.amount)} so‘mlik '${existing.category.name}' xarajatini o‘chirdi`,
      oldData: existing,
    });

    res.json({ success: true, message: 'Xarajat o‘chirildi va hisob balansi tiklandi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
