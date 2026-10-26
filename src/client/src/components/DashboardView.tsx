import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ArrowRightLeft,
  Calendar,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardData } from '../types';
import { formatMoney, formatDate, getStatusInfo, getMonthName } from '../utils/formatters';

interface DashboardViewProps {
  data: DashboardData | null;
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  onOpenPaymentModal: (instance: any) => void;
  onNavigateToTab: (tab: any) => void;
  onOpenTransferModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
  onOpenPaymentModal,
  onNavigateToTab,
  onOpenTransferModal,
}) => {
  const { setProfileModalOpen } = useAuth();

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        Ma‘lumotlar yuklanmoqda...
      </div>
    );
  }

  const { kpi, users, accounts, upcomingDebts, recentTransactions } = data;

  const monthOptions = [
    { value: '2026-10', label: 'Oktyabr 2026 (Joriy oy)' },
    { value: '2026-09', label: 'Sentyabr 2026' },
    { value: '2026-08', label: 'Avgust 2026' },
    { value: 'ALL', label: 'Barcha davrlar (Jami)' },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Yuqori paneli: Tanlangan oy filtri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Moliyaviy Ko‘rsatkichlar — {selectedMonth === 'ALL' ? 'Barcha davrlar' : getMonthName(selectedMonth)}
          </h2>
          <p className="text-xs text-slate-500">
            {users.ali?.name || '1-foydalanuvchi'} va {users.vali?.name || '2-foydalanuvchi'} uchun daromad, xarajat va hisoblangan sof qoldiq
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. ASOSIY KPI KO'RSATKICHLAR (Section 12) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Jami daromad */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Jami daromad</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
            {formatMoney(kpi.totalIncome)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Haqiqiy olingan pullar</p>
        </div>

        {/* Jami xarajat */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Jami xarajat</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
            {formatMoney(kpi.totalExpense)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Barcha xarajatlar</p>
        </div>

        {/* Sof qoldiq (Section 22: Daromad - Xarajat) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Sof qoldiq</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p
            className={`text-base lg:text-lg font-extrabold tracking-tight ${
              kpi.netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {formatMoney(kpi.netBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Daromad - Xarajat</p>
        </div>

        {/* Olinishi kerak (Kutilayotgan qarzlar) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Olinishi kerak</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
            {formatMoney(kpi.totalReceivable)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Kutilayotgan qarzdorlik</p>
        </div>

        {/* Kechikkan qarzdorlik (Section 17) */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <span>Kechikkan</span>
              {kpi.overdueCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded-full">
                  {kpi.overdueCount}
                </span>
              )}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-extrabold text-rose-700 tracking-tight">
            {formatMoney(kpi.overdueDebts)}
          </p>
          <p className="text-[10px] text-rose-500 mt-0.5">Muddati o‘tgan qarzlar</p>
        </div>

        {/* To'langan (Qarzdan yopilgan) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <span className="text-xs font-bold text-slate-500">To‘langan</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <p className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
            {formatMoney(kpi.totalPaidDebts)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Qarzdan yopilgan pullar</p>
        </div>
      </div>

      {/* 2. IKKI FOYDALANUVCHI BO'YICHA TAQSIMOT (Section 13) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ali */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: users.ali?.color || '#2563eb' }}
              >
                {users.ali?.name[0]}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{users.ali?.name}</h4>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Foydalanuvchi 1
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Daromad:</span>
              <span className="font-bold text-emerald-600">{formatMoney(users.ali?.income)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Xarajat:</span>
              <span className="font-bold text-rose-600">{formatMoney(users.ali?.expense)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Balans:</span>
              <span
                className={users.ali?.balance >= 0 ? 'text-blue-600 font-extrabold' : 'text-rose-600 font-extrabold'}
              >
                {formatMoney(users.ali?.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Vali */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: users.vali?.color || '#10b981' }}
              >
                {users.vali?.name[0]}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{users.vali?.name}</h4>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Foydalanuvchi 2
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Daromad:</span>
              <span className="font-bold text-emerald-600">{formatMoney(users.vali?.income)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Xarajat:</span>
              <span className="font-bold text-rose-600">{formatMoney(users.vali?.expense)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Balans:</span>
              <span
                className={users.vali?.balance >= 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}
              >
                {formatMoney(users.vali?.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* UMUMIY (Jami) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                Σ
              </div>
              <h4 className="text-sm font-bold text-white">UMUMIY NATIJA</h4>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              Kombinatsiyalangan
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Jami daromad:</span>
              <span className="font-bold text-emerald-400">{formatMoney(users.total?.income)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Jami xarajat:</span>
              <span className="font-bold text-rose-400">{formatMoney(users.total?.expense)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-200">Umumiy qoldiq:</span>
              <span className="text-base font-extrabold text-blue-300">
                {formatMoney(users.total?.balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISOBLAR / HAMYONLAR QOLDIG'I (Section 20) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Hisoblar va Hamyonlar</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 ml-1">
              Jami: {formatMoney(accounts.totalBalance)}
            </span>
          </div>
          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pul o‘tkazish</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {accounts.items.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">{acc.name}</p>
                <p className="text-[11px] text-slate-400 capitalize">{acc.type}</p>
              </div>
              <p className="text-sm font-extrabold text-slate-900">{formatMoney(acc.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. KUTILAYOTGAN VA KECHIKKAN QARZDORLIKLAR (Section 16 & 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Olinishi kerak bo‘lgan qarzdorliklar
              </h3>
              <p className="text-xs text-slate-400">Doimiy daromadlar bo‘yicha kutilayotgan to‘lovlar</p>
            </div>
            <button
              onClick={() => onNavigateToTab('debts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Barchasini ko‘rish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingDebts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Barcha to‘lovlar qabul qilingan! Ochiq qarzlar mavjud emas.
              </p>
            ) : (
              upcomingDebts.map((item) => {
                const statusInfo = getStatusInfo(item.status, item.isOverdue, item.overdueDays);
                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {item.isOverdue ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                          {item.yearMonth === 'Oldingi qarz' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Oldingi qarz
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Muddat: {item.yearMonth === 'Oldingi qarz' ? 'Mavjud qarz' : formatDate(item.dueDate)}</span>
                          <span>•</span>
                          <span>Mas‘ul: {item.assignedUser}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-extrabold text-slate-900">
                          {formatMoney(item.remainingAmount)}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenPaymentModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        To‘lovni qabul qilish
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Oxirgi Tranzaksiyalar oqimi (Section 21) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Oxirgi harakatlar</h3>
              <p className="text-xs text-slate-400">Tranzaksiyalar tarixi</p>
            </div>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Tarix</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.slice(0, 6).map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isExpense = tx.type === 'EXPENSE';

              return (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-600'
                          : isExpense
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{tx.date.substring(0, 16)}</p>
                    </div>
                  </div>

                  <span
                    className={`font-bold ${
                      isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-blue-600'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};




