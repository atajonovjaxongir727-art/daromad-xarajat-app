import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { syncRecurringDebts, getTodayString } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Barcha doimiy daromad manbalari
router.get('/', async (req, res) => {
  try {
    const list = await prisma.recurringIncome.findMany({
      include: {
        assignedUser: {
          select: { id: true, name: true, avatarColor: true },
        },
        instances: {
          select: {
            id: true,
            yearMonth: true,
            dueDate: true,
            expectedAmount: true,
            paidAmount: true,
            status: true,
          },
          orderBy: { yearMonth: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = list.map((item) => {
      const totalExpected = item.instances.reduce((acc, i) => acc + i.expectedAmount, 0);
      const totalPaid = item.instances.reduce((acc, i) => acc + i.paidAmount, 0);
      const openDebt = Math.max(0, totalExpected - totalPaid);

      return {
        ...item,
        totalExpected,
        totalPaid,
        openDebt,
        instanceCount: item.instances.length,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi doimiy daromad qo'shish (Section 3)
router.post('/', async (req, res) => {
  try {
    const { title, amount, initialDebt, billingDay, assignedUserId, category, note, currentUserId, currentUserName } = req.body;

    if (!title || !amount || !billingDay || !assignedUserId) {
      return res.status(400).json({ success: false, message: 'Barcha majburiy maydonlarni to‘ldiring' });
    }

    const todayStr = getTodayString();
    const prevDebt = initialDebt ? Number(initialDebt) : 0;

    const created = await prisma.recurringIncome.create({
      data: {
        title,
        amount: Number(amount),
        initialDebt: prevDebt,
        billingDay: Number(billingDay),
        assignedUserId,
        category: category || 'Mijoz to‘lovi',
        note: note || '',
        isActive: true,
        startDate: todayStr,
      },
      include: {
        assignedUser: true,
      },
    });

    // Agar oldingi qarzdorlik kiritilgan bo'lsa, uni avtomatik qarzdorlik instansiyasi qilib yaratamiz
    if (prevDebt > 0) {
      await prisma.recurringIncomeInstance.create({
        data: {
          recurringIncomeId: created.id,
          yearMonth: 'Oldingi qarz',
          dueDate: todayStr,
          expectedAmount: prevDebt,
          paidAmount: 0,
          status: 'OVERDUE',
          assignedUserId,
          note: "Shartnomagacha bo'lgan oldingi qarzdorlik",
        },
      });
    }

    // Avtomatik joriy oy uchun qarzdorlikni yaratish
    await syncRecurringDebts();

    await createAuditLog({
      userId: currentUserId || assignedUserId,
      userName: currentUserName || created.assignedUser.name,
      action: 'CREATE',
      entityType: 'RECURRING',
      entityId: created.id,
      description: `${currentUserName || created.assignedUser.name} '${title}' doimiy daromad manbasini qo‘shdi (${new Intl.NumberFormat('uz-UZ').format(Number(amount))} so‘m/oy)`,
      newData: created,
    });

    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doimiy daromadni tahrirlash (Section 7: Tarix buzilmasin!)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, billingDay, assignedUserId, category, note, currentUserId, currentUserName } = req.body;

    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      include: { assignedUser: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad manbasi topilmadi' });
    }

    const updated = await prisma.recurringIncome.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        billingDay: billingDay !== undefined ? Number(billingDay) : existing.billingDay,
        assignedUserId: assignedUserId !== undefined ? assignedUserId : existing.assignedUserId,
        category: category !== undefined ? category : existing.category,
        note: note !== undefined ? note : existing.note,
      },
      include: { assignedUser: true },
    });

    await createAuditLog({
      userId: currentUserId || updated.assignedUserId,
      userName: currentUserName || updated.assignedUser.name,
      action: 'UPDATE',
      entityType: 'RECURRING',
      entityId: id,
      description: `${currentUserName || 'Foydalanuvchi'} '${updated.title}' doimiy daromadini tahrirladi (yangi oylar uchun ${new Intl.NumberFormat('uz-UZ').format(updated.amount)} so‘m/oy belgilandi)`,
      oldData: existing,
      newData: updated,
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faolsizlantirish / Faollashtirish (Section 8)
router.post('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, currentUserName } = req.body;

    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      include: { assignedUser: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad manbasi topilmadi' });
    }

    const todayStr = getTodayString();
    const newActiveState = !existing.isActive;

    const updated = await prisma.recurringIncome.update({
      where: { id },
      data: {
        isActive: newActiveState,
        endDate: newActiveState ? null : todayStr,
      },
    });

    const actionText = newActiveState ? 'faollashtirdi' : 'faolsizlantirdi';

    await createAuditLog({
      userId: currentUserId || existing.assignedUserId,
      userName: currentUserName || existing.assignedUser.name,
      action: newActiveState ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: 'RECURRING',
      entityId: id,
      description: `${currentUserName || existing.assignedUser.name} '${existing.title}' doimiy daromad manbasini ${actionText}`,
      oldData: { isActive: existing.isActive },
      newData: { isActive: newActiveState },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// O'chirish
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, currentUserName } = req.body;

    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      include: { instances: { include: { payments: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad manbasi topilmadi' });
    }

    // Agar to'langan to'lovlar bo'lsa, o'chirish o'rniga faolsizlantirishni tavsiya qilamiz yoki audit log bilan saqlaymiz
    const hasPayments = existing.instances.some((inst) => inst.payments.length > 0);
    if (hasPayments) {
      return res.status(400).json({
        success: false,
        message: 'Ushbu manba bo‘yicha to‘lovlar amalga oshirilgan. Tarixni saqlab qolish uchun uni o‘chirish o‘rniga "Faolsizlantirish" tugmasidan foydalaning.',
      });
    }

    await prisma.recurringIncome.delete({
      where: { id },
    });

    await createAuditLog({
      userId: currentUserId || existing.assignedUserId,
      userName: currentUserName || 'Foydalanuvchi',
      action: 'DELETE',
      entityType: 'RECURRING',
      entityId: id,
      description: `${currentUserName || 'Foydalanuvchi'} '${existing.title}' doimiy daromad manbasini o‘chirdi`,
      oldData: existing,
    });

    res.json({ success: true, message: 'Muvaffaqiyatli o‘chirildi' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
