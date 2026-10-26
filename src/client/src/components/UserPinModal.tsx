import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserPinModal: React.FC = () => {
  const { switchUserModalOpen, setSwitchUserModalOpen, targetUserForSwitch, login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!switchUserModalOpen || !targetUserForSwitch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('PIN kodni kiriting');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(targetUserForSwitch.id, pin);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'PIN kod noto‘g‘ri');
      setPin('');
    } else {
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden">
        {/* Yuqori yopish */}
        <button
          onClick={() => setSwitchUserModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profil ko'rinishi */}
        <div className="text-center mt-2">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ backgroundColor: targetUserForSwitch.avatarColor || '#2563eb' }}
          >
            {targetUserForSwitch.name[0]}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-3">
            {targetUserForSwitch.name} profiliga o‘tish
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Davom etish uchun 4 xonali PIN kodni kiriting
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN kod"
                className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSwitchUserModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

