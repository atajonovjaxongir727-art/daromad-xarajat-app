import React from 'react';
import {
  Bell,
  PlusCircle,
  MinusCircle,
  UserCheck,
  RefreshCw,
  Wallet,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

interface NavbarProps {
  onAddIncomeClick: () => void;
  onAddExpenseClick: () => void;
  notifications: string[];
  todayDate: string;
  onMobileMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddIncomeClick,
  onAddExpenseClick,
  notifications,
  todayDate,
  onMobileMenuToggle,
}) => {
  const { currentUser, allUsers, setSwitchUserModalOpen, setTargetUserForSwitch } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const otherUser = allUsers.find((u) => u.id !== currentUser?.id);

  const handleSwitchClick = () => {
    if (otherUser) {
      setTargetUserForSwitch(otherUser);
      setSwitchUserModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Chap taraf: Mobile menu va Sarlavha */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-slate-900 leading-tight">
                Moliya Boshqaruvi
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Ali va Vali uchun daromad & xarajatlar tizimi
              </p>
            </div>
          </div>
        </div>

        {/* O'ng taraf: Foydalanuvchi, Sana, Ogohlantirishlar va Tugmalar */}
        <div className="flex items-center gap-2.5 lg:gap-3">
          {/* Bugungi sana */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
            <span>Bugun:</span>
            <span className="text-slate-900">{formatDate(todayDate) || '02.10.2026'}</span>
          </div>

          {/* Xabarnomalar qo'ng'irog'i */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Xabarnomalar"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ogohlantirishlar
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {notifications.length} ta
                  </span>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Barcha to‘lovlar joyida, yangi xabarlar yo‘q</p>
                  ) : (
                    notifications.map((note, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex items-start gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Faol Foydalanuvchi va Almashtirish */}
          {currentUser && (
            <div className="flex items-center bg-slate-100/80 hover:bg-slate-200/60 transition-colors rounded-xl p-1 pl-1.5 pr-2.5 gap-2 border border-slate-200/60">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: currentUser.avatarColor || '#2563eb' }}
              >
                {currentUser.name[0]}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5">Faol profil</p>
              </div>
              {otherUser && (
                <button
                  onClick={handleSwitchClick}
                  className="ml-1 p-1 rounded-md hover:bg-white text-slate-500 hover:text-blue-600 transition-colors"
                  title={`${otherUser.name} profiliga o‘tish`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Tezkor amallar */}
          <button
            onClick={onAddIncomeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Daromad</span>
          </button>

          <button
            onClick={onAddExpenseClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <MinusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Xarajat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
