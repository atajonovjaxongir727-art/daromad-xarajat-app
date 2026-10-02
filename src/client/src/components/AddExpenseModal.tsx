import React, { useState, useEffect } from 'react';
import { X, MinusCircle, AlertCircle, Calendar, Wallet, UserCheck, Tag, CreditCard, Plus } from 'lucide-react';
import { Account, User, ExpenseCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  users: User[];
  categories: ExpenseCategory[];
  onRefreshCategories: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  accounts,
  users,
  categories,
  onRefreshCategories,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Yangi kategoriya qo'shish modal holati
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setUserId(currentUser?.id || users[0]?.id || '');
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        setPaymentMethod(accounts[0].type);
      }
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
      setNote('');
      setError('');
      setShowAddCat(false);
    }
  }, [isOpen, currentUser, users, accounts, categories]);

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), color: '#6366f1' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onRefreshCategories();
        setCategoryId(data.data.id);
        setNewCatName('');
        setShowAddCat(false);
      } else {
        setError(data.message || 'Kategoriya yaratishda xatolik');
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik');
    } finally {
      setCatLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Xarajat summasini to‘g‘ri kiriting');
      return;
    }
    if (!userId || !categoryId || !accountId) {
      setError('Barcha majburiy maydonlarni to‘ldiring');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          date,
          userId,
          categoryId,
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
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <MinusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xarajat kiritish</h3>
              <p className="text-xs text-slate-500">Kassa yoki hisobdan xarajat yozish</p>
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
              Xarajat summasi (so‘m) *
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Masalan: 300000"
                className="w-full text-lg font-bold py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            {/* Kim sarfladi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Kim sarfladi? *</span>
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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

          {/* Kategoriya */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Xarajat kategoriyasi *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Yangi kategoriya</span>
              </button>
            </div>

            {showAddCat ? (
              <div className="flex gap-2 p-2 bg-slate-100 rounded-xl mb-2 animate-in fade-in">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Yangi kategoriya nomi"
                  className="flex-1 py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={catLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Qo‘shish
                </button>
              </div>
            ) : null}

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hisob / Hamyon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>Qaysi hisobdan yechiladi? *</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  const selected = accounts.find((a) => a.id === e.target.value);
                  if (selected) setPaymentMethod(selected.type);
                }}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                <span>To‘lov shakli</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
              placeholder="Masalan: Kanselyariya, tushlik, benzin"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{loading ? 'Saqlanmoqda...' : 'Xarajatni saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
