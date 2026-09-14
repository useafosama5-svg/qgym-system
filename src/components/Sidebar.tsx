'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './Providers';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  UserX,
  UserCheck,
  History,
  CreditCard,
  PauseCircle,
  Dumbbell,
  Activity,
  ClipboardList,
  DollarSign,
  Receipt,
  Wallet,
  BarChart3,
  Building2,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

interface NavGroup {
  id: string;
  title: string;
  roles: string[];
  items: {
    title: string;
    href: string;
    icon: React.ElementType;
    roles: string[];
    badge?: string;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useApp();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const role = user.role;

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'main',
      title: 'الرئيسية',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION', 'TRAINER'],
      items: [
        {
          title: 'لوحة التحكم',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION', 'TRAINER'],
        },
      ],
    },
    {
      id: 'attendance',
      title: 'الحضور والدخول',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
      items: [
        {
          title: 'بوابة تسجيل الحضور',
          href: '/attendance',
          icon: UserCheck,
          badge: 'LIVE',
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
      ],
    },
    {
      id: 'customers',
      title: 'إدارة العملاء',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION', 'TRAINER'],
      items: [
        {
          title: 'دليل العملاء',
          href: '/customers',
          icon: Users,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION', 'TRAINER'],
        },
        {
          title: 'الاشتراكات المنتهية',
          href: '/memberships/expiring',
          icon: Clock,
          badge: 'تنبيه',
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
        {
          title: 'المنقطعون عن الحضور',
          href: '/customers/inactive',
          icon: UserX,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
      ],
    },
    {
      id: 'memberships',
      title: 'الاشتراكات والباقات',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
      items: [
        {
          title: 'باقات واشتراكات العضوية',
          href: '/memberships',
          icon: CreditCard,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
      ],
    },
    {
      id: 'trainers',
      title: 'التدريب واللياقة',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'TRAINER'],
      items: [
        {
          title: 'المدربون والقياسات',
          href: '/trainers',
          icon: Dumbbell,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'TRAINER'],
        },
      ],
    },
    {
      id: 'finance',
      title: 'المالية والخزينة',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
      items: [
        {
          title: 'المدفوعات وسندات القبض',
          href: '/finance/payments',
          icon: DollarSign,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
        {
          title: 'المصروفات اليومية',
          href: '/finance/expenses',
          icon: Receipt,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
        {
          title: 'الخزينة والتقفيل اليومي',
          href: '/finance/cashier',
          icon: Wallet,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'RECEPTION'],
        },
      ],
    },
    {
      id: 'reports',
      title: 'التقارير والأداء',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
      items: [
        {
          title: 'التقارير ومقارنات الفروع',
          href: '/reports',
          icon: BarChart3,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
      ],
    },
    {
      id: 'system',
      title: 'إدارة النظام',
      roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
      items: [
        {
          title: 'الفروع',
          href: '/branches',
          icon: Building2,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
        {
          title: 'الموظفون والصلاحيات',
          href: '/employees',
          icon: ShieldCheck,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
        {
          title: 'سجل العمليات والتدقيق',
          href: '/activity-logs',
          icon: History,
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
        {
          title: 'إعدادات المنظومة',
          href: '/settings',
          icon: Settings,
          roles: ['SUPER_ADMIN'],
        },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-white border-l border-gray-200 flex flex-col h-screen fixed top-0 right-0 z-40 select-none shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 shrink-0 flex items-center justify-center p-1 bg-amber-50 rounded-xl border border-amber-200/60">
            <img
              src="/assets/LOGO.svg"
              alt="QGYM Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm tracking-wider text-gray-900 flex items-center gap-1">
              <span>QGYM</span>
              <span className="text-[#D4A72C] text-xs font-black">SYSTEM</span>
            </div>
            <div className="text-[10px] text-gray-400 font-medium truncate">نظام الإدارة المركزي</div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navGroups
          .filter((group) => group.roles.includes(role))
          .map((group) => {
            const allowedItems = group.items.filter((item) => item.roles.includes(role));
            if (allowedItems.length === 0) return null;
            const isCollapsed = collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition"
                >
                  <span>{group.title}</span>
                  {isCollapsed ? (
                    <ChevronLeft className="w-3 h-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pr-0.5">
                    {allowedItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/dashboard' &&
                          pathname.startsWith(item.href) &&
                          item.href !== '/memberships');

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isActive
                              ? 'bg-amber-50/90 text-amber-950 font-bold border-r-[3px] border-[#D4A72C]'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? 'text-[#D4A72C]' : 'text-gray-400 group-hover:text-gray-600'
                              }`}
                            />
                            <span>{item.title}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                                item.badge === 'LIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* User / Branch Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/70">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium">الفرع الحالي:</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-gray-800 border border-gray-200 truncate max-w-[130px] shadow-xs">
            {user.homeBranchName || '🌐 كافة الفروع'}
          </span>
        </div>
      </div>
    </aside>
  );
}
