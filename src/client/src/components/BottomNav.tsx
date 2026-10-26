import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Plus,
  Repeat,
  Menu,
} from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  openDebtCount: number;
  onQuickActionClick: () => void;
  onMoreClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  openDebtCount,
  onQuickActionClick,
  onMoreClick,
}) => {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (_) {}
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 pt-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto relative h-14">
        {/* 1. Asosiy (Dashboard) */}
        <button
          onClick={() => {
            triggerHaptic();
            onSelectTab('dashboard');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            currentTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'dashboard' ? 'bg-blue-50' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Asosiy</span>
          {currentTab === 'dashboard' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* 2. Qarzdorlik (Debts) */}
        <button
          onClick={() => {
            triggerHaptic();
            onSelectTab('debts');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            currentTab === 'debts' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all relative ${currentTab === 'debts' ? 'bg-blue-50' : ''}`}>
            <Clock className="w-5 h-5" />
            {openDebtCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-sm animate-pulse">
                {openDebtCount > 9 ? '9+' : openDebtCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Qarzlar</span>
          {currentTab === 'debts' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* 3. Markaziy FAB: Tezkor Qo'shish (+) */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            onClick={() => {
              triggerHaptic();
              onQuickActionClick();
            }}
            aria-label="Tezkor qo'shish"
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/35 hover:shadow-blue-500/50 active:scale-95 transition-all flex items-center justify-center border-4 border-white"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Doimiy Daromadlar (Recurring) */}
        <button
          onClick={() => {
            triggerHaptic();
            onSelectTab('recurring');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            currentTab === 'recurring' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${currentTab === 'recurring' ? 'bg-blue-50' : ''}`}>
            <Repeat className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Doimiy</span>
          {currentTab === 'recurring' && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* 5. Menyu / Ko'proq (Sidebar drawer) */}
        <button
          onClick={() => {
            triggerHaptic();
            onMoreClick();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
            ['income', 'expense', 'accounts', 'reports', 'history', 'calendar', 'settings'].includes(currentTab)
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            ['income', 'expense', 'accounts', 'reports', 'history', 'calendar', 'settings'].includes(currentTab)
              ? 'bg-blue-50'
              : ''
          }`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Menyu</span>
          {['income', 'expense', 'accounts', 'reports', 'history', 'calendar', 'settings'].includes(currentTab) && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
