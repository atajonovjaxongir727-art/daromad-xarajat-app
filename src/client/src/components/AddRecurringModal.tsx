import React, { useState, useEffect } from 'react';
import { X, Repeat, AlertCircle, Calendar, UserCheck, Tag, Info } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface AddRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSuccess: () => void;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  isOpen,
  onClose,
  users,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [billingDay, setBillingDay] = useState<number>(10);
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [category, setCategory] = useState<string>('Mijoz to‘lovi');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setBillingDay(10);
      setAssignedUserId(currentUser?.id || users[0]?.id || '');
      setCategory('Mijoz to‘lovi');
      setNote('');
      setError('');
    }
  }, [isOpen, currentUser, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      setError('Manba nomi va oylik summani kiriting');
      return;
    }
    if (!assignedUserId) {
      setError('Mas‘ul foydalanuvchini tanlang');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          billingDay: Number(billingDay),
          assignedUserId,
          category,
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

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Doimiy daromad manbasi</h3>
              <p className="text-xs text-slate-500">Har oy avtomatik qarzdorlik hosil qiluvchi shartnoma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eslatma info banner */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-800 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            Bu ma‘lumot 1 marta kiritiladi. Tizim har oy belgilangan sanada avtomatik ravishda
            <strong> kutilayotgan qarzdorlik</strong> yaratadi. Pul haqiqatda qabul qilingandan so‘nggina
            balansga daromad sifatida qo‘shiladi.
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Manba nomi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Daromad manbasi / Mijoz nomi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: ABC MChJ yoki Shartnoma #12"
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Oylik to'lov */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Oylik to‘lov summasi *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Masalan: 1000000"
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  UZS
                </span>
              </div>
            </div>

            {/* To'lov kuni */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>To‘lov sanasi (har oyning) *</span>
              </label>
              <select
                value={billingDay}
                onChange={(e) => setBillingDay(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Har oyning {day}-sanasi
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mas'ul foydalanuvchi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Mas‘ul foydalanuvchi *</span>
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategoriya */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategoriya</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Mijoz to‘lovi, Ijara, Xizmat"
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Izoh</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shartnoma shartlari yoki tavsif"
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Repeat className="w-4 h-4" />
              <span>{loading ? 'Saqlanmoqda...' : 'Manbani saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
