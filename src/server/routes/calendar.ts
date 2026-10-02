import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentYearMonth, getTodayString } from '../services/syncService.js';

const router = Router();
const prisma = new PrismaClient();

// Kalendar ma'lumotlari (Section 18)
router.get('/', async (req, res) => {
  try {
    const yearMonth = (req.query.yearMonth as string) || getCurrentYearMonth();
    const todayStr = getTodayString();

    // Ushbu oydagi barcha daromadlar
    const incomes = await prisma.income.findMany({
      where: { date: { startsWith: yearMonth } },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        account: { select: { id: true, name: true } },
      },
    });

    // Ushbu oydagi barcha xarajatlar
    const expenses = await prisma.expense.findMany({
      where: { date: { startsWith: yearMonth } },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        category: true,
        account: { select: { id: true, name: true } },
      },
    });

    // Ushbu oyda to'lov muddati bo'lgan barcha qarzdorliklar
    const debts = await prisma.recurringIncomeInstance.findMany({
      where: { dueDate: { startsWith: yearMonth } },
      include: {
        recurringIncome: true,
        assignedUser: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Kunlar bo'yicha guruhlash
    const calendarDays: Record<string, {
      date: string;
      incomes: any[];
      expenses: any[];
      expectedDebts: any[];
      overdueDebts: any[];
      totalIncome: number;
      totalExpense: number;
      totalExpected: number;
      totalOverdue: number;
    }> = {};

    // Incomes joylash
    for (const inc of incomes) {
      if (!calendarDays[inc.date]) {
        calendarDays[inc.date] = {
          date: inc.date,
          incomes: [],
          expenses: [],
          expectedDebts: [],
          overdueDebts: [],
          totalIncome: 0,
          totalExpense: 0,
          totalExpected: 0,
          totalOverdue: 0,
        };
      }
      calendarDays[inc.date].incomes.push(inc);
      calendarDays[inc.date].totalIncome += inc.amount;
    }

    // Expenses joylash
    for (const exp of expenses) {
      if (!calendarDays[exp.date]) {
        calendarDays[exp.date] = {
          date: exp.date,
          incomes: [],
          expenses: [],
          expectedDebts: [],
          overdueDebts: [],
          totalIncome: 0,
          totalExpense: 0,
          totalExpected: 0,
          totalOverdue: 0,
        };
      }
      calendarDays[exp.date].expenses.push(exp);
      calendarDays[exp.date].totalExpense += exp.amount;
    }

    // Debts joylash
    for (const d of debts) {
      const remaining = Math.max(0, d.expectedAmount - d.paidAmount);
      if (remaining > 0) {
        if (!calendarDays[d.dueDate]) {
          calendarDays[d.dueDate] = {
            date: d.dueDate,
            incomes: [],
            expenses: [],
            expectedDebts: [],
            overdueDebts: [],
            totalIncome: 0,
            totalExpense: 0,
            totalExpected: 0,
            totalOverdue: 0,
          };
        }

        const isPastDue = d.dueDate < todayStr;
        if (isPastDue) {
          calendarDays[d.dueDate].overdueDebts.push({ ...d, remainingAmount: remaining });
          calendarDays[d.dueDate].totalOverdue += remaining;
        } else {
          calendarDays[d.dueDate].expectedDebts.push({ ...d, remainingAmount: remaining });
          calendarDays[d.dueDate].totalExpected += remaining;
        }
      }
    }

    res.json({
      success: true,
      data: {
        yearMonth,
        today: todayStr,
        days: calendarDays,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
