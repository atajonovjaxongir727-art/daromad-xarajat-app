import React, { useState, useEffect } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Transaction, User, Account } from '../types';
import { formatMoney, formatDateTime } from '../utils/formatters';

interface HistoryViewProps {
  users: User[];
  accounts: Account[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ users, accounts }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (accountFilter) params.append('accountId', accountFilter);
      if (userFilter) params.append('userId', userFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, accountFilter, userFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tranzaksiyalar Tarixi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcha operatsiyalar vaqt bo‘yicha ketma-ketligi (Section 21)
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Filtrlar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tavsif bo‘yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Turi */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha turlar</option>
            <option value="INCOME">Daromadlar (+)</option>
            <option value="EXPENSE">Xarajatlar (-)</option>
            <option value="TRANSFER">O‘tkazmalar (⇄)</option>
          </select>

          {/* Foydalanuvchi */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha foydalanuvchilar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Hisob */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha hisoblar</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tranzaksiyalar topilmadi</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isExpense = tx.type === 'EXPENSE';
              const isTransfer = tx.type === 'TRANSFER';

              return (
                <div
                  key={tx.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-600'
                          : isExpense
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowRightLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{tx.description}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDateTime(tx.date)}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          {tx.account?.name || 'Hisob'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {tx.user?.name || 'Foydalanuvchi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatMoney(tx.amount)}
                    </p>
                    {tx.balanceAfter !== undefined && tx.balanceAfter !== null && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Qoldiq: {formatMoney(tx.balanceAfter)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
