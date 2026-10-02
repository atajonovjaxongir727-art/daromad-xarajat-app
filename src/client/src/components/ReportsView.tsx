import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatMoney, formatDate, getMonthName } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const [yearMonth, setYearMonth] = useState('2026-10');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?yearMonth=${yearMonth}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Fetch report error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [yearMonth]);

  const months = [
    { ym: '2026-08', label: 'Avgust 2026' },
    { ym: '2026-09', label: 'Sentyabr 2026' },
    { ym: '2026-10', label: 'Oktyabr 2026' },
    { ym: '2026-11', label: 'Noyabr 2026' },
    { ym: '2026-12', label: 'Dekabr 2026' },
  ];

  const summary = data?.summary || {};
  const categoryExpenses = data?.categoryExpenses || [];
  const trendData = data?.trendData || [];

  const pieColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
  ];

  // Foydalanuvchilar taqqoslash ma'lumotlari
  const userComparisonData = [
    {
      name: 'Ali',
      daromad: summary.aliIncome || 0,
      xarajat: summary.aliExpense || 0,
      balans: summary.aliBalance || 0,
    },
    {
      name: 'Vali',
      daromad: summary.valiIncome || 0,
      xarajat: summary.valiExpense || 0,
      balans: summary.valiBalance || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sarlavha va Oy tanlagich */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Oylik Moliyaviy Hisobot</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {getMonthName(yearMonth)} oyi bo‘yicha to‘liq tahlil va ko‘rsatkichlar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-1.5" />
            <select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="py-1 px-2 text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.ym} value={m.ym}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReport}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Hisobot tayyorlanmoqda...</div>
      ) : (
        <>
          {/* Tanlangan oy ko'rsatkichlari (Section 14) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Jami daromad</span>
              <p className="text-base font-extrabold text-emerald-600 mt-1">
                {formatMoney(summary.totalIncome)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Jami xarajat</span>
              <p className="text-base font-extrabold text-rose-600 mt-1">
                {formatMoney(summary.totalExpense)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sof foyda / qoldiq</span>
              <p
                className={`text-base font-extrabold mt-1 ${
                  summary.netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatMoney(summary.netBalance)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Olinishi kerak</span>
              <p className="text-base font-extrabold text-indigo-600 mt-1">
                {formatMoney(summary.totalReceivable)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">To‘langan qarz</span>
              <p className="text-base font-extrabold text-teal-600 mt-1">
                {formatMoney(summary.totalPaid)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-rose-700">Kechikkan qarz</span>
              <p className="text-base font-extrabold text-rose-700 mt-1">
                {formatMoney(summary.overdueDebts)}
              </p>
            </div>
          </div>

          {/* Foydalanuvchilar oylik taqqoslashi (Section 14) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ali */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    A
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Ali ({getMonthName(yearMonth)})</h4>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Foydalanuvchi 1
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Daromad</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    {formatMoney(summary.aliIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Xarajat</p>
                  <p className="text-xs font-bold text-rose-600 mt-0.5">
                    {formatMoney(summary.aliExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Qoldiq</p>
                  <p
                    className={`text-xs font-bold mt-0.5 ${
                      summary.aliBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                    }`}
                  >
                    {formatMoney(summary.aliBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vali */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    V
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Vali ({getMonthName(yearMonth)})</h4>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Foydalanuvchi 2
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Daromad</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    {formatMoney(summary.valiIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Xarajat</p>
                  <p className="text-xs font-bold text-rose-600 mt-0.5">
                    {formatMoney(summary.valiExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Qoldiq</p>
                  <p
                    className={`text-xs font-bold mt-0.5 ${
                      summary.valiBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatMoney(summary.valiBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Oylik Dinamika Grafigi (Section 30) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              So‘nggi 6 oylik dinamika (Daromad vs Xarajat vs Sof foyda)
            </h3>
            <p className="text-xs text-slate-400 mb-4">Oylar kesimida moliyaviy oqim</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatMoney(Number(val)), '']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="daromad" name="Daromad" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="xarajat" name="Xarajat" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qoldiq" name="Sof Qoldiq" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Xarajatlar toifalari bo'yicha taqsimot va Foydalanuvchilar taqqoslashi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut chart: Toifalar */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Kategoriyalar bo‘yicha xarajatlar taqsimoti
              </h3>
              <p className="text-xs text-slate-400 mb-4">{getMonthName(yearMonth)} oyi uchun</p>

              {categoryExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">Bu oyda xarajatlar mavjud emas</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryExpenses.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatMoney(Number(val)), '']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Foydalanuvchilar taqqoslash grafigi */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Ali va Vali taqqoslashi
              </h3>
              <p className="text-xs text-slate-400 mb-4">{getMonthName(yearMonth)} oyi bo‘yicha</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatMoney(Number(val)), '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Bar dataKey="daromad" name="Daromad" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="xarajat" name="Xarajat" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="balans" name="Qoldiq" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
