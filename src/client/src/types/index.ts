export interface User {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
}

export interface Account {
  id: string;
  name: string;
  type: string; // cash, card, bank, other
  balance: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface RecurringIncome {
  id: string;
  title: string;
  amount: number;
  initialDebt?: number;
  billingDay: number;
  assignedUserId: string;
  assignedUser?: User;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  category: string;
  note?: string;
  totalExpected?: number;
  totalPaid?: number;
  openDebt?: number;
  instanceCount?: number;
}

export interface RecurringIncomeInstance {
  id: string;
  recurringIncomeId: string;
  recurringIncome: RecurringIncome;
  yearMonth: string;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  assignedUserId: string;
  assignedUser: User;
  isOverdue?: boolean;
  overdueDays?: number;
  note?: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  recurringInstanceId: string;
  amount: number;
  paymentDate: string;
  accountId: string;
  account?: Account;
  receivedById: string;
  receivedBy?: User;
  incomeId?: string;
  note?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  userId: string;
  user: User;
  type: 'recurring_payment' | 'one_time';
  source: string;
  category: string;
  accountId: string;
  account: Account;
  paymentMethod: string;
  recurringInstanceId?: string;
  note?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  userId: string;
  user: User;
  categoryId: string;
  category: ExpenseCategory;
  accountId: string;
  account: Account;
  paymentMethod: string;
  note?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEBT_PAYMENT';
  amount: number;
  accountId: string;
  account: Account;
  userId: string;
  user?: User;
  description: string;
  balanceAfter?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}

export interface DashboardData {
  today: string;
  currentMonth: string;
  kpi: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalReceivable: number;
    overdueDebts: number;
    totalPaidDebts: number;
    overdueCount: number;
    todayDueCount: number;
  };
  users: {
    ali: {
      id: string;
      name: string;
      color: string;
      income: number;
      expense: number;
      balance: number;
    };
    vali: {
      id: string;
      name: string;
      color: string;
      income: number;
      expense: number;
      balance: number;
    };
    total: {
      income: number;
      expense: number;
      balance: number;
    };
  };
  accounts: {
    items: Account[];
    totalBalance: number;
  };
  upcomingDebts: Array<{
    id: string;
    title: string;
    dueDate: string;
    yearMonth: string;
    expectedAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    assignedUser: string;
    isOverdue: boolean;
    overdueDays: number;
  }>;
  recentTransactions: Transaction[];
  notifications: string[];
}
