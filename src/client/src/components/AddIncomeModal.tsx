import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  AlertCircle,
  Calendar,
  Wallet,
  UserCheck,
  Tag,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Account, User, RecurringIncome } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/formatters';

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
  const [recurringSources, setRecurringSources] = useState<RecurringIncome[]>([]);
  const [isCustomSource, setIsCustomSource] = useState<boolean>(false);
  const [selectedRecurringId, setSelectedRecurringId] = useState<string>('');
  const [selectedOpenDebt, setSelectedOpenDebt] = useState<number | null>(null);

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
      setIsCustomSource(false);
      setSelectedRecurringId('');
      setSelectedOpenDebt(null);
      setCategory("Mijoz to'lovi");
      setNote('');
      setError('');

      fetch('/api/recurring')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setRecurringSources(data.data.filter((item: RecurringIncome) => item.isActive));
          }
        })
        .catch((err) => console.error('Fetch recurring error:', err));
    }
  }, [isOpen, accounts, users, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Daromad summasini to'g'ri kiriting");
      return;
    }
    if (!userId || !source.trim() || !accountId) {
      setError("Barcha majburiy maydonlarni to'ldiring");
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
          source: source.trim(),
          category,
          accountId,
          paymentMethod,
          note,
          recurringIncomeId: selectedRecurringId || undefined,
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
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (_) {}

      setLoading(false);
      onSuccess();
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
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Daromad qo'shish</h3>
              <p className="text-xs text-slate-500">Mijoz to'lovi yoki bir martalik tushum</p>
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
            {/* Summa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daromad summasi (so'm) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Masalan: 500000"
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
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
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

            {/* Kimdan / Manba */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Kimdan / Manba *</label>
                {recurringSources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSource(!isCustomSource);
                      setSource('');
                      setSelectedRecurringId('');
                      setSelectedOpenDebt(null);
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    {isCustomSource ? "Ro'yxatdan tanlash" : "Qo'lda yozish"}
                  </button>
                )}
              </div>

              {!isCustomSource && recurringSources.length > 0 ? (
                <div>
                  <select
                    value={source}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__OTHER__') {
                        setIsCustomSource(true);
                        setSelectedRecurringId('');
                        setSelectedOpenDebt(null);
                        setSource('');
                      } else {
                        setSource(val);
                        const matched = recurringSources.find((r) => r.title === val);
                        if (matched) {
                          setSelectedRecurringId(matched.id);
                          setSelectedOpenDebt(matched.openDebt !== undefined ? matched.openDebt : null);
                          if (!amount) setAmount(matched.amount);
                          if (matched.category) setCategory(matched.category);
                        } else {
                          setSelectedRecurringId('');
                          setSelectedOpenDebt(null);
                        }
                      }
                    }}
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Doimiy mijozni tanlang --</option>
                    {recurringSources.map((r) => (
                      <option key={r.id} value={r.title}>
                        {r.title} ({new Intl.NumberFormat('uz-UZ').format(r.amount)} so'm/oy)
                      </option>
                    ))}
                    <option value="__OTHER__">✍️ Boshqa (qo'lda yozish)...</option>
                  </select>

                  {selectedOpenDebt !== null && selectedOpenDebt > 0 ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span>Mijozning ochiq qarzdorligi:</span>
                        <span>{new Intl.NumberFormat('uz-UZ').format(selectedOpenDebt)} so'm</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-1 leading-normal">
                        ⚡ <strong>Avtomatik:</strong> Kiritilgan to'lov ushbu mijozning qarzdorligidan chegiriladi va qarz kamayadi!
                      </p>
                    </div>
                  ) : selectedOpenDebt === 0 ? (
                    <p className="text-[10px] text-emerald-600 mt-1.5 font-semibold">
                      ✓ Ushbu mijozda hozirda ochiq qarzdorlik yo'q (barcha to'lovlar to'langan)
                    </p>
                  ) : null}
                </div>
              ) : (
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Mijoz yoki korxona nomi"
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Daromad turi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kategoriya</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Masalan: Xizmat, Mahsulot"
                  className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

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
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* To'lov usuli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>To'lov shakli</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="cash">Naqd pul</option>
                  <option value="card">Bank karta</option>
                  <option value="bank">Bank hisob raqami</option>
                  <option value="other">Boshqa</option>
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
                  placeholder="Qo'shimcha tafsilotlar"
                  className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
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
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Saqlanmoqda...' : 'Daromadni saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
