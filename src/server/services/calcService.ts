import { PrismaClient } from '@prisma/client';
import { getTodayString, getCurrentYearMonth } from './syncService.js';

const prisma = new PrismaClient();

export async function getDashboardSummary(selectedMonth?: string) {
  const todayStr = getTodayString();
  const isAllTime = selectedMonth === 'ALL';
  const currentYM = isAllTime ? 'ALL' : (selectedMonth || getCurrentYearMonth());

  // Foydalanuvchilarni olish
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  const ali = users.find((u) => u.name === 'Ali') || users[0];
  const vali = users.find((u) => u.name === 'Vali') || users[1];

  // Tanlangan oy yoki umumiy vaqt bo'yicha daromadlar
  const incomeWhere: any = {};
  if (!isAllTime) {
    incomeWhere.date = { startsWith: currentYM };
  }
  const monthIncomes = await prisma.income.findMany({
    where: incomeWhere,
    include: {
      user: true,
      account: true,
    },
  });

  // Tanlangan oy yoki umumiy vaqt bo'yicha xarajatlar
  const expenseWhere: any = {};
  if (!isAllTime) {
    expenseWhere.date = { startsWith: currentYM };
  }
  const monthExpenses = await prisma.expense.findMany({
    where: expenseWhere,
    include: {
      user: true,
      category: true,
      account: true,
    },
  });

  // Summalar
  let totalIncome = 0;
  let aliIncome = 0;
  let valiIncome = 0;

  for (const inc of monthIncomes) {
    totalIncome += inc.amount;
    if (ali && inc.userId === ali.id) aliIncome += inc.amount;
    if (vali && inc.userId === vali.id) valiIncome += inc.amount;
  }

  let totalExpense = 0;
  let aliExpense = 0;
  let valiExpense = 0;

  for (const exp of monthExpenses) {
    totalExpense += exp.amount;
    if (ali && exp.userId === ali.id) aliExpense += exp.amount;
    if (vali && exp.userId === vali.id) valiExpense += exp.amount;
  }

  // Formula: Sof balans = Haqiqiy olingan daromad - Haqiqiy xarajat
  const netBalance = totalIncome - totalExpense;
  const aliBalance = aliIncome - aliExpense;
  const valiBalance = valiIncome - valiExpense;

  // Qarzdorliklar
  const allInstances = await prisma.recurringIncomeInstance.findMany({
    include: {
      recurringIncome: true,
      assignedUser: true,
      payments: {
        include: { account: true, receivedBy: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  let totalReceivable = 0;
  let overdueDebts = 0;
  let overdueCount = 0;
  let todayDueCount = 0;
  let totalPaidDebts = 0;

  for (const inst of allInstances) {
    const remaining = Math.max(0, inst.expectedAmount - inst.paidAmount);
    totalPaidDebts += inst.paidAmount;

    if (remaining > 0) {
      totalReceivable += remaining;
      if (inst.dueDate < todayStr) {
        overdueDebts += remaining;
        overdueCount++;
      }
      if (inst.dueDate === todayStr) {
        todayDueCount++;
      }
    }
  }

  // Hisoblar / Hamyonlar qoldig'i
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'asc' },
  });
  const totalAccountBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Oxirgi tranzaksiyalar
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    include: {
      account: true,
    },
  });

  // Kutilayotgan yaqin to'lovlar
  const upcomingDebts = allInstances
    .filter((inst) => inst.expectedAmount > inst.paidAmount)
    .slice(0, 6)
    .map((inst) => ({
      id: inst.id,
      title: inst.recurringIncome.title,
      dueDate: inst.dueDate,
      yearMonth: inst.yearMonth,
      expectedAmount: inst.expectedAmount,
      paidAmount: inst.paidAmount,
      remainingAmount: inst.expectedAmount - inst.paidAmount,
      status: inst.status,
      assignedUser: inst.assignedUser.name,
      isOverdue: inst.dueDate < todayStr,
      overdueDays: inst.dueDate < todayStr ? Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0,
    }));

  return {
    today: todayStr,
    currentMonth: currentYM,
    kpi: {
      totalIncome,
      totalExpense,
      netBalance,
      totalReceivable,
      overdueDebts,
      totalPaidDebts,
      overdueCount,
      todayDueCount,
    },
    users: {
      ali: {
        id: ali?.id,
        name: ali?.name || 'Ali',
        color: ali?.avatarColor || '#2563eb',
        income: aliIncome,
        expense: aliExpense,
        balance: aliBalance,
      },
      vali: {
        id: vali?.id,
        name: vali?.name || 'Vali',
        color: vali?.avatarColor || '#10b981',
        income: valiIncome,
        expense: valiExpense,
        balance: valiBalance,
      },
      total: {
        income: totalIncome,
        expense: totalExpense,
        balance: netBalance,
      },
    },
    accounts: {
      items: accounts,
      totalBalance: totalAccountBalance,
    },
    upcomingDebts,
    recentTransactions,
  };
}

export async function getDetailedReport(yearMonth: string) {
  const todayStr = getTodayString();

  // Tanlangan oy daromadlari
  const incomes = await prisma.income.findMany({
    where: { date: { startsWith: yearMonth } },
    include: { user: true, account: true },
    orderBy: { date: 'desc' },
  });

  // Tanlangan oy xarajatlari
  const expenses = await prisma.expense.findMany({
    where: { date: { startsWith: yearMonth } },
    include: { user: true, category: true, account: true },
    orderBy: { date: 'desc' },
  });

  // Tanlangan oy qarzdorlik instansiyalari
  const instances = await prisma.recurringIncomeInstance.findMany({
    where: { yearMonth },
    include: { recurringIncome: true, assignedUser: true, payments: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let aliIncome = 0;
  let valiIncome = 0;
  let aliExpense = 0;
  let valiExpense = 0;

  for (const inc of incomes) {
    totalIncome += inc.amount;
    if (inc.user.name === 'Ali') aliIncome += inc.amount;
    if (inc.user.name === 'Vali') valiIncome += inc.amount;
  }

  for (const exp of expenses) {
    totalExpense += exp.amount;
    if (exp.user.name === 'Ali') aliExpense += exp.amount;
    if (exp.user.name === 'Vali') valiExpense += exp.amount;
  }

  let totalReceivable = 0;
  let totalPaid = 0;
  let overdueDebts = 0;

  for (const inst of instances) {
    totalPaid += inst.paidAmount;
    const remaining = Math.max(0, inst.expectedAmount - inst.paidAmount);
    if (remaining > 0) {
      totalReceivable += remaining;
      if (inst.dueDate < todayStr) {
        overdueDebts += remaining;
      }
    }
  }

  const categoryMap: Record<string, { name: string; amount: number; color: string; count: number }> = {};
  for (const exp of expenses) {
    const catName = exp.category.name;
    if (!categoryMap[catName]) {
      categoryMap[catName] = {
        name: catName,
        amount: 0,
        color: exp.category.color,
        count: 0,
      };
    }
    categoryMap[catName].amount += exp.amount;
    categoryMap[catName].count++;
  }

  const categoryExpenses = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

  // So'nggi 6 oylik dinamika
  const [year, month] = yearMonth.split('-').map(Number);
  const lastMonths: string[] = [];
  let curY = year;
  let curM = month;
  for (let i = 5; i >= 0; i--) {
    let ymMonth = curM - i;
    let ymYear = curY;
    while (ymMonth <= 0) {
      ymMonth += 12;
      ymYear -= 1;
    }
    lastMonths.push(`${ymYear}-${String(ymMonth).padStart(2, '0')}`);
  }

  const trendData = [];
  for (const ym of lastMonths) {
    const incAgg = await prisma.income.aggregate({
      where: { date: { startsWith: ym } },
      _sum: { amount: true },
    });
    const expAgg = await prisma.expense.aggregate({
      where: { date: { startsWith: ym } },
      _sum: { amount: true },
    });

    const inc = incAgg._sum.amount || 0;
    const exp = expAgg._sum.amount || 0;

    const [y, m] = ym.split('-');
    const monthNames = [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ];
    const label = `${monthNames[parseInt(m, 10) - 1]} ${y}`;

    trendData.push({
      yearMonth: ym,
      label,
      daromad: inc,
      xarajat: exp,
      qoldiq: inc - exp,
    });
  }

  return {
    yearMonth,
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      totalReceivable,
      totalPaid,
      overdueDebts,
      aliIncome,
      valiIncome,
      aliExpense,
      valiExpense,
      aliBalance: aliIncome - aliExpense,
      valiBalance: valiIncome - valiExpense,
    },
    categoryExpenses,
    trendData,
    incomes,
    expenses,
    debts: instances,
  };
}
