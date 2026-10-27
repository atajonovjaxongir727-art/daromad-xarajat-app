import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditService.js';
import { syncRecurringDebts, getTodayString, getCurrentYearMonth } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Barcha doimiy daromad manbalari
router.get('/', async (req, res) => {
  try {
    const todayStr = getTodayString();
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
      // Qarzdorlik faqat to'lov sanasi kelgan oylar va oldingi qarzlar uchun hisoblansin!
      const validInstances = item.instances.filter(
        (i) => i.yearMonth === 'Oldingi qarz' || i.dueDate <= todayStr || i.paidAmount > 0
      );
      const totalExpected = validInstances.reduce((acc, i) => acc + i.expectedAmount, 0);
      const totalPaid = validInstances.reduce((acc, i) => acc + i.paidAmount, 0);
      const openDebt = Math.max(0, totalExpected - totalPaid);

      return {
        ...item,
        totalExpected,
        totalPaid,
        openDebt,
        instanceCount: validInstances.length,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi doimiy daromad qo'shish
router.post('/', async (req, res) => {
  try {
    const {
      title,
      amount,
      initialDebt,
      billingDay,
      assignedUserId,
      category,
      startDate,
      note,
      currentUserId,
      currentUserName,
    } = req.body;

    if (!title || !amount || !billingDay || !assignedUserId) {
      return res.status(400).json({ success: false, message: "Barcha majburiy maydonlarni to'ldiring" });
    }

    const todayStr = getTodayString();
    const effectiveStartDate = startDate || todayStr;
    const prevDebt = initialDebt ? Number(initialDebt) : 0;

    const created = await prisma.recurringIncome.create({
      data: {
        title: title.trim(),
        amount: Number(amount),
        initialDebt: prevDebt,
        billingDay: Number(billingDay),
        assignedUserId,
        category: (category && category.trim()) || "Mijoz to'lovi",
        note: note ? note.trim() : '',
        isActive: true,
        startDate: effectiveStartDate,
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
          dueDate: effectiveStartDate,
          expectedAmount: prevDebt,
          paidAmount: 0,
          status: 'OVERDUE',
          assignedUserId,
          note: "Shartnomagacha bo'lgan oldingi qarzdorlik",
        },
      });
    }

    // Avtomatik joriy oy uchun qarzdorlikni tekshirish (agar to'lov sanasi kelgan bo'lsa)
    await syncRecurringDebts();

    await createAuditLog({
      userId: currentUserId || assignedUserId,
      userName: currentUserName || created.assignedUser.name,
      action: 'CREATE',
      entityType: 'RECURRING',
      entityId: created.id,
      description: `${currentUserName || created.assignedUser.name} '${title}' doimiy daromad manbasini qo'shdi (${new Intl.NumberFormat('uz-UZ').format(Number(amount))} so'm/oy)`,
      newData: created,
    });

    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Doimiy daromadni to'liq tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      amount,
      initialDebt,
      billingDay,
      assignedUserId,
      category,
      startDate,
      note,
      isActive,
      currentUserId,
      currentUserName,
    } = req.body;

    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      include: { assignedUser: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad manbasi topilmadi' });
    }

    const todayStr = getTodayString();
    const updateData: any = {};

    if (title !== undefined && title.trim()) {
      updateData.title = title.trim();
    }
    if (amount !== undefined && Number(amount) > 0) {
      updateData.amount = Number(amount);
    }
    if (billingDay !== undefined && Number(billingDay) >= 1 && Number(billingDay) <= 31) {
      updateData.billingDay = Number(billingDay);
    }
    if (assignedUserId !== undefined && assignedUserId) {
      updateData.assignedUserId = assignedUserId;
    }
    if (category !== undefined) {
      updateData.category = category.trim() || "Mijoz to'lovi";
    }
    if (startDate !== undefined && startDate) {
      updateData.startDate = startDate;
    }
    if (note !== undefined) {
      updateData.note = note.trim();
    }
    if (isActive !== undefined) {
      const newActive = Boolean(isActive);
      updateData.isActive = newActive;
      if (!newActive && !existing.endDate) {
        updateData.endDate = todayStr;
      } else if (newActive) {
        updateData.endDate = null;
      }
    }
    if (initialDebt !== undefined) {
      updateData.initialDebt = Math.max(0, Number(initialDebt));
    }

    // 1. Asosiy RecurringIncome yozuvini yangilash
    const updated = await prisma.recurringIncome.update({
      where: { id },
      data: updateData,
      include: { assignedUser: true },
    });

    // 2. Oldingi qarzdorlikni (initialDebt) xavfsiz boshqarish
    if (initialDebt !== undefined) {
      const newDebtNum = Math.max(0, Number(initialDebt));
      const prevDebtInstance = await prisma.recurringIncomeInstance.findUnique({
        where: {
          recurringIncomeId_yearMonth: {
            recurringIncomeId: id,
            yearMonth: 'Oldingi qarz',
          },
        },
        include: { payments: true },
      });

      if (prevDebtInstance) {
        const paid = prevDebtInstance.paidAmount || 0;
        if (newDebtNum === 0 && paid === 0 && prevDebtInstance.payments.length === 0) {
          await prisma.recurringIncomeInstance.delete({
            where: { id: prevDebtInstance.id },
          });
        } else {
          const finalExpected = Math.max(newDebtNum, paid);
          let newStatus = prevDebtInstance.status;
          if (paid >= finalExpected && finalExpected > 0) {
            newStatus = 'PAID';
          } else if (paid > 0) {
            newStatus = 'PARTIALLY_PAID';
          } else {
            newStatus = 'OVERDUE';
          }

          await prisma.recurringIncomeInstance.update({
            where: { id: prevDebtInstance.id },
            data: {
              expectedAmount: finalExpected,
              status: newStatus,
              assignedUserId: updated.assignedUserId,
            },
          });
        }
      } else if (newDebtNum > 0) {
        await prisma.recurringIncomeInstance.create({
          data: {
            recurringIncomeId: id,
            yearMonth: 'Oldingi qarz',
            dueDate: updated.startDate || todayStr,
            expectedAmount: newDebtNum,
            paidAmount: 0,
            status: 'OVERDUE',
            assignedUserId: updated.assignedUserId,
            note: "Shartnomagacha bo'lgan oldingi qarzdorlik",
          },
        });
      }
    }

    // 3. Agar Mijoz / Manba nomi (title) o'zgargan bo'lsa, ushbu manbaga bog'liq barcha daromadlar (Income.source) ham yangilanadi
    if (title && title.trim() !== existing.title) {
      const instanceIds = (
        await prisma.recurringIncomeInstance.findMany({
          where: { recurringIncomeId: id },
          select: { id: true },
        })
      ).map((inst) => inst.id);

      if (instanceIds.length > 0) {
        await prisma.income.updateMany({
          where: {
            recurringInstanceId: { in: instanceIds },
            source: existing.title,
          },
          data: { source: title.trim() },
        });
      }
    }

    // 4. Agar mas'ul xodim o'zgargan bo'lsa, to'lanmagan oylik qarzdorliklarni ham yangi mas'ulga o'tkazamiz
    if (assignedUserId && assignedUserId !== existing.assignedUserId) {
      await prisma.recurringIncomeInstance.updateMany({
        where: {
          recurringIncomeId: id,
          status: { not: 'PAID' },
        },
        data: { assignedUserId },
      });
    }

    // 5. Agar oylik to'lov summasi yoki sana o'zgargan bo'lsa, joriy oyning hali to'lanmagan instansiyasini ham yangilaymiz
    const currentYM = getCurrentYearMonth();
    const currentInstance = await prisma.recurringIncomeInstance.findUnique({
      where: {
        recurringIncomeId_yearMonth: {
          recurringIncomeId: id,
          yearMonth: currentYM,
        },
      },
    });

    if (currentInstance && currentInstance.paidAmount === 0) {
      const [yNum, mNum] = currentYM.split('-').map(Number);
      const maxDays = new Date(yNum, mNum, 0).getDate();
      const actualDay = Math.min(updated.billingDay, maxDays);
      const newDueDate = `${currentYM}-${String(actualDay).padStart(2, '0')}`;
      const isOverdue = newDueDate < todayStr;

      await prisma.recurringIncomeInstance.update({
        where: { id: currentInstance.id },
        data: {
          expectedAmount: updated.amount,
          dueDate: newDueDate,
          status: isOverdue ? 'OVERDUE' : 'PENDING',
        },
      });
    }

    // 6. Sinxronizatsiyani ishga tushiramiz (faqat to'lov sanasi kelgan qarzlar qoladi)
    await syncRecurringDebts();

    // 7. Audit log yozamiz
    await createAuditLog({
      userId: currentUserId || updated.assignedUserId,
      userName: currentUserName || updated.assignedUser.name,
      action: 'UPDATE',
      entityType: 'RECURRING',
      entityId: id,
      description: `${currentUserName || 'Foydalanuvchi'} '${updated.title}' doimiy daromad manbasining ma'lumotlarini o'zgartirdi (Summa: ${new Intl.NumberFormat('uz-UZ').format(updated.amount)} so'm, Mas'ul: ${updated.assignedUser.name})`,
      oldData: existing,
      newData: updated,
    });

    res.json({
      success: true,
      data: updated,
      message: "Daromad manbasi muvaffaqiyatli o'zgartirildi",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faolsizlantirish / Faollashtirish
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

// O'chirish: Ushbu mijoz va unga tegishli barcha qarzdorliklar avtomatik to'liq o'chiriladi!
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId, currentUserName } = req.body || {};

    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      include: {
        instances: {
          include: { payments: true, incomes: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Daromad manbasi topilmadi' });
    }

    const instanceIds = existing.instances.map((i) => i.id);

    // 1. Agar to'lovlar bo'lsa, ularni tozalaymiz
    if (instanceIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { recurringInstanceId: { in: instanceIds } },
      });

      await prisma.income.deleteMany({
        where: { recurringInstanceId: { in: instanceIds } },
      });

      // 2. Ushbu mijozning barcha qarzdorlik instansiyalarini o'chirish (avtomatik qarzdorlikdan yo'qoladi!)
      await prisma.recurringIncomeInstance.deleteMany({
        where: { recurringIncomeId: id },
      });
    }

    // 3. Asosiy doimiy daromad manbasini o'chirish
    await prisma.recurringIncome.delete({
      where: { id },
    });

    // 4. Audit log yozish
    await createAuditLog({
      userId: currentUserId || existing.assignedUserId,
      userName: currentUserName || 'Foydalanuvchi',
      action: 'DELETE',
      entityType: 'RECURRING',
      entityId: id,
      description: `${currentUserName || 'Foydalanuvchi'} '${existing.title}' doimiy daromad manbasini va unga tegishli barcha qarzdorliklarni o'chirdi`,
      oldData: existing,
    });

    res.json({
      success: true,
      message: `'${existing.title}' va unga tegishli barcha qarzdorliklar muvaffaqiyatli o'chirildi`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
