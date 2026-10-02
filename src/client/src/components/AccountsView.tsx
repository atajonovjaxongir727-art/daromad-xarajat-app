import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Building2,
  Plus,
  ArrowRightLeft,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Account, User } from '../types';
import { formatMoney } from '../utils/formatters';

interface AccountsViewProps {
  onOpenAddAccountModal: () => void;
  onOpenTransferModal: () => void;
  users: User[];
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenAddAccountModal,
  onOpenTransferModal,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success && data.data) {
        setAccounts(data.data.accounts);
        setTotalBalance(data.data.totalBalance);
      }
    } catch (err) {
      console.error('Fetch accounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'card':
        return CreditCard;
      case 'bank':
        return Building2;
      case 'cash':
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hisoblar va Hamyonlar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mablag‘lar qayerda saqlanayotganligi va hamyonlar balansi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccounts}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Pul o‘tkazish</span>
          </button>

          <button
            onClick={onOpenAddAccountModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi hisob</span>
          </button>
        </div>
      </div>

      {/* Jami Balans Banneri */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Barcha hisoblar bo‘yicha umumiy mablag‘</p>
          <h3 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">
            {formatMoney(totalBalance)}
          </h3>
          <p className="text-xs text-blue-100/80 mt-1">
            Mavjud hisoblar soni: {accounts.length} ta
          </p>
        </div>
        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
          <Wallet className="w-40 h-40" />
        </div>
      </div>

      {/* Hisoblar gridi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);
          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: acc.color || '#3b82f6' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {acc.type === 'cash' ? 'Naqd pul' : acc.type === 'card' ? 'Bank karta' : 'Bank hisobi'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800">{acc.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Joriy qoldiq</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {formatMoney(acc.balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
