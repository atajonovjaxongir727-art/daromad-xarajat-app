import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Wallet,
  UserCheck,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { Expense, User, Account, ExpenseCategory } from '../types';
import { formatMoney, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface ExpenseViewProps {
  onOpenAddModal: () => void;
  users: User[];
  accounts: Account[];
  categories: ExpenseCategory[];
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  onOpenAddModal,
  users,
  accounts,
  categories,
}) => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  // Tahrirlash holati
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (userFilter) params.append('userId', userFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (accountFilter) params.append('accountId', accountFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Fetch expense error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, userFilter, categoryFilter, accountFilter]);

  const handleDelete = async (item: Expense) => {
    // Section 24: Foydalanuvchi faqat o'zinikini o'chiradi
    if (currentUser && item.userId !== currentUser.id) {
      alert('Siz faqat o‘zingiz kiritgan yozuvlarni o‘chirishingiz mumkin!');
      return;
    }

    if (!window.confirm(`Haqiqatan ham '${item.category?.name}' xarajatini o‘chirishni xohlaysizmi? Balans qayta tiklanadi.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/expenses/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser?.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      } else {
        alert(data.message || 'O‘chirishda xatolik');
      }
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (item: Expense) => {
    if (currentUser && item.userId !== currentUser.id) {
      alert('Siz faqat o‘zingiz kiritgan yozuvlarni tahrirlashingiz mumkin!');
      return;
    }
    setEditingItem(item);
    setEditAmount(item.amount);
    setEditCategoryId(item.categoryId);
    setEditNote(item.note || '');
    setEditAccountId(item.accountId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editAmount) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/expenses/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          categoryId: editCategoryId,
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
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Xarajatlar Ro‘yxati</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcha toifalardagi kassa va hamyon xarajatlari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
            title="Yangilash"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Xarajat kiritish</span>
          </button>
        </div>
      </div>

      {/* Filtrlar va Qidiruv */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Izoh yoki toifa bo‘yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kim sarfladi */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha foydalanuvchilar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Kategoriya */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Hisob */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="">Barcha hisoblar</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jami statistika */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs">
        <span className="font-semibold text-rose-800">
          Jami xarajatlar soni: <strong>{items.length} ta</strong>
        </span>
        <span className="font-extrabold text-rose-700 text-sm">
          Jami xarajat: {formatMoney(totalSum)}
        </span>
      </div>

      {/* Jadval */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Xarajatlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Sana</th>
                  <th className="py-3.5 px-4">Kategoriya</th>
                  <th className="py-3.5 px-4">Tafsilot / Izoh</th>
                  <th className="py-3.5 px-4 text-right">Summa</th>
                  <th className="py-3.5 px-4">Kim sarfladi</th>
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
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block"
                          style={{
                            backgroundColor: `${item.category?.color || '#6b7280'}15`,
                            color: item.category?.color || '#475569',
                          }}
                        >
                          {item.category?.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {item.note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 text-sm">
                        -{formatMoney(item.amount)}
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOwner
                                ? 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={isOwner ? 'Tahrirlash' : 'Faqat muallif tahrirlashi mumkin'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOwner
                                ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title={isOwner ? 'O‘chirish' : 'Faqat muallif o‘chirishi mumkin'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tahrirlash Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Xarajatni tahrirlash</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Summa (so‘m)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategoriya</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hisob</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200"
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
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
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
