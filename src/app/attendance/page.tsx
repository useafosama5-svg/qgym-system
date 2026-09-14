'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/Providers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTime, formatDate } from '@/lib/utils';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  AlertCircle,
  ScanLine,
  Phone,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Link from 'next/link';

export default function AttendancePage() {
  const { user, branches, selectedBranchId } = useApp();
  const [targetBranchId, setTargetBranchId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isFetchingRecords, setIsFetchingRecords] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Web Audio Synth for feedback chimes
  const playFeedbackSound = (isAllowed: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (isAllowed) {
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(130, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN' && user?.homeBranchId) {
      setTargetBranchId(user.homeBranchId);
    } else if (selectedBranchId !== 'ALL') {
      setTargetBranchId(selectedBranchId);
    } else if (branches.length > 0) {
      setTargetBranchId(branches[0].id);
    }
  }, [user, selectedBranchId, branches]);

  const fetchAttendanceRecords = async () => {
    setIsFetchingRecords(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? (selectedBranchId === 'ALL' ? '' : selectedBranchId) : user?.homeBranchId;
      const res = await fetch(`/api/attendance?branchId=${bId || 'ALL'}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.attendances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingRecords(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedBranchId, statusFilter]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: searchQuery.trim(),
          branchId: targetBranchId,
          method: searchQuery.startsWith('GYM-') ? 'CUSTOMER_CODE' : searchQuery.length >= 10 ? 'PHONE' : 'BARCODE',
        }),
      });

      const data = await res.json();
      setLastResult(data);
      playFeedbackSound(data.status === 'ALLOWED');
      setSearchQuery('');
      fetchAttendanceRecords();
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBranchName = branches.find((b) => b.id === targetBranchId)?.name || 'الفرع المحدد';

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center border border-amber-200">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">بوابة تسجيل الحضور والدخول</h1>
            <p className="text-xs text-gray-500">
              تسجيل الحضور المركزي والتحقق اللحظي من اشتراكات الفروع
            </p>
          </div>
        </div>

        {/* Branch Selection & Audio Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D4A72C]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            <span>{soundEnabled ? 'الصوت مفعّل' : 'صامت'}</span>
          </button>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
            <Building2 className="w-4 h-4 text-[#D4A72C]" />
            <span className="text-gray-600 font-medium">البوابة الحالية:</span>
            {user?.role === 'SUPER_ADMIN' ? (
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-md px-2 py-0.5 focus:outline-none focus:border-amber-400"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-gray-900">{currentBranchName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Scanner Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <form onSubmit={handleCheckIn} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="امسح الباركود / QR أو اكتب كود العميل (GYM-000101) أو رقم الهاتف..."
            className="w-full bg-white border-2 border-[#D4A72C] rounded-2xl px-5 py-3.5 pl-32 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 shadow-xs transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="absolute left-2 top-2 bottom-2 px-5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 shadow-xs"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>تحقق ودخول</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Cases for Testing */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A72C]" />
            اختبارات سريعة:
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('GYM-000101')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition font-medium"
          >
            ✓ أحمد (شامل كل الفروع)
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('GYM-000102')}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition font-medium"
          >
            محمود (فرع نصر فقط)
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('GYM-000103')}
            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition font-medium"
          >
            سارة (المعادي + نصر)
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('GYM-000105')}
            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition font-medium"
          >
            ✗ يوسف (اشتراك منتهي)
          </button>
          <button
            type="button"
            onClick={() => setSearchQuery('GYM-000106')}
            className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 transition font-medium"
          >
            ✗ منى (اشتراك مجمد)
          </button>
        </div>

        {/* Big Visual Result Display */}
        {lastResult && (
          <div
            className={`p-5 rounded-2xl border-2 transition-all duration-200 ${
              lastResult.status === 'ALLOWED'
                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                : 'bg-rose-50/90 border-rose-400 text-rose-950'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                    lastResult.status === 'ALLOWED' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {lastResult.status === 'ALLOWED' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-black text-gray-900">
                      {lastResult.customer
                        ? `${lastResult.customer.firstName} ${lastResult.customer.lastName}`
                        : 'العميل غير مسجل'}
                    </h3>
                    <StatusBadge status={lastResult.status} size="md" />
                  </div>

                  {lastResult.customer && (
                    <div className="text-xs text-gray-600 flex flex-wrap gap-4 mt-1">
                      <span>
                        الكود: <strong className="text-gray-900">{lastResult.customer.customerCode}</strong>
                      </span>
                      <span>
                        الهاتف: <strong className="text-gray-900" dir="ltr">{lastResult.customer.phone}</strong>
                      </span>
                      <span>
                        الفرع الأساسي:{' '}
                        <strong className="text-[#D4A72C]">{lastResult.customer.homeBranch.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {lastResult.customer && (
                <Link
                  href={`/customers/${lastResult.customer.id}`}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold border border-gray-200 self-start md:self-auto shadow-2xs transition"
                >
                  عرض الملف الكامل
                </Link>
              )}
            </div>

            {/* Denial Reason Alert */}
            {lastResult.denialReason && (
              <div className="mt-3.5 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>سبب الرفض: {lastResult.denialReason}</span>
              </div>
            )}

            {/* Membership Details */}
            {lastResult.membership && (
              <div className="mt-3.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-gray-200/60 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">باقة العضوية</span>
                  <span className="text-gray-900 font-bold">{lastResult.membership.planName}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">نطاق الصلاحية</span>
                  <span className="text-[#D4A72C] font-bold">{lastResult.membership.accessType}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">صلاحية الاشتراك</span>
                  <span className="text-gray-900 font-semibold">
                    حتى {formatDate(lastResult.membership.endDate)}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">حالة السداد</span>
                  <span
                    className={`font-bold ${
                      lastResult.membership.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {lastResult.membership.remainingAmount > 0
                      ? `متبقي ${lastResult.membership.remainingAmount} ج.م`
                      : 'خالص السداد'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance History Log */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4A72C]" />
            <h2 className="text-sm font-bold text-gray-900">سجل حركات الحضور المسجلة</h2>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الكل ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('ALLOWED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ALLOWED'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              المصرح لهم
            </button>
            <button
              onClick={() => setStatusFilter('DENIED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'DENIED'
                  ? 'bg-rose-50 text-rose-800 font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              المرفوضين
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3">العميل</th>
                <th className="p-3">الفرع الأساسي</th>
                <th className="p-3">فرع الدخول</th>
                <th className="p-3">وقت التسجيل</th>
                <th className="p-3">طريقة الفحص</th>
                <th className="p-3">الحالة والسبب</th>
                <th className="p-3">الموظف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isFetchingRecords ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    جاري تحميل سجل الحضور...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 font-medium">
                    لا توجد حركات حضور مسجلة
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 font-semibold text-gray-900">
                      <Link href={`/customers/${r.customerId}`} className="hover:text-[#D4A72C]">
                        {r.customer?.firstName} {r.customer?.lastName}
                      </Link>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {r.customer?.customerCode}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{r.customer?.homeBranch?.name}</td>
                    <td className="p-3 text-gray-800 font-medium">{r.branch?.name}</td>
                    <td className="p-3 text-gray-500 font-mono">{formatTime(r.checkinTime)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                        {r.method}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={r.status} size="sm" />
                        {r.denialReason && (
                          <span className="text-[10px] text-rose-600 truncate max-w-[140px]" title={r.denialReason}>
                            {r.denialReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-500">{r.staff?.name || 'النظام الذكي'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
