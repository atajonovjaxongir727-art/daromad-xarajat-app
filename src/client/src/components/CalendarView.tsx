import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  RotateCcw,
  X,
} from 'lucide-react';
import { formatMoney, formatDate, getMonthName } from '../utils/formatters';

export const CalendarView: React.FC = () => {
  const [currentYearMonth, setCurrentYearMonth] = useState('2026-10');
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?yearMonth=${currentYearMonth}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCalendarData(data.data);
      }
    } catch (err) {
      console.error('Fetch calendar error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentYearMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setCurrentYearMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentYearMonth.split('-').map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setCurrentYearMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  // Kalendar kunlarini shakllantirish
  const [year, month] = currentYearMonth.split('-').map(Number);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month, 0).getDate();

  // Dushanba birinchi kun bo'lishi uchun (0 -> 6, 1 -> 0, ...)
  const startOffset = (firstDayOfWeek + 6) % 7;

  const calendarDays: Array<{ dayNumber: number; dateStr: string } | null> = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYearMonth}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: d, dateStr });
  }

  const daysData = calendarData?.days || {};
  const todayStr = calendarData?.today || '';

  return (
    <div className="space-y-6">
      {/* Sarlavha va Oy navigatsiyasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Moliyaviy Kalendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kunlar kesimida daromad, xarajat va to‘lov muddatlari
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Daromad</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Xarajat</span>
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Kutilayotgan to‘lov</span>
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span>Kechikkan qarz</span>
            </span>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {getMonthName(currentYearMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Asosiy Kalendar Katakchalari */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Hafta kunlari */}
        <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-bold text-slate-400 py-3 bg-slate-50/70">
          <div>Dush</div>
          <div>Sesh</div>
          <div>Chor</div>
          <div>Pay</div>
          <div>Jum</div>
          <div className="text-rose-500">Shan</div>
          <div className="text-rose-500">Yak</div>
        </div>

        {/* Kunlar to'ri */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[480px]">
          {calendarDays.map((cell, idx) => {
            if (!cell) {
              return <div key={idx} className="bg-slate-50/40 p-2" />;
            }

            const dayInfo = daysData[cell.dateStr];
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => dayInfo && setSelectedDay(dayInfo)}
                className={`p-2 min-h-[85px] transition-all flex flex-col justify-between cursor-pointer ${
                  isToday ? 'bg-blue-50/40 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {dayInfo?.overdueDebts?.length > 0 && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1 rounded flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Ko'rsatkichlar */}
                <div className="mt-1 space-y-1">
                  {dayInfo?.totalIncome > 0 && (
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 truncate">
                      +{formatMoney(dayInfo.totalIncome)}
                    </div>
                  )}

                  {dayInfo?.totalExpense > 0 && (
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 truncate">
                      -{formatMoney(dayInfo.totalExpense)}
                    </div>
                  )}

                  {dayInfo?.totalExpected > 0 && (
                    <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 truncate flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      <span>{formatMoney(dayInfo.totalExpected)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tanlangan kun Tafsilotlari Modali */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {formatDate(selectedDay.date)} sanasi tafsilotlari
                  </h3>
                  <p className="text-[11px] text-slate-500">Moliyaviy amallar va kutilayotgan to‘lovlar</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Daromadlar */}
              {selectedDay.incomes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Daromadlar (+{formatMoney(selectedDay.totalIncome)})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDay.incomes.map((inc: any) => (
                      <div
                        key={inc.id}
                        className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{inc.source}</p>
                          <p className="text-[11px] text-slate-500">
                            {inc.category} • {inc.user?.name}
                          </p>
                        </div>
                        <span className="font-bold text-emerald-600">+{formatMoney(inc.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Xarajatlar */}
              {selectedDay.expenses?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Xarajatlar (-{formatMoney(selectedDay.totalExpense)})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDay.expenses.map((exp: any) => (
                      <div
                        key={exp.id}
                        className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{exp.category?.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {exp.note || 'Xarajat'} • {exp.user?.name}
                          </p>
                        </div>
                        <span className="font-bold text-rose-600">-{formatMoney(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kutilayotgan yoki kechikkan qarzlar */}
              {(selectedDay.expectedDebts?.length > 0 || selectedDay.overdueDebts?.length > 0) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Kutilayotgan to‘lovlar</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDay.overdueDebts?.map((debt: any) => (
                      <div
                        key={debt.id}
                        className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-rose-900">{debt.recurringIncome?.title}</p>
                          <p className="text-[11px] text-rose-600">Muddati o‘tgan qarzdorlik</p>
                        </div>
                        <span className="font-extrabold text-rose-700">
                          {formatMoney(debt.remainingAmount)}
                        </span>
                      </div>
                    ))}

                    {selectedDay.expectedDebts?.map((debt: any) => (
                      <div
                        key={debt.id}
                        className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-amber-900">{debt.recurringIncome?.title}</p>
                          <p className="text-[11px] text-amber-600">To‘lov sanasi bugun</p>
                        </div>
                        <span className="font-extrabold text-amber-700">
                          {formatMoney(debt.remainingAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
