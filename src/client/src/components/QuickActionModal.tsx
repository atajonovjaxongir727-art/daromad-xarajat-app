import React from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Wallet,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddRecurring: () => void;
  onOpenTransfer: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onAddIncome,
  onAddExpense,
  onAddRecurring,
  onOpenTransfer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Android drag handle indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Tezkor Amallar</h3>
            <p className="text-xs text-slate-400">Kerakli operatsiyani tanlang</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* 1. Daromad */}
          <button
            onClick={() => {
              onClose();
              onAddIncome();
            }}
            className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 transition-all text-left flex flex-col justify-between border border-emerald-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-900">+ Daromad</p>
              <p className="text-[10px] text-emerald-700 font-medium">Tushumni kiritish</p>
            </div>
          </button>

          {/* 2. Xarajat */}
          <button
            onClick={() => {
              onClose();
              onAddExpense();
            }}
            className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 active:scale-95 transition-all text-left flex flex-col justify-between border border-rose-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-900">+ Xarajat</p>
              <p className="text-[10px] text-rose-700 font-medium">Chiqim yozish</p>
            </div>
          </button>

          {/* 3. Doimiy mijoz */}
          <button
            onClick={() => {
              onClose();
              onAddRecurring();
            }}
            className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 active:scale-95 transition-all text-left flex flex-col justify-between border border-blue-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Repeat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-900">+ Doimiy Mijoz</p>
              <p className="text-[10px] text-blue-700 font-medium">Oylik to‘lovchi</p>
            </div>
          </button>

          {/* 4. O'tkazma */}
          <button
            onClick={() => {
              onClose();
              onOpenTransfer();
            }}
            className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 active:scale-95 transition-all text-left flex flex-col justify-between border border-indigo-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-900">Pul O‘tkazish</p>
              <p className="text-[10px] text-indigo-700 font-medium">Hamyonlar aro</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
