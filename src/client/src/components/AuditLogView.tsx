import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  RotateCcw,
  CheckCircle2,
  Edit2,
  Trash2,
  UserCheck,
  Clock,
} from 'lucide-react';
import { AuditLog } from '../types';
import { formatDateTime } from '../utils/formatters';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { label: 'Qo‘shildi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'UPDATE':
        return { label: 'Tahrirlandi', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'DELETE':
        return { label: 'O‘chirildi', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'RECEIVE_PAYMENT':
        return { label: 'To‘lov olindi', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'TRANSFER':
        return { label: 'O‘tkazildi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'DEACTIVATE':
        return { label: 'Faolsizlantirildi', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'LOGIN':
        return { label: 'Tizimga kirdi', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Jurnali</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kim, qachon va qanday amallar bajarganligi bo‘yicha to‘liq tizim xavfsizlik jurnali (Section 33)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Qidiruv va Filtr */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Audit tavsifi yoki foydalanuvchi bo‘yicha qidiruv..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
        >
          <option value="">Barcha amallar</option>
          <option value="CREATE">Qo‘shish (CREATE)</option>
          <option value="UPDATE">Tahrirlash (UPDATE)</option>
          <option value="DELETE">O‘chirish (DELETE)</option>
          <option value="RECEIVE_PAYMENT">To‘lov qabul qilish</option>
          <option value="TRANSFER">O‘tkazma</option>
          <option value="DEACTIVATE">Faolsizlantirish</option>
        </select>
      </div>

      {/* Ro'yxat */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Yuklanmoqda...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Audit yozuvlari topilmadi</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{log.userName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {log.entityType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium">{log.description}</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-slate-400 flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {formatDateTime(new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
