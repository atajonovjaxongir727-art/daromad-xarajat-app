import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  Repeat,
  Wallet,
  BarChart3,
  Calendar,
  History,
  ShieldCheck,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'income'
  | 'expense'
  | 'debts'
  | 'recurring'
  | 'accounts'
  | 'reports'
  | 'calendar'
  | 'history'
  | 'audit'
  | 'export';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  openDebtCount?: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openDebtCount = 0,
  mobileOpen,
  onCloseMobile,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Daromadlar', icon: TrendingUp },
    { id: 'expense', label: 'Xarajatlar', icon: TrendingDown },
    {
      id: 'debts',
      label: 'Qarzdorlik',
      icon: Clock,
      badge: openDebtCount > 0 ? openDebtCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'recurring', label: 'Doimiy daromadlar', icon: Repeat },
    { id: 'accounts', label: 'Hisoblar / Hamyon', icon: Wallet },
    { id: 'reports', label: 'Oylik hisobotlar', icon: BarChart3 },
    { id: 'calendar', label: 'Kalendar', icon: Calendar },
    { id: 'history', label: 'Tarix', icon: History },
    { id: 'audit', label: 'Audit jurnali', icon: ShieldCheck },
    { id: 'export', label: 'Eksport (Excel/PDF)', icon: FileSpreadsheet },
  ];

  const handleSelect = (tab: TabType) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobil fon parda */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Asosiy Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobil header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800 text-sm">Menyu</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menyu punktlari */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Asosiy Menyu
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pastki qism / Versiya */}
        <div className="p-3 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[11px] font-bold text-slate-700">Moliya Pro v2.0</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Avtomatik qarzdorlik tizimi</p>
          </div>
        </div>
      </aside>
    </>
  );
};
