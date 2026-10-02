import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getTodayString(): string {
  // Asia/Tashkent format YYYY-MM-DD
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '10';
  const day = parts.find((p) => p.type === 'day')?.value || '02';
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonth(): string {
  const today = getTodayString();
  return today.substring(0, 7); // "2026-10"
}

export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const diffTime = d2 - d1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function syncRecurringDebts() {
  const todayStr = getTodayString();
  const currentYM = getCurrentYearMonth();

  // Barcha faol doimiy daromadlar
  const recurringList = await prisma.recurringIncome.findMany({
    where: { isActive: true },
    include: { assignedUser: true },
  });

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of recurringList) {
    // Start date dan joriy oygacha bo'lgan oylarni aniqlash
    const startYM = item.startDate ? item.startDate.substring(0, 7) : currentYM;
    const [startYear, startMonth] = startYM.split('-').map(Number);
    const [currYear, currMonth] = currentYM.split('-').map(Number);

    const monthsToCheck: string[] = [];
    let y = startYear;
    let m = startMonth;

    while (y < currYear || (y === currYear && m <= currMonth)) {
      const ymStr = `${y}-${String(m).padStart(2, '0')}`;
      monthsToCheck.push(ymStr);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    for (const ym of monthsToCheck) {
      // Agar endDate bor bo'lsa va undan keyingi oy bo'lsa, o'tkazib yuborish
      if (item.endDate && ym > item.endDate.substring(0, 7)) {
        continue;
      }

      // Ushbu oy uchun instance mavjudligini tekshirish
      const existing = await prisma.recurringIncomeInstance.findUnique({
        where: {
          recurringIncomeId_yearMonth: {
            recurringIncomeId: item.id,
            yearMonth: ym,
          },
        },
      });

      // Max kunlarni hisoblash
      const [yearNum, monthNum] = ym.split('-').map(Number);
      const maxDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const billingDayActual = Math.min(item.billingDay, maxDaysInMonth);
      const dueDate = `${ym}-${String(billingDayActual).padStart(2, '0')}`;

      if (!existing) {
        // Yangi qarzdorlik yaratish (MUHIM: Daromad yoki Balansga qo'shilmaydi!)
        const isOverdue = dueDate < todayStr;
        await prisma.recurringIncomeInstance.create({
          data: {
            recurringIncomeId: item.id,
            yearMonth: ym,
            dueDate: dueDate,
            expectedAmount: item.amount, // Shartnomadagi o'sha paytdagi summa saqlanadi
            paidAmount: 0,
            status: isOverdue ? 'OVERDUE' : 'PENDING',
            assignedUserId: item.assignedUserId,
          },
        });
        createdCount++;
      } else {
        // Mavjud qarz holatini tekshirish (kechikkanlikni yangilash)
        const isUnpaid = existing.paidAmount < existing.expectedAmount;
        const isPastDue = existing.dueDate < todayStr;

        if (isUnpaid && isPastDue) {
          if (existing.paidAmount > 0 && existing.status !== 'PARTIALLY_PAID') {
            await prisma.recurringIncomeInstance.update({
              where: { id: existing.id },
              data: { status: 'PARTIALLY_PAID' },
            });
            updatedCount++;
          } else if (existing.paidAmount === 0 && existing.status !== 'OVERDUE') {
            await prisma.recurringIncomeInstance.update({
              where: { id: existing.id },
              data: { status: 'OVERDUE' },
            });
            updatedCount++;
          }
        }
      }
    }
  }

  // Hisoblashlar va xabarnomalar (Section 27)
  const allInstances = await prisma.recurringIncomeInstance.findMany({
    include: {
      recurringIncome: true,
      assignedUser: true,
      payments: {
        include: {
          account: true,
          receivedBy: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  let todayDueCount = 0;
  let overdueCount = 0;
  let totalOverdueAmount = 0;
  let totalReceivableAmount = 0;

  for (const inst of allInstances) {
    const remaining = Math.max(0, inst.expectedAmount - inst.paidAmount);
    if (remaining > 0) {
      totalReceivableAmount += remaining;
      if (inst.dueDate === todayStr) {
        todayDueCount++;
      }
      if (inst.dueDate < todayStr) {
        overdueCount++;
        totalOverdueAmount += remaining;
      }
    }
  }

  const notifications: string[] = [];
  if (todayDueCount > 0) {
    notifications.push(`Bugun ${todayDueCount} ta to‘lov kutilmoqda.`);
  }
  if (overdueCount > 0) {
    notifications.push(`${overdueCount} ta to‘lov muddati o'tgan.`);
  }
  if (totalOverdueAmount > 0) {
    const formatted = new Intl.NumberFormat('uz-UZ').format(totalOverdueAmount);
    notifications.push(`Jami kechikkan qarzdorlik: ${formatted} so‘m.`);
  }

  return {
    todayStr,
    currentYM,
    createdCount,
    updatedCount,
    todayDueCount,
    overdueCount,
    totalOverdueAmount,
    totalReceivableAmount,
    notifications,
  };
}
