import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, Calendar, Wallet, UserCheck, Tag, CreditCard } from 'lucide-react';
import { Account, User } from '../types';
import { useAuth } from '../context/AuthContext';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  users: User[];
  onSuccess: () => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  users,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [category, setCategory] = useState<string>('Bir martalik daromad');
  const [accountId, setAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setUserId(currentUser?.id || users[0]?.id || '');
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        setPaymentMethod(accounts[0].type);
      }
      setSource('');
      setCategory('Bir martalik daromad');
      setNote('');
      setError('');
    }
  }, [isOpen, currentUser, users, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Daromad summasini to‘g‘ri kiriting');
      return;
    }
    if (!userId || !accountId) {
      setError('Foydalanuvchi va Hisob tanlanishi shart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          date,
          userId,
          source: source || 'Mijozdan',
          category,
          accountId,
          paymentMethod,
          note,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Xatolik yuz berdi');
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Server bilan aloqada xatolik');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Daromad qo‘shish</h3>
              <p className="text-xs text-slate-500">Bir martalik tushum yoki to‘lov kiritish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Summa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Daromad summasi (so‘m) *
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Masalan: 500000"
                className="w-full text-lg font-bold py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                UZS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sana */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sana *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Kim oldi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Kim oldi? *</span>
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kimdan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kimdan / Manba</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Mijoz yoki korxona nomi"
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Daromad turi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Daromad turi</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Masalan: Konsultatsiya, Freelance"
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hisob / Hamyon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>Qaysi hisobga tushdi? *</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  const selected = accounts.find((a) => a.id === e.target.value);
                  if (selected) setPaymentMethod(selected.type);
                }}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* To'lov usuli */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>To‘lov usuli</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="cash">Naqd pul</option>
                <option value="card">Bank karta</option>
                <option value="bank">Bank hisob raqami</option>
                <option value="other">Boshqa</option>
              </select>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Izoh</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo‘shimcha tafsilotlar"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

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
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Saqlanmoqda...' : 'Daromadni saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
