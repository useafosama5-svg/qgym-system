'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'RECEPTION' | 'TRAINER';
  roleDisplayName: string;
  homeBranchId: string | null;
  homeBranchName: string | null;
  homeBranchCode?: string | null;
  permissions: string[];
}

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
}

interface AppContextType {
  user: AuthUser | null;
  isLoadingUser: boolean;
  branches: BranchItem[];
  selectedBranchId: string; // 'ALL' or specific branch ID
  setSelectedBranchId: (id: string) => void;
  isCheckInModalOpen: boolean;
  setIsCheckInModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // If user is branch manager or receptionist, lock their selected branch to their home branch
        if (data.user.role !== 'SUPER_ADMIN' && data.user.homeBranchId) {
          setSelectedBranchId(data.user.homeBranchId);
        }
      } else {
        setUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error('Failed to load branches');
    }
  };

  useEffect(() => {
    fetchUser();
    fetchBranches();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoadingUser,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        isCheckInModalOpen,
        setIsCheckInModalOpen,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a Providers component');
  }
  return context;
}
