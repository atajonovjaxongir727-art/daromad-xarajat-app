import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import { RecurringIncomeInstance, User } from '../types';
import { formatMoney, formatDate, getStatusInfo } from '../utils/formatters';

interface DebtsViewProps {
  onOpenPaymentModal: (instance: RecurringIncomeInstance) => void;
  users: User[];
}

export const DebtsView: React.FC<DebtsViewProps> = ({ onOpenPaymentModal, users }) => {
  const [debts, setDebts] = useState<RecurringIncomeInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN'); // default: ochiq qarzlar
  const [userFilter, setUserFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (userFilter) params.append('userId', userFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/debts?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDebts(data.data);
      }
    } catch (err) {
      console.error('Fetch debts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [statusFilter, userFilter, search]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Jami hisob-kitoblar
  const totalExpected = debts.reduce((acc, d) => acc + d.expectedAmount, 0);
  const totalPaid = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const totalRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Sarlavha va Umumiy metrikalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Qarzdorlik va Kutilayotgan To‘lovlar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Doimiy daromadlar asosida avtomatik shakllangan oylik qarzlar
          </p>
        </div>

        <button
          onClick={fetchDebts}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Mini Xulosa kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jami olinishi kerak</p>
          <p className="text-lg font-extrabold text-slate-900 mt-1">{formatMoney(totalRemaining)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{debts.filter(d => d.remainingAmount > 0).length} ta ochiq qarzdorlik</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">To‘langan qismi</p>
          <p className="text-lg font-extrabold text-emerald-600 mt-1">{formatMoney(totalPaid)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Qabul qilib olingan pullar</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kutilgan jami summa</p>
          <p className="text-lg font-extrabold text-slate-700 mt-1">{formatMoney(totalExpected)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Shartnomalar bo‘yicha</p>
        </div>
      </div>

      {/* Filtrlar va Qidiruv */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mijoz yoki manba nomi bo‘yicha qidirish..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filtri */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'OPEN', label: 'Ochiq qarzlar' },
              { id: 'OVERDUE', label: 'Kechikkan' },
              { id: 'PARTIALLY_PAID', label: 'Qisman' },
              { id: 'PAID', label: 'To‘langan' },
              { id: 'ALL', label: 'Barchasi' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === btn.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Mas'ul foydalanuvchi */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha mas‘ullar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Qarzdorliklar jadvali */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : debts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tanlangan filtrlarga mos qarzdorliklar topilmadi
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {debts.map((item) => {
              const statusInfo = getStatusInfo(item.status, item.isOverdue, item.overdueDays);
              const isExpanded = expandedId === item.id;
              const hasPayments = item.payments && item.payments.length > 0;

              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Chap taraf: Mijoz va tafsilotlar */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          item.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-600'
                            : item.isOverdue
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {item.status === 'PAID' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : item.isOverdue ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.recurringIncome.title}
                          </h4>
                          {item.yearMonth === 'Oldingi qarz' ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              Oldingi qarzdorlik
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {getMonthName(item.yearMonth)} ({item.yearMonth})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Muddat: {formatDate(item.dueDate)}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mas‘ul: {item.assignedUser.name}</span>
                          </span>
                          {item.isOverdue && item.overdueDays ? (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                {item.overdueDays} kun kechikkan
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* O'ng taraf: Summalar va Amallar */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 text-left sm:text-right">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Kutilgan</p>
                          <p className="text-xs font-bold text-slate-700">
                            {formatMoney(item.expectedAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">To‘langan</p>
                          <p className="text-xs font-bold text-emerald-600">
                            {formatMoney(item.paidAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Qoldiq qarz</p>
                          <p className="text-sm font-extrabold text-rose-600">
                            {formatMoney(item.remainingAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>

                        {item.remainingAmount > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap"
                          >
                            To‘lovni qabul qilish
                          </button>
                        )}

                        {hasPayments && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="To‘lovlar tarixi"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* To'lovlar tarixi ochiladigan panel */}
                  {isExpanded && item.payments && (
                    <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-2xl p-3 animate-in fade-in">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Amalga oshirilgan to‘lovlar tarixi:
                      </h5>
                      <div className="space-y-2">
                        {item.payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-semibold text-slate-800">
                                {formatDate(p.paymentDate)}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">
                                {p.account?.name || 'Hisob'} ga tushdi
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">
                                Qabul qildi: {p.receivedBy?.name || 'Foydalanuvchi'}
                              </span>
                            </div>
                            <span className="font-bold text-emerald-600">
                              +{formatMoney(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
