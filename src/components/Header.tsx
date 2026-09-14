'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from './Providers';
import {
  Building2,
  ScanLine,
  LogOut,
  ChevronDown,
  Lock,
  Search,
  Bell,
  Sparkles,
  User,
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على مؤشرات الأداء والعمليات اليومية' },
  '/attendance': { title: 'تسجيل الحضور', subtitle: 'بوابة الفحص والدخول الذكية لجميع الفروع' },
  '/customers': { title: 'إدارة العملاء', subtitle: 'دليل الأعضاء والاشتراكات والملفات الشاملة' },
  '/memberships': { title: 'الاشتراكات والباقات', subtitle: 'إدارة وتخصيص باقات العضوية والأسعار' },
  '/memberships/expiring': { title: 'الاشتراكات المنتهية قريباً', subtitle: 'متابعة العضويات المشرفة على الانتهاء والتجديد' },
  '/customers/inactive': { title: 'المنقطعون عن الحضور', subtitle: 'حصر الأعضاء الغائبين للتواصل وإعادة التنشيط' },
  '/trainers': { title: 'المدربون واللياقة', subtitle: 'جداول التمارين وقياسات InBody ومتابعة المشتركين' },
  '/finance/payments': { title: 'سندات القبض والمدفوعات', subtitle: 'سجل التحصيلات النقدية والإلكترونية' },
  '/finance/expenses': { title: 'المصروفات التشغيلية', subtitle: 'تسجيل وتبويب المصروفات وفواتير الفروع' },
  '/finance/cashier': { title: 'الخزينة والتقفيل اليومي', subtitle: 'متابعة حركة النقدية اللحظية وتقفيل الورديات' },
  '/reports': { title: 'التقارير والمقارنات', subtitle: 'لوحة التحليلات المالية ومقارنات أداء الفروع' },
  '/branches': { title: 'إدارة الفروع', subtitle: 'بيانات الفروع والطاقات الاستيعابية ومواعيد العمل' },
  '/employees': { title: 'الموظفون والصلاحيات', subtitle: 'إدارة حسابات الفريق وتعيين الأدوار والنطاقات' },
  '/settings': { title: 'إعدادات المنظومة', subtitle: 'الهوية والشعار ومحددات العمل وطرق الدفع' },
  '/activity-logs': { title: 'سجل العمليات والتدقيق', subtitle: 'Audit Log لكافة التحركات والإجراءات في النظام' },
};

export function Header() {
  const pathname = usePathname();
  const { user, branches, selectedBranchId, setSelectedBranchId, setIsCheckInModalOpen, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // Match current page title
  const currentTitle = PAGE_TITLES[pathname] || {
    title: 'نظام QGYM',
    subtitle: 'إدارة الجيم المركزي',
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const url =
          selectedBranchId && selectedBranchId !== 'ALL'
            ? `/api/notifications?branchId=${selectedBranchId}`
            : '/api/notifications';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.totalCount || 0);
        }
      } catch (e) {
        // silent
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setIsCheckInModalOpen(true);
      }
      if (e.key === 'F3') {
        e.preventDefault();
        router.push('/customers?new=1');
      }
      if (e.key === 'F4') {
        e.preventDefault();
        router.push('/finance/payments?new=1');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCheckInModalOpen, router]);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
        {/* Page Title & Context */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">{currentTitle.title}</h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">{currentTitle.subtitle}</p>
          </div>

          {/* Branch Switcher (for Super Admin) or Fixed Tag */}
          <div className="hidden md:flex items-center gap-2 mr-4 pr-4 border-r border-gray-200">
            {isSuperAdmin ? (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 cursor-pointer shadow-2xs pr-3 pl-7 appearance-none transition"
                >
                  <option value="ALL">🌐 جميع الفروع (المركز الرئيسي)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-semibold">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>{user.homeBranchName || 'الفرع التابع له'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span>بحث سريع...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-gray-500 border border-gray-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Check-in Button */}
          {user.role !== 'TRAINER' && (
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A72C] hover:bg-[#b88d1b] text-white text-xs font-bold shadow-xs transition active:scale-98"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>تسجيل دخول (F2)</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 transition"
            title="التنبيهات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-[#D4A72C] flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-gray-800 leading-tight">{user.name}</div>
                <div className="text-[10px] text-gray-500">{user.roleDisplayName}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1 text-xs z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="font-bold text-gray-900">{user.name}</div>
                  <div className="text-[10px] text-gray-500">{user.email}</div>
                </div>
                <div className="p-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        selectedBranchId={selectedBranchId}
      />
    </>
  );
}
