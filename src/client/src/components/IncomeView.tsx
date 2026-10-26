import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Wallet,
  UserCheck,
  CreditCard,
  RotateCcw,
  Tag,
  X,
} from 'lucide-react';
import { Income, User, Account } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface IncomeViewProps {
  onOpenAddModal: () => void;
  users: User[];
  accounts: Account[];
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  onOpenAddModal,
  users,
  accounts,
}) => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Tahrirlash holati
  const [editingItem, setEditingItem] = useState<Income | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editSource, setEditSource] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (userFilter) params.append('userId', userFilter);
      if (accountFilter) params.append('accountId', accountFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`/api/income?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Fetch income error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, userFilter, accountFilter, typeFilter]);

  const handleDelete = async (item: Income) => {
    if (currentUser && item.userId !== currentUser.id) {
      alert("Siz faqat o'zingiz kiritgan yozuvlarni o'chirishingiz mumkin!");
      return;
    }

    if (!window.confirm(`Haqiqatan ham '${item.source}' daromadini o'chirishni xohlaysizmi? Balans qayta hisoblanadi.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/income/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      } else {
        alert(data.message || "O'chirishda xatolik");
      }
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (item: Income) => {
    if (currentUser && item.userId !== currentUser.id) {
      alert("Siz faqat o'zingiz kiritgan yozuvlarni tahrirlashingiz mumkin!");
      return;
    }
    setEditingItem(item);
    setEditAmount(item.amount);
    setEditSource(item.source);
    setEditCategory(item.category);
    setEditNote(item.note || '');
    setEditAccountId(item.accountId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editAmount) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/income/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          source: editSource,
          category: editCategory,
          note: editNote,
          accountId: editAccountId,
          currentUserId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchItems();
      } else {
        alert(data.message || 'Xatolik');
      }
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalSum = items.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Daromadlar Tarixi va Tushumlar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Qabul qilingan barcha daromadlar va to'lovlar jurnali
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm active:scale-95"
            title="Yangilash"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Daromad qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filtrlar va Qidiruv */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mijoz, manba yoki izoh bo'yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="">Barcha foydalanuvchilar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="">Barcha hisoblar</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="">Barcha turlar</option>
            <option value="one_time">Bir martalik</option>
            <option value="recurring_payment">Doimiy qarz to'lovi</option>
          </select>
        </div>
      </div>

      {/* Jami statistika */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-xs">
        <span className="font-semibold text-emerald-800">
          Jami: <strong>{items.length} ta</strong>
        </span>
        <span className="font-black text-emerald-700 text-sm">
          +{formatMoney(totalSum)}
        </span>
      </div>

      {/* Kontent: Mobil Kartochkalar + Desktop Jadval */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          Yuklanmoqda...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          Daromadlar topilmadi
        </div>
      ) : (
        <>
          {/* 1. MOBIL KORINISH: Kartochkalar (md:hidden) */}
          <div className="md:hidden space-y-3">
            {items.map((item) => {
              const isOwner = currentUser?.id === item.userId;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.source}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.category} {item.note ? `• ${item.note}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-600 flex-shrink-0">
                      +{formatMoney(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: item.user?.avatarColor || '#2563eb' }}
                      >
                        {item.user?.name[0] || 'U'}
                      </div>
                      <span className="truncate">{item.user?.name}</span>
                      <span>•</span>
                      <span className="truncate">{item.account?.name || 'Hisob'}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {isOwner && (
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP KORINISH: Jadval (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Sana</th>
                    <th className="py-3.5 px-4">Manba / Kimdan</th>
                    <th className="py-3.5 px-4">Kategoriya</th>
                    <th className="py-3.5 px-4 text-right">Summa</th>
                    <th className="py-3.5 px-4">Kim oldi</th>
                    <th className="py-3.5 px-4">Hisob / Hamyon</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isOwner = currentUser?.id === item.userId;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{item.source}</p>
                          {item.note && <p className="text-[11px] text-slate-400">{item.note}</p>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 text-sm">
                          +{formatMoney(item.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: item.user?.avatarColor || '#2563eb' }}
                            >
                              {item.user?.name[0]}
                            </div>
                            <span>{item.user?.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.account?.name || 'Hisob'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isOwner && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tahrirlash Modal dialogi */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 pt-safe">
              <h3 className="text-sm font-bold text-slate-900">Daromadni tahrirlash</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Summa (so'm) *</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manba / Kimdan *</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategoriya</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hisob *</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Izoh</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/95 backdrop-blur border-t border-slate-100 flex items-center justify-end gap-2.5 sticky bottom-0 z-10 pb-safe">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
