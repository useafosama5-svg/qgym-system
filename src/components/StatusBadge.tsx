import React from 'react';
import { CheckCircle2, XCircle, Clock, PauseCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = status ? status.toUpperCase() : '';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  if (s === 'ACTIVE' || s === 'نشط' || s === 'ALLOWED' || s === 'OPEN') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        {s === 'OPEN' ? 'مفتوحة' : s === 'ALLOWED' ? 'مصرح بالدخول' : 'نشط'}
      </span>
    );
  }

  if (s === 'EXPIRED' || s === 'منتهي') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        منتهي الصلاحية
      </span>
    );
  }

  if (s === 'FROZEN' || s === 'مجمد') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses[size]}`}>
        <PauseCircle className="w-3.5 h-3.5 text-sky-500" />
        مجمد
      </span>
    );
  }

  if (s === 'DENIED' || s === 'مرفوض') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        دخول مرفوض
      </span>
    );
  }

  if (s === 'CLOSED' || s === 'مغلقة') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizeClasses[size]}`}>
        <Clock className="w-3.5 h-3.5 text-gray-500" />
        مغلقة
      </span>
    );
  }

  if (s === 'INACTIVE' || s === 'غير نشط' || s === 'CANCELLED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}>
        موقوف
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizeClasses[size]}`}>
      {status || 'غير محدد'}
    </span>
  );
}
