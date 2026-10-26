import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  AlertCircle,
  Calendar,
  UserCheck,
  Tag,
  Info,
  Clock,
  FileText,
} from 'lucide-react';
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
  const [initialDebt, setInitialDebt] = useState<number | ''>('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [category, setCategory] = useState("Mijoz to'lovi");
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setBillingDay(10);
      setInitialDebt('');
      setAssignedUserId(currentUser?.id || users[0]?.id || '');
      setCategory("Mijoz to'lovi");
      setNote('');
      setError('');
    }
  }, [isOpen, users, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0 || !assignedUserId) {
      setError("Barcha majburiy maydonlarni to'g'ri to'ldiring");
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
          initialDebt: initialDebt ? Number(initialDebt) : 0,
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-100 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 pt-safe bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Doimiy daromad manbasi</h3>
              <p className="text-xs text-slate-500">Oylik to'lovchi mijoz yoki shartnoma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Eslatma info banner */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Tizim har oy belgilangan sanada avtomatik <strong>kutilayotgan qarzdorlik</strong> yaratadi. Pul haqiqatda olingach, balansga daromad sifatida yoziladi.
              </p>
            </div>

            {/* Manba nomi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daromad manbasi / Mijoz nomi *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: 'Mega Trans' MCHJ yoki 'Akmal aka'"
                className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Oylik summa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Oylik summa (so'm) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Masalan: 1500000"
                    className="w-full py-2.5 px-3 text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    UZS
                  </span>
                </div>
              </div>

              {/* To'lov sanasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Har oy to'lov sanasi *</span>
                </label>
                <select
                  value={billingDay}
                  onChange={(e) => setBillingDay(Number(e.target.value))}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Har oyning {d}-sanasi
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Oldingi qarzdorlik (Mavjud eski qarz) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Oldingi (mavjud) qarzdorlik</span>
                </label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                  Eski qarz
                </span>
              </div>
              <div className="relative mt-1">
                <input
                  type="number"
                  min={0}
                  value={initialDebt}
                  onChange={(e) => setInitialDebt(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0 yoki masalan: 3500000"
                  className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  UZS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                Agar mijozning oldingi davrlardan qolib ketgan eski qarzi bo'lsa kiriting. U avtomatik tarzda <strong>Qarzdorliklar</strong> ro'yxatiga tushadi va to'lov tushganda birinchi navbatda yopiladi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mas'ul foydalanuvchi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mas'ul foydalanuvchi *</span>
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  placeholder="Mijoz to'lovi, Ijara, Xizmat"
                  className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
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
                placeholder="Shartnoma shartlari yoki tavsif"
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <Repeat className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Saqlanmoqda...' : 'Shartnomani saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
