import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Printer, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatMoney, formatDate } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dashboardData,
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // 1. Excel (.xlsx) eksporti
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // API dan so'nggi to'liq ma'lumotlarni olish
      const [incRes, expRes, debtRes, accRes] = await Promise.all([
        fetch('/api/income').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/debts').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ]);

      const wb = XLSX.utils.book_new();

      // Sheet 1: Moliyaviy Xulosa
      const kpi = dashboardData?.kpi || {};
      const users = dashboardData?.users || {};
      const summaryData = [
        ['MOLIYAVIY HISOBOT VA XULOSA'],
        ['Hisobot sanasi', new Date().toLocaleDateString('uz-UZ')],
        [],
        ['UMUMIY KO‘RSATKICHLAR', 'SUMMA (UZS)'],
        ['Jami haqiqiy daromad', kpi.totalIncome || 0],
        ['Jami haqiqiy xarajat', kpi.totalExpense || 0],
        ['Sof balans (Daromad - Xarajat)', kpi.netBalance || 0],
        ['Olinishi kerak bo‘lgan qarzlar', kpi.totalReceivable || 0],
        ['Kechikkan qarzdorlik', kpi.overdueDebts || 0],
        ['To‘langan qarzlar', kpi.totalPaidDebts || 0],
        [],
        ['FOYDALANUVCHILAR BO‘YICHA', 'DAROMAD', 'XARAJAT', 'SOF BALANS'],
        [users.ali?.name || '1-foydalanuvchi', users.ali?.income || 0, users.ali?.expense || 0, users.ali?.balance || 0],
        [users.vali?.name || '2-foydalanuvchi', users.vali?.income || 0, users.vali?.expense || 0, users.vali?.balance || 0],
        ['JAMI (UMUMIY)', users.total?.income || 0, users.total?.expense || 0, users.total?.balance || 0],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Xulosa');

      // Sheet 2: Daromadlar
      if (incRes.success && incRes.data) {
        const incomesRows = incRes.data.map((i: any) => ({
          'Sana': formatDate(i.date),
          'Manba / Mijoz': i.source,
          'Daromad turi': i.category,
          'Summa (so‘m)': i.amount,
          'Kim oldi': i.user?.name,
          'Hisob': i.account?.name,
          'To‘lov usuli': i.paymentMethod,
          'Izoh': i.note || '',
        }));
        const wsInc = XLSX.utils.json_to_sheet(incomesRows);
        XLSX.utils.book_append_sheet(wb, wsInc, 'Daromadlar');
      }

      // Sheet 3: Xarajatlar
      if (expRes.success && expRes.data) {
        const expenseRows = expRes.data.map((e: any) => ({
          'Sana': formatDate(e.date),
          'Kategoriya': e.category?.name,
          'Summa (so‘m)': e.amount,
          'Kim sarfladi': e.user?.name,
          'Hisob': e.account?.name,
          'To‘lov usuli': e.paymentMethod,
          'Izoh': e.note || '',
        }));
        const wsExp = XLSX.utils.json_to_sheet(expenseRows);
        XLSX.utils.book_append_sheet(wb, wsExp, 'Xarajatlar');
      }

      // Sheet 4: Qarzdorliklar
      if (debtRes.success && debtRes.data) {
        const debtRows = debtRes.data.map((d: any) => ({
          'Mijoz': d.recurringIncome?.title,
          'Oy': d.yearMonth,
          'To‘lov muddati': formatDate(d.dueDate),
          'Kutilgan summa': d.expectedAmount,
          'To‘langan': d.paidAmount,
          'Qoldiq qarz': d.remainingAmount,
          'Holat': d.status,
          'Mas‘ul': d.assignedUser?.name,
          'Kechikkan kun': d.overdueDays || 0,
        }));
        const wsDebt = XLSX.utils.json_to_sheet(debtRows);
        XLSX.utils.book_append_sheet(wb, wsDebt, 'Qarzdorliklar');
      }

      // Sheet 5: Hisoblar
      if (accRes.success && accRes.data?.accounts) {
        const accRows = accRes.data.accounts.map((a: any) => ({
          'Hisob nomi': a.name,
          'Turi': a.type,
          'Qoldiq (so‘m)': a.balance,
        }));
        const wsAcc = XLSX.utils.json_to_sheet(accRows);
        XLSX.utils.book_append_sheet(wb, wsAcc, 'Hisoblar');
      }

      XLSX.writeFile(wb, `Moliya_Hisobot_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMsg('Excel fayli muvaffaqiyatli yuklab olindi!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert('Eksportda xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. CSV eksporti
  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success && data.data) {
        const rows = data.data.map((t: any) => ({
          'Sana va Vaqt': t.date,
          'Turi': t.type,
          'Summa': t.amount,
          'Hisob': t.account?.name,
          'Foydalanuvchi': t.user?.name,
          'Tavsif': t.description,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tranzaksiyalar_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        setSuccessMsg('CSV fayli muvaffaqiyatli yuklandi!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert('CSV eksportida xatolik');
    } finally {
      setLoading(false);
    }
  };

  // 3. PDF / Chop etish
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ma‘lumotlarni eksport qilish</h3>
              <p className="text-xs text-slate-500">Excel, CSV yoki PDF formatida yuklab olish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="m-6 mb-0 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 pb-safe">
          {/* Excel */}
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="w-full p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Excel formati (.xlsx)</p>
                <p className="text-[11px] text-slate-500">
                  Xulosa, Daromad, Xarajat, Qarzlar va Hisoblar jadvallari
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Yuklab olish
            </span>
          </button>

          {/* CSV */}
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="w-full p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">CSV formati (.csv)</p>
                <p className="text-[11px] text-slate-500">Barcha moliyaviy tranzaksiyalar ketma-ketligi</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Yuklab olish
            </span>
          </button>

          {/* PDF */}
          <button
            onClick={handlePrintPDF}
            className="w-full p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">PDF / Chop etish</p>
                <p className="text-[11px] text-slate-500">Joriy sahifani toza PDF ko‘rinishida saqlash</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Chop etish
            </span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

