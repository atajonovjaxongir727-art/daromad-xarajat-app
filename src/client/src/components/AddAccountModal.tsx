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
      setError('Barcha maydonlarni to‘g‘ri to‘ldiring');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Ikkita har xil hisobni tanlang');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    if (fromAcc && fromAcc.balance < Number(transferAmount)) {
      setError(`'${fromAcc.name}' hisobida yetarli mablag‘ yo‘q (${formatMoney(fromAcc.balance)})`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
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
              <span>Pul o‘tkazish</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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

        {mode === 'create' ? (
          /* YANGI HISOB YARATISH */
          <form onSubmit={handleCreateAccount} className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hisob nomi *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Naqd pul, Kassa, Kapitalbank karta"
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hisob turi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="cash">Naqd pul</option>
                  <option value="card">Bank karta</option>
                  <option value="bank">Bank hisobi</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Boshlang‘ich qoldiq (so‘m)
                </label>
                <input
                  type="number"
                  min={0}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Hisob rangi</label>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      color === c ? 'scale-110 border-slate-900 shadow-sm' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
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
                <Wallet className="w-4 h-4" />
                <span>{loading ? 'Saqlanmoqda...' : 'Hisobni ochish'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* PUL O'TKAZISH (TRANSFER) */
          <form onSubmit={handleTransfer} className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qaysi hisobdan? *
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qaysi hisobga? *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                O‘tkazma summasi (so‘m) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Summani kiriting"
                  className="w-full text-base font-bold py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
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
                placeholder="O‘tkazma sababi (masalan: Kartadan naqd yechib olindi)"
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
                <ArrowRightLeft className="w-4 h-4" />
                <span>{loading ? 'O‘tkazilmoqda...' : 'O‘tkazishni tasdiqlash'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
