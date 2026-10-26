import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Edit2,
  Power,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { RecurringIncome, User } from '../types';
import { formatMoney } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface RecurringIncomeViewProps {
  onOpenAddModal: () => void;
  users: User[];
}

export const RecurringIncomeView: React.FC<RecurringIncomeViewProps> = ({
  onOpenAddModal,
  users,
}) => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringIncome | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editBillingDay, setEditBillingDay] = useState<number>(10);
  const [editAssignedUser, setEditAssignedUser] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Fetch recurring error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleActive = async (item: RecurringIncome) => {
    const actionText = item.isActive ? 'faolsizlantirish' : 'faollashtirish';
    if (!window.confirm(`Haqiqatan ham '${item.title}' manbasini ${actionText}ni xohlaysizmi?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/recurring/${item.id}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      } else {
        alert(data.message || 'Xatolik yuz berdi');
      }
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (item: RecurringIncome) => {
    setEditingItem(item);
    setEditAmount(item.amount);
    setEditBillingDay(item.billingDay);
    setEditAssignedUser(item.assignedUserId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editAmount || Number(editAmount) <= 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/recurring/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          billingDay: Number(editBillingDay),
          assignedUserId: editAssignedUser,
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
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

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Doimiy Daromad Manbalari</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Har oy takrorlanadigan daromad shartnomalari va avtomatik qarzdorlik manbalari
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Doimiy manba qo‘shish</span>
          </button>
        </div>
      </div>

      {/* Doimiy daromadlar jadvali (Section 15) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Hozircha hech qanday doimiy daromad manbasi kiritilmagan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Daromad manbasi</th>
                  <th className="py-3.5 px-4 text-right">Oylik summa</th>
                  <th className="py-3.5 px-4">To‘lov sanasi</th>
                  <th className="py-3.5 px-4">Mas‘ul</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Manba */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            item.isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Repeat className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{item.title}</p>
                            {item.initialDebt && item.initialDebt > 0 ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Oldingi qarz: {formatMoney(item.initialDebt)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {item.category} {item.note ? `• ${item.note}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Summa */}
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                      {formatMoney(item.amount)}
                    </td>

                    {/* Sana */}
                    <td className="py-4 px-4 text-slate-600 font-semibold">
                      Har oyning {item.billingDay}-sanasi
                    </td>

                    {/* Mas'ul */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: item.assignedUser?.avatarColor || '#2563eb' }}
                        >
                          {item.assignedUser?.name[0] || 'U'}
                        </div>
                        <span>{item.assignedUser?.name}</span>
                      </div>
                    </td>

                    {/* Holat */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.isActive ? 'Faol' : 'Faol emas'}
                      </span>
                    </td>

                    {/* Amallar */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={actionLoading}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isActive
                              ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                          title={item.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tahrirlash Modal dialogi */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                '{editingItem.title}' ni tahrirlash
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs">
              <strong>Muhim (Section 7):</strong> Oylik summani o‘zgartirganda eski oylarning
              qarzdorliklari o‘zgarmaydi! Yangi summa faqat kelgusi oylar uchun qo‘llanadi.
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangi oylik summa (so‘m)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  To‘lov sanasi (har oyning)
                </label>
                <select
                  value={editBillingDay}
                  onChange={(e) => setEditBillingDay(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Har oyning {d}-sanasi
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mas‘ul</label>
                <select
                  value={editAssignedUser}
                  onChange={(e) => setEditAssignedUser(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
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
