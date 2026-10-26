import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  KeyRound,
  Lock,
  Palette,
  Check,
  AlertCircle,
  Database,
  Activity,
  Save,
  Users,
} from 'lucide-react';
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

export const SettingsView: React.FC = () => {
  const { allUsers, updateUser, refreshUsers } = useAuth();

  const user1 = allUsers[0];
  const user2 = allUsers[1];

  // User 1 holati
  const [name1, setName1] = useState('');
  const [pin1, setPin1] = useState('');
  const [confirmPin1, setConfirmPin1] = useState('');
  const [color1, setColor1] = useState('#2563eb');
  const [loading1, setLoading1] = useState(false);
  const [error1, setError1] = useState('');
  const [success1, setSuccess1] = useState('');

  // User 2 holati
  const [name2, setName2] = useState('');
  const [pin2, setPin2] = useState('');
  const [confirmPin2, setConfirmPin2] = useState('');
  const [color2, setColor2] = useState('#10b981');
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState('');
  const [success2, setSuccess2] = useState('');

  useEffect(() => {
    if (user1) {
      setName1(user1.name || '');
      setColor1(user1.avatarColor || '#2563eb');
    }
    if (user2) {
      setName2(user2.name || '');
      setColor2(user2.avatarColor || '#10b981');
    }
  }, [user1, user2]);

  const handleSaveUser1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user1) return;
    setError1('');
    setSuccess1('');

    if (!name1.trim()) {
      setError1('Ism kiritilishi shart');
      return;
    }
    if (pin1 || confirmPin1) {
      if (pin1.length < 4) {
        setError1('PIN kod kamida 4 xonali bo‘lishi kerak');
        return;
      }
      if (pin1 !== confirmPin1) {
        setError1('PIN kodlar bir-biriga mos kelmadi');
        return;
      }
    }

    setLoading1(true);
    const payload: { name: string; avatarColor: string; pin?: string } = {
      name: name1.trim(),
      avatarColor: color1,
    };
    if (pin1.trim()) payload.pin = pin1.trim();

    const res = await updateUser(user1.id, payload);
    setLoading1(false);
    if (res.success) {
      setSuccess1('1-foydalanuvchi ma‘lumotlari muvaffaqiyatli saqlandi!');
      setPin1('');
      setConfirmPin1('');
      setTimeout(() => setSuccess1(''), 4000);
    } else {
      setError1(res.message || 'Xatolik yuz berdi');
    }
  };

  const handleSaveUser2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user2) return;
    setError2('');
    setSuccess2('');

    if (!name2.trim()) {
      setError2('Ism kiritilishi shart');
      return;
    }
    if (pin2 || confirmPin2) {
      if (pin2.length < 4) {
        setError2('PIN kod kamida 4 xonali bo‘lishi kerak');
        return;
      }
      if (pin2 !== confirmPin2) {
        setError2('PIN kodlar bir-biriga mos kelmadi');
        return;
      }
    }

    setLoading2(true);
    const payload: { name: string; avatarColor: string; pin?: string } = {
      name: name2.trim(),
      avatarColor: color2,
    };
    if (pin2.trim()) payload.pin = pin2.trim();

    const res = await updateUser(user2.id, payload);
    setLoading2(false);
    if (res.success) {
      setSuccess2('2-foydalanuvchi ma‘lumotlari muvaffaqiyatli saqlandi!');
      setPin2('');
      setConfirmPin2('');
      setTimeout(() => setSuccess2(''), 4000);
    } else {
      setError2(res.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Foydalanuvchilar va PIN Sozlamalari</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ismlar, kirish parollari (PIN) va profillarni to‘g‘ridan-to‘g‘ri boshqarish
            </p>
          </div>
        </div>

        <button
          onClick={() => refreshUsers()}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Yangilash
        </button>
      </div>

      {/* 2 ta Foydalanuvchi formasi (Yonma-yon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1-Foydalanuvchi */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: color1 }}
                >
                  {name1 ? name1[0] : '1'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1-Foydalanuvchi</h3>
                  <p className="text-xs text-slate-400">Hozirgi ism: {user1?.name || 'Ali'}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Profil 1
              </span>
            </div>

            {error1 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error1}</span>
              </div>
            )}

            {success1 && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{success1}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser1} className="space-y-4">
              {/* Ism */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foydalanuvchi Ismi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
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
                      onClick={() => setColor1(c.hex)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        color1 === c.hex
                          ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-sm'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {color1 === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yangi PIN */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yangi Kirish PIN Kodi (Parol)</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  O‘zgartirmoqchi bo‘lmasangiz, bo‘sh qoldiring
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={10}
                    value={pin1}
                    onChange={(e) => setPin1(e.target.value)}
                    placeholder="Yangi PIN"
                    className="w-full text-xs font-semibold tracking-widest py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="password"
                    maxLength={10}
                    value={confirmPin1}
                    onChange={(e) => setConfirmPin1(e.target.value)}
                    placeholder="PIN tasdiqlash"
                    className="w-full text-xs font-semibold tracking-widest py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading1}
                className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading1 ? 'Saqlanmoqda...' : '1-Foydalanuvchini Saqlash'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* 2-Foydalanuvchi */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: color2 }}
                >
                  {name2 ? name2[0] : '2'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2-Foydalanuvchi</h3>
                  <p className="text-xs text-slate-400">Hozirgi ism: {user2?.name || 'Vali'}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                Profil 2
              </span>
            </div>

            {error2 && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error2}</span>
              </div>
            )}

            {success2 && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{success2}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser2} className="space-y-4">
              {/* Ism */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foydalanuvchi Ismi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    placeholder="Masalan: Jasur"
                    className="w-full text-sm font-semibold py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                      onClick={() => setColor2(c.hex)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        color2 === c.hex
                          ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110 shadow-sm'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {color2 === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yangi PIN */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Yangi Kirish PIN Kodi (Parol)</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  O‘zgartirmoqchi bo‘lmasangiz, bo‘sh qoldiring
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={10}
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value)}
                    placeholder="Yangi PIN"
                    className="w-full text-xs font-semibold tracking-widest py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <input
                    type="password"
                    maxLength={10}
                    value={confirmPin2}
                    onChange={(e) => setConfirmPin2(e.target.value)}
                    placeholder="PIN tasdiqlash"
                    className="w-full text-xs font-semibold tracking-widest py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading2}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading2 ? 'Saqlanmoqda...' : '2-Foydalanuvchini Saqlash'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tizim va Xavfsizlik Axboroti */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/10">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Xavfsiz va Himoyalangan Tizim</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Har bir foydalanuvchi o‘z PIN kodi bilan kiradi. Barcha amallar audit jurnalida qayd etiladi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Baza turi</p>
            <p className="text-xs font-bold text-emerald-400">PostgreSQL Cloud</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Uptime</p>
            <p className="text-xs font-bold text-blue-400">24/7 Faol</p>
          </div>
        </div>
      </div>
    </div>
  );
};
