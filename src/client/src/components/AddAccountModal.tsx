import React, { useState, useEffect } from 'react';
import { X, Wallet, ArrowRightLeft, Plus, AlertCircle } from 'lucide-react';
import { Account, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/formatters';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  users: User[];
  defaultMode?: 'create' | 'transfer';
  onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  accounts,
  users,
  defaultMode = 'create',
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<'create' | 'transfer'>(defaultMode);

  // Yangi hisob maydonlari
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState<number | ''>('');
  const [color, setColor] = useState('#3b82f6');

  // Pul o'tkazish maydonlari
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setName('');
      setType('cash');
      setBalance('');
      setColor('#3b82f6');
      if (accounts.length >= 2) {
        setFromAccountId(accounts[0].id);
        setToAccountId(accounts[1].id);
      } else if (accounts.length === 1) {
        setFromAccountId(accounts[0].id);
      }
      setTransferAmount('');
      setTransferNote('');
      setError('');
    }
  }, [isOpen, defaultMode, accounts]);

  if (!isOpen) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Hisob nomini kiriting');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          balance: Number(balance) || 0,
          color,
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !transferAmount || Number(transferAmount) <= 0) {
      setError("Barcha maydonlarni to'g'ri to'ldiring");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Ikkita har xil hisobni tanlang');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    if (fromAcc && fromAcc.balance < Number(transferAmount)) {
      setError(`'${fromAcc.name}' hisobida yetarli mablag' yo'q (${formatMoney(fromAcc.balance)})`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: Number(transferAmount),
          userId: currentUser?.id || users[0]?.id,
          note: transferNote,
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
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 pt-safe">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'create'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi hisob</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('transfer'); setError(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'transfer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Pul o'tkazish</span>
            </button>
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

        {mode === 'create' ? (
          /* YANGI HISOB YARATISH */
          <form onSubmit={handleCreateAccount} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hisob yoki hamyon nomi *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Asosiy Karta, Naqd pul g'aznasi"
                  className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hisob turi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="cash">Naqd pul hamyoni</option>
                  <option value="card">Bank plastik kartasi (Uzcard/Humo/Visa)</option>
                  <option value="bank">Bank hisob raqami (Hisob-kitob varag'i)</option>
                  <option value="other">Boshqa elektron hamyon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Boshlang'ich qoldiq (so'm)
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rang belgisi</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0"
                  />
                  <span className="text-xs font-semibold text-slate-500">{color}</span>
                </div>
              </div>
            </div>

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
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? 'Saqlanmoqda...' : 'Hisobni saqlash'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* PUL O'TKAZISH (TRANSFER) */
          <form onSubmit={handleTransfer} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qaysi hisobdan (Chiquvchi) *
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qaysi hisobga (Kiruvchi) *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatMoney(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  O'tkazma summasi (so'm) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Masalan: 200000"
                    className="w-full text-base font-black py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    UZS
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Izoh</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Masalan: Kartadan naqdlashtirish"
                  className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

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
                <ArrowRightLeft className="w-4 h-4" />
                <span>{loading ? 'Bajarilmoqda...' : "O'tkazishni tasdiqlash"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
