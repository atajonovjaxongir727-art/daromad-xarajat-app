import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  login: (userId: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  switchUserModalOpen: boolean;
  setSwitchUserModalOpen: (open: boolean) => void;
  targetUserForSwitch: User | null;
  setTargetUserForSwitch: (u: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [switchUserModalOpen, setSwitchUserModalOpen] = useState(false);
  const [targetUserForSwitch, setTargetUserForSwitch] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.data) {
        setAllUsers(data.data);
        // Agar avval saqlangan foydalanuvchi bo'lmasa, birinchisini (Ali) tanlash
        const savedUserId = localStorage.getItem('active_user_id');
        if (savedUserId) {
          const found = data.data.find((u: User) => u.id === savedUserId);
          if (found) setCurrentUser(found);
          else setCurrentUser(data.data[0]);
        } else if (data.data.length > 0) {
          setCurrentUser(data.data[0]);
          localStorage.setItem('active_user_id', data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const login = async (userId: string, pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
        localStorage.setItem('active_user_id', data.data.id);
        setSwitchUserModalOpen(false);
        setTargetUserForSwitch(null);
        return { success: true };
      }
      return { success: false, message: data.message || 'PIN kod noto‘g‘ri' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Xatolik yuz berdi' };
    }
  };

  const logout = () => {
    localStorage.removeItem('active_user_id');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        switchUserModalOpen,
        setSwitchUserModalOpen,
        targetUserForSwitch,
        setTargetUserForSwitch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
