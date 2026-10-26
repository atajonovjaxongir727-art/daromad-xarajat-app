import React, { useState, useEffect } from 'react';
import { User, Lock, KeyRound, Palette, Check, AlertCircle, X, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COLOR_PRESETS = [
  { name: "Ko'k", hex: '#2563eb' },
  { name: 'Yashil', hex: '#10b981' },
  { name: 'Binafsha', hex: '#8b5cf6' },
  { name: 'To‘q sariq', hex: '#f97316' },
  { name: 'Qizil', hex: '#ef4444' },
  { name: 'Moviy', hex: '#06b6d4' },
  { name: 'Pushti', hex: '#ec4899' },
  { name: 'To‘q kulrang', hex: '#475569' },
];

export const ProfileSettingsModal: React.FC = () => {
  const {
    allUsers,
    currentUser,
    profileModalOpen,
    setProfileModalOpen,
    updateUser,
  } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>('#2563eb');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Modal ochilganda yoki tanlangan user o'zgarganda formani to'ldirish
  useEffect(() => {
    if (profileModalOpen) {
      const activeId = selectedUserId || currentUser?.id || (allUsers[0]?.id ?? '');
      setSelectedUserId(activeId);
      const target = allUsers.find((u) => u.id === activeId) || currentUser;
      if (target) {
        setName(target.name);
        setAvatarColor(target.avatarColor || '#2563eb');
        setPin('');
        setConfirmPin('');
        setError('');
        setSuccess('');
      }
    }
  }, [profileModalOpen, selectedUserId, currentUser, allUsers]);

  if (!profileModalOpen) return null;

  const handleUserTabChange = (userId: string) => {
    setSelectedUserId(userId);
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setName(target.name);
      setAvatarColor(target.avatarColor || '#2563eb');
      setPin('');
      setConfirmPin('');
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Foydalanuvchi ismi bo‘sh bo‘lishi mumkin emas');
      return;
    }

    if (pin || confirmPin) {
      if (pin.length < 4) {
        setError('PIN kod kamida 4 ta belgidan iborat bo‘lishi kerak');
        return;
      }
      if (pin !== confirmPin) {
        setError('Kiritilgan yangi PIN kodlar bir-biriga mos kelmadi');
        return;
      }
    }

    setLoading(true);
    const payload: { name: string; avatarColor: string; pin?: string } = {
      name: name.trim(),
      avatarColor,
    };
    if (pin.trim()) {
      payload.pin = pin.trim();
    }

    const res = await updateUser(selectedUserId, payload);
    setLoading(false);

    if (res.success) {
      setSuccess('Ma‘lumotlar muvaffaqiyatli saqlandi!');
      setPin('');
      setConfirmPin('');
      setTimeout(() => {
        setSuccess('');
        setProfileModalOpen(false);
      }, 1200);
    } else {
      setError(res.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden">
        {/* Yopish tugmasi */}
        <button
          onClick={() => setProfileModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Foydalanuvchi Sozlamalari</h3>
            <p className="text-xs text-slate-500">Ism va kirish PIN kodini o‘zgartirish</p>
          </div>
        </div>

        {/* Foydalanuvchi tanlash tabi */}
        {allUsers.length > 1 && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
            {allUsers.map((u) => {
              const isSelected = u.id === selectedUserId;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleUserTabChange(u.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                  />
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Xabarlar */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ism */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Foydalanuvchi Ismi
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Sardor"
                className="w-full text-sm font-semibold py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Avatar rangi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Profil Rangi</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setAvatarColor(c.hex)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    avatarColor === c.hex
                      ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-sm'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {avatarColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Yangi PIN Kod (Parol)</span>
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              Agar PIN kodni o‘zgartirmoqchi bo‘lmasangiz, bo‘sh qoldiring.
            </p>

            <div className="space-y-3">
              {/* Yangi PIN */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Yangi PIN (kamida 4 ta belgi)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Masalan: 7788"
                    className="w-full text-sm font-semibold tracking-widest py-2 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* PIN tasdiqlash */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Yangi PIN kodni tasdiqlang
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="PIN kodni qayta kiriting"
                    className="w-full text-sm font-semibold tracking-widest py-2 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Tugmalar */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
