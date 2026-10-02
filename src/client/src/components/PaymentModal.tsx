import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, Wallet, Calendar, UserCheck } from 'lucide-react';
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
      setNote(`${instance.recurringIncome.title} (${instance.yearMonth}) oylik to‘lovi`);
      setError('');
    }
  }, [instance, accounts, currentUser]);

  if (!isOpen || !instance) return null;

  const remainingDebt = Math.max(0, instance.expectedAmount - instance.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('To‘lov summasini kiriting');
      return;
    }
    if (amount > remainingDebt) {
      setError(`Summa qoldiq qarzdan (${formatMoney(remainingDebt)}) ko‘p bo‘lishi mumkin emas`);
      return;
    }
    if (!accountId) {
      setError('Pul qabul qilinadigan hisobni tanlang');
      return;
    }
    if (!receivedById) {
      setError('To‘lovni qabul qilgan shaxsni tanlang');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/debts/${instance.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentDate,
          accountId,
          receivedById,
          note,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Xatolik yuz berdi');
        setLoading(false);
        return;
      }

      // Agar qarz to'liq yopilsa, bayramona animatsiya (Confetti)
      if (amount >= remainingDebt) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }

      setLoading(false);
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Server bilan bog‘lanishda xatolik');
    }
  };

  const isFullPayment = amount >= remainingDebt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">To‘lovni qabul qilish</h3>
              <p className="text-xs text-slate-500">
                {instance.recurringIncome.title} ({instance.yearMonth})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Qarzdorlik kartochkasi */}
        <div className="p-6 pb-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Kutilgan summa</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {formatMoney(instance.expectedAmount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Oldin to‘langan</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {formatMoney(instance.paidAmount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Qolgan qarzdorlik</p>
              <p className="text-sm font-extrabold text-rose-600 mt-0.5">
                {formatMoney(remainingDebt)}
              </p>
            </div>
          </div>
        </div>

        {/* Xatolik */}
        {error && (
          <div className="mx-6 mb-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forma */}
        <form onSubmit={handleSubmit} className="px-6 py-3 space-y-4 overflow-y-auto flex-1">
          {/* To'lov summasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Qabul qilinayotgan summa (so‘m)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={remainingDebt}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-lg font-bold py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Summani kiriting"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {amount !== remainingDebt && (
                  <button
                    type="button"
                    onClick={() => setAmount(remainingDebt)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                  >
                    To‘liq yopish
                  </button>
                )}
                <span className="text-xs font-semibold text-slate-400">UZS</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Holat:{' '}
              <span className={`font-semibold ${isFullPayment ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isFullPayment ? 'To‘liq to‘lanadi va qarz yopiladi' : `Qisman to‘lov (qoldiq: ${formatMoney(remainingDebt - amount)})`}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sana */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>To‘lov sanasi</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Pul tushadigan hisob */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>Qaysi hisobga tushdi?</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatMoney(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qabul qilgan foydalanuvchi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Kim qabul qildi?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = receivedById === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setReceivedById(u.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                    >
                      {u.name[0]}
                    </div>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Izoh</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo‘shimcha izoh yoki to‘lov cheki"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Pastki tugmalar */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saqlanmoqda...' : 'To‘lovni qabul qilish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
