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
  X,
  ShieldAlert,
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

  const activeCount = items.filter((i) => i.isActive).length;
  const totalMonthly = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Doimiy Daromad Manbalari</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Har oy takrorlanadigan doimiy mijozlar va oylik daromad shartnomalari
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
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Doimiy manba qo'shish</span>
          </button>
        </div>
      </div>

      {/* Tezkor statistika paneli */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Jami mijozlar</span>
          <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
            {items.length} ta
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Faol manbalar</span>
          <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
            {activeCount} ta
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Kutilgan oylik summa</span>
          <p className="text-base sm:text-lg font-black text-blue-600 mt-0.5">
            {formatMoney(totalMonthly)}
          </p>
        </div>
      </div>

      {/* Asosiy Kontent: Mobil Kartochkalar + Desktop Jadval */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          Yuklanmoqda...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          Hozircha hech qanday doimiy daromad manbasi kiritilmagan
        </div>
      ) : (
        <>
          {/* 1. MOBIL KORINISH: Sensorli Kartochkalar (md:hidden) */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden"
              >
                {/* Tepasi: Nomi va Holati */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.category || "Mijoz to\'lovi"} {item.note ? `• ${item.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                      item.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.isActive ? 'Faol' : 'Faol emas'}
                  </span>
                </div>

                {/* Oldingi qarz bor bo'lsa ogohlantirish badge */}
                {item.initialDebt && item.initialDebt > 0 ? (
                  <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between">
                    <span className="font-semibold text-[11px] flex items-center gap-1 text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Oldingi qarzdorlik:</span>
                    </span>
                    <span className="font-extrabold text-amber-900">
                      {formatMoney(item.initialDebt)}
                    </span>
                  </div>
                ) : null}

                {/* Asosiy ko'rsatkichlar: Oylik to'lov va to'lov kuni */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Oylik summa
                    </span>
                    <span className="text-sm font-black text-emerald-600 tracking-tight">
                      {formatMoney(item.amount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      To'lov sanasi
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Har oyning {item.billingDay}-kuni</span>
                    </span>
                  </div>
                </div>

                {/* Mas'ul foydalanuvchi va amallar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: item.assignedUser?.avatarColor || '#2563eb' }}
                    >
                      {item.assignedUser?.name[0] || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {item.assignedUser?.name || 'Belgilanmagan'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tahrirlash</span>
                    </button>

                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={actionLoading}
                      className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                        item.isActive
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                      title={item.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. DESKTOP KORINISH: To'liq Jadval (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-5">Daromad manbasi</th>
                    <th className="py-3.5 px-4 text-right">Oylik summa</th>
                    <th className="py-3.5 px-4">To'lov sanasi</th>
                    <th className="py-3.5 px-4">Mas'ul</th>
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
          </div>
        </>
      )}

      {/* Tahrirlash Modal dialogi (Mobil-first to'liq ekranli / desktop markazlashtirilgan) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 pt-safe">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    '{editingItem.title}' ni tahrirlash
                  </h3>
                  <p className="text-[11px] text-slate-400">Doimiy manba parametrlarini yangilash</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs">
                  <strong>Eslatma:</strong> Oylik summani o'zgartirganda eski oylarning
                  qarzdorliklari o'zgarmaydi. Yangi summa kelgusi oylar uchun amal qiladi.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yangi oylik summa (so'm) *
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To'lov sanasi (har oyning) *
                  </label>
                  <select
                    value={editBillingDay}
                    onChange={(e) => setEditBillingDay(Number(e.target.value))}
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Har oyning {d}-sanasi
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mas'ul *</label>
                  <select
                    value={editAssignedUser}
                    onChange={(e) => setEditAssignedUser(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sticky pastki tugmalar */}
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
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
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
