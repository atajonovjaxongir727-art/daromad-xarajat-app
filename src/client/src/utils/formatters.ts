export function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 so‘m';
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' so‘m';
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  // agar YYYY-MM-DD bo'lsa
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export function formatDateTime(dateTimeStr: string | undefined | null): string {
  if (!dateTimeStr) return '';
  const [datePart, timePart] = dateTimeStr.split(' ');
  const formattedDate = formatDate(datePart);
  if (timePart) {
    return `${formattedDate} ${timePart.substring(0, 5)}`;
  }
  return formattedDate;
}

export function getMonthName(yearMonth: string): string {
  if (!yearMonth) return '';
  const [y, m] = yearMonth.split('-');
  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || m} ${y}`;
}

export function getStatusInfo(status: string, isOverdue?: boolean, overdueDays?: number) {
  switch (status) {
    case 'PAID':
      return {
        label: 'To‘langan',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-500',
      };
    case 'PARTIALLY_PAID':
      return {
        label: isOverdue ? `Qisman to‘langan (${overdueDays || 0} kun kechikkan)` : 'Qisman to‘langan',
        color: isOverdue ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        badge: 'bg-amber-500',
      };
    case 'OVERDUE':
      return {
        label: overdueDays ? `${overdueDays} kun kechikkan` : 'Kechikkan qarz',
        color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
        badge: 'bg-rose-500',
      };
    case 'PENDING':
    default:
      return {
        label: 'Qarzdor (Kutilmoqda)',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badge: 'bg-indigo-500',
      };
  }
}
