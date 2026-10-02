import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DebtsView } from './components/DebtsView';
import { RecurringIncomeView } from './components/RecurringIncomeView';
import { IncomeView } from './components/IncomeView';
import { ExpenseView } from './components/ExpenseView';
import { AccountsView } from './components/AccountsView';
import { ReportsView } from './components/ReportsView';
import { CalendarView } from './components/CalendarView';
import { HistoryView } from './components/HistoryView';
import { AuditLogView } from './components/AuditLogView';

// Modallar
import { PaymentModal } from './components/PaymentModal';
import { AddIncomeModal } from './components/AddIncomeModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddRecurringModal } from './components/AddRecurringModal';
import { AddAccountModal } from './components/AddAccountModal';
import { UserPinModal } from './components/UserPinModal';
import { ExportModal } from './components/ExportModal';

import {
  DashboardData,
  RecurringIncomeInstance,
  Account,
  ExpenseCategory,
} from './types';

const MainApp: React.FC = () => {
  const { allUsers, currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState<string>('2026-10');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global ma'lumotlar holati
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modallar holati
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebtInstance, setSelectedDebtInstance] = useState<RecurringIncomeInstance | null>(null);

  const [addIncomeModalOpen, setAddIncomeModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [addRecurringModalOpen, setAddRecurringModalOpen] = useState(false);

  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'transfer'>('create');

  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Ma'lumotlarni serverdan yuklash
  const fetchAllData = async (monthOverride?: string) => {
    try {
      const month = monthOverride !== undefined ? monthOverride : selectedDashboardMonth;
      const [dashRes, accRes, catRes] = await Promise.all([
        fetch(`/api/dashboard?month=${month}`).then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
      if (accRes.success && accRes.data?.accounts) {
        setAccounts(accRes.data.accounts);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedDashboardMonth]);

  const handleOpenPayment = (instance: RecurringIncomeInstance) => {
    setSelectedDebtInstance(instance);
    setPaymentModalOpen(true);
  };

  const handleOpenTransfer = () => {
    setAccountModalMode('transfer');
    setAddAccountModalOpen(true);
  };

  const handleOpenAddAccount = () => {
    setAccountModalMode('create');
    setAddAccountModalOpen(true);
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'export') {
      setExportModalOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleMonthChange = (m: string) => {
    setSelectedDashboardMonth(m);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        onAddIncomeClick={() => setAddIncomeModalOpen(true)}
        onAddExpenseClick={() => setAddExpenseModalOpen(true)}
        notifications={dashboardData?.notifications || []}
        todayDate={dashboardData?.today || ''}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Asosiy Ish Maydoni (Sidebar + Content) */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          openDebtCount={dashboardData?.kpi?.overdueCount || 0}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Ogohlantirish banneri (agar kechikkan qarzlar bo'lsa) */}
          {dashboardData?.kpi?.overdueCount ? (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <p className="text-xs font-bold">
                  ⚠️ Diqqat: {dashboardData.kpi.overdueCount} ta to‘lov muddati o‘tgan! Jami kechikkan
                  qarzdorlik: {new Intl.NumberFormat('uz-UZ').format(dashboardData.kpi.overdueDebts)} so‘m.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('debts')}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors whitespace-nowrap ml-4"
              >
                Qarzdorlikni ko‘rish
              </button>
            </div>
          ) : null}

          {/* Tab ko'rinishlari */}
          {currentTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              selectedMonth={selectedDashboardMonth}
              onSelectMonth={handleMonthChange}
              onOpenPaymentModal={handleOpenPayment}
              onNavigateToTab={setCurrentTab}
              onOpenTransferModal={handleOpenTransfer}
            />
          )}

          {currentTab === 'debts' && (
            <DebtsView
              onOpenPaymentModal={handleOpenPayment}
              users={allUsers}
            />
          )}

          {currentTab === 'recurring' && (
            <RecurringIncomeView
              onOpenAddModal={() => setAddRecurringModalOpen(true)}
              users={allUsers}
            />
          )}

          {currentTab === 'income' && (
            <IncomeView
              onOpenAddModal={() => setAddIncomeModalOpen(true)}
              users={allUsers}
              accounts={accounts}
            />
          )}

          {currentTab === 'expense' && (
            <ExpenseView
              onOpenAddModal={() => setAddExpenseModalOpen(true)}
              users={allUsers}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView
              onOpenAddAccountModal={handleOpenAddAccount}
              onOpenTransferModal={handleOpenTransfer}
              users={allUsers}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'calendar' && <CalendarView />}

          {currentTab === 'history' && (
            <HistoryView users={allUsers} accounts={accounts} />
          )}

          {currentTab === 'audit' && <AuditLogView />}
        </main>
      </div>

      {/* Global Modallar */}
      <UserPinModal />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        instance={selectedDebtInstance}
        accounts={accounts}
        users={allUsers}
        onPaymentSuccess={() => fetchAllData()}
      />

      <AddIncomeModal
        isOpen={addIncomeModalOpen}
        onClose={() => setAddIncomeModalOpen(false)}
        accounts={accounts}
        users={allUsers}
        onSuccess={() => fetchAllData()}
      />

      <AddExpenseModal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
        accounts={accounts}
        users={allUsers}
        categories={categories}
        onRefreshCategories={() => fetchAllData()}
        onSuccess={() => fetchAllData()}
      />

      <AddRecurringModal
        isOpen={addRecurringModalOpen}
        onClose={() => setAddRecurringModalOpen(false)}
        users={allUsers}
        onSuccess={() => fetchAllData()}
      />

      <AddAccountModal
        isOpen={addAccountModalOpen}
        onClose={() => setAddAccountModalOpen(false)}
        accounts={accounts}
        users={allUsers}
        defaultMode={accountModalMode}
        onSuccess={() => fetchAllData()}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        dashboardData={dashboardData}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
