'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, AlertCircle, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'EXPIRY' | 'UNPAID' | 'DISCREPANCY' | 'INACTIVE';
  title: string;
  message: string;
  time: string;
  link: string;
  severity: 'warning' | 'danger' | 'info';
}

export function NotificationDrawer({
  isOpen,
  onClose,
  selectedBranchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId: string;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url =
        selectedBranchId && selectedBranchId !== 'ALL'
          ? `/api/notifications?branchId=${selectedBranchId}`
          : '/api/notifications';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, selectedBranchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-r border-gray-200 shadow-2xl flex flex-col text-right">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">مركز التنبيهات الذكي</h3>
                <p className="text-[11px] text-gray-500">تنبيهات فورية لعمليات الجيم والاشتراكات</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-7 h-7 border-2 border-[#D4A72C] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">جاري تحديث التنبيهات...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <div className="text-sm font-bold text-gray-800">لا توجد تنبيهات عاجلة حالياً</div>
                <div className="text-xs text-gray-500 mt-1">كافة العمليات والاشتراكات والخزائن بحالة ممتازة</div>
              </div>
            ) : (
              notifications.map((n) => {
                let borderCol = 'border-amber-200 bg-amber-50/60 text-amber-900';
                let iconCol = 'text-amber-600';
                let Icon = AlertTriangle;
                if (n.severity === 'danger') {
                  borderCol = 'border-rose-200 bg-rose-50/60 text-rose-900';
                  iconCol = 'text-rose-600';
                  Icon = AlertCircle;
                } else if (n.severity === 'info') {
                  borderCol = 'border-blue-200 bg-blue-50/60 text-blue-900';
                  iconCol = 'text-blue-600';
                  Icon = Clock;
                }

                return (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={onClose}
                    className={`block p-4 rounded-xl border ${borderCol} hover:shadow-xs transition group`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Icon className={`w-4 h-4 shrink-0 ${iconCol}`} />
                        <span className="text-gray-900">{n.title}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-gray-600">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed pl-4">{n.message}</p>
                    <div className="mt-2.5 flex items-center justify-end text-[11px] font-bold text-[#D4A72C] group-hover:translate-x-[-2px] transition">
                      <span>عرض التفاصيل</span>
                      <ChevronRight className="w-3.5 h-3.5 rotate-180 mr-1" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/90 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">إجمالي التنبيهات: {notifications.length}</span>
            <button
              onClick={fetchNotifications}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition"
            >
              تحديث القائمة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
