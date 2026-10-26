import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Calendar,
  UserCheck,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecurringIncomeInstance, Account, User } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: RecurringIncomeInstance | null;
  accounts: Account[];
  users: User[];
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  instance,
  accounts,
  users,
  onPaymentSuccess,
}) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [receivedById, setReceivedById] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (instance) {
      const remaining = Math.max(0, instance.expectedAmount - instance.paidAmount);
      setAmount(remaining);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      if (accounts.length > 0) {
        const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
        setAccountId(defaultAcc.id);
      }
      setReceivedById(currentUser?.id || instance.assignedUserId);
      setNote(`${instance.recurringIncome?.title || 'Qarz'} (${instance.yearMonth}) to'lovi`);
      setError('');
    }
  }, [instance, accounts, currentUser]);

  if (!isOpen || !instance) return null;

  const remainingDebt = Math.max(0, instance.expectedAmount - instance.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("To'lov summasini kiriting");
      return;
    }
    if (amount > remainingDebt) {
      setError(`Summa qoldiq qarzdan (${formatMoney(remainingDebt)}) ko'p bo'lishi mumkin emas`);
      return;
    }
    if (!accountId) {
      setError('Pul qabul qilinadigan hisobni tanlang');
      return;
    }
    if (!receivedById) {
      setError("To'lovni qabul qilgan shaxsni tanlang");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/debts/${instance.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentDate,
          accountId,
          receivedById,
          note,
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Xatolik yuz berdi');
        setLoading(false);
        return;
      }

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (_) {}

      setLoading(false);
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Server bilan aloqada xatolik');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-100 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 pt-safe bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">To'lovni qabul qilish</h3>
              <p className="text-xs text-slate-500">
                {instance.recurringIncome?.title || 'Mijoz'} ({instance.yearMonth})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Qarzdorlik kartochkasi */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Kutilgan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {formatMoney(instance.expectedAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">To'langan</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5 truncate">
                  {formatMoney(instance.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Qoldiq qarz</p>
                <p className="text-xs font-black text-rose-600 mt-0.5 truncate">
                  {formatMoney(remainingDebt)}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* To'lov summasi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Qabul qilinayotgan summa (so'm) *
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(remainingDebt)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  To'liq to'lash ({formatMoney(remainingDebt)})
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={remainingDebt}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Summani kiriting"
                  className="w-full text-lg font-black py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  UZS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* To'lov sanasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>To'lov sanasi *</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Kim oldi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kim qabul qildi? *</span>
                </label>
                <select
                  value={receivedById}
                  onChange={(e) => setReceivedById(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Qaysi hisobga */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>Qaysi hisobga / hamyonga tushdi? *</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatMoney(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Izoh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Izoh</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="To'lov haqida qo'shimcha ma'lumot"
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 backdrop-blur border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 z-10 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Saqlanmoqda...' : "To'lovni qabul qilish"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
