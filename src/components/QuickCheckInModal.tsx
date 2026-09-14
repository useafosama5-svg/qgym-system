'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './Providers';
import { StatusBadge } from './StatusBadge';
import { formatTime, formatDate } from '@/lib/utils';
import {
  UserCheck,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  AlertCircle,
  ScanLine,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function QuickCheckInModal() {
  const { isCheckInModalOpen, setIsCheckInModalOpen, user, branches, selectedBranchId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetBranchId, setTargetBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set default branch
  useEffect(() => {
    if (isCheckInModalOpen) {
      if (user?.role !== 'SUPER_ADMIN' && user?.homeBranchId) {
        setTargetBranchId(user.homeBranchId);
      } else if (selectedBranchId !== 'ALL') {
        setTargetBranchId(selectedBranchId);
      } else if (branches.length > 0) {
        setTargetBranchId(branches[0].id);
      }
      setSearchQuery('');
      setCheckInResult(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCheckInModalOpen, user, branches, selectedBranchId]);

  if (!isCheckInModalOpen) return null;

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !targetBranchId) return;

    setIsLoading(true);
    setCheckInResult(null);

    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          branchId: targetBranchId,
          method: searchQuery.startsWith('GYM-') ? 'CUSTOMER_CODE' : searchQuery.length >= 10 ? 'PHONE' : 'BARCODE',
        }),
      });

      const data = await res.json();
      setCheckInResult(data);

      if (data.customer) {
        setRecentLogs((prev) => [
          {
            id: Date.now(),
            customerName: `${data.customer.firstName} ${data.customer.lastName}`,
            code: data.customer.customerCode,
            status: data.status,
            time: new Date(),
            branchName: data.currentBranch.name,
            reason: data.denialReason,
          },
          ...prev.slice(0, 4),
        ]);
      }

      setSearchQuery('');
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">بوابة تسجيل الدخول السريع (Check-In Terminal)</h2>
              <p className="text-xs text-gray-500">تحقق فوري من صلاحيات العضوية والفرع</p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckInModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Branch Selector (if Super Admin) */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>فرع الدخول الحالي (Gate Branch):</span>
            </div>
            {user?.role === 'SUPER_ADMIN' ? (
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                {user?.homeBranchName || 'الفرع الأساسي'}
              </span>
            )}
          </div>

          {/* Search Input */}
          <form onSubmit={handleCheckIn} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="امسح الباركود / QR أو اكتب كود العميل (GYM-000101) أو رقم الهاتف..."
              className="w-full bg-white border-2 border-emerald-500/50 rounded-xl px-4 py-3.5 pl-24 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-600 shadow-xs"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="absolute left-2 top-2 bottom-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>دخول</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Customer Chips for Testing */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <span>أمثلة تجريبية للاختبار السريع:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('GYM-000101');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition font-medium"
              >
                أحمد (VIP شامل الفروع)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('GYM-000102');
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition font-medium"
              >
                محمود (فرع نصر فقط)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('GYM-000103');
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition font-medium"
              >
                سارة (المعادي + نصر)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('GYM-000105');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition font-medium"
              >
                يوسف (منتهي)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('GYM-000106');
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition font-medium"
              >
                منى (مجمد)
              </button>
            </div>
          </div>

          {/* Check-In Response Card */}
          {checkInResult && (
            <div
              className={`p-5 rounded-xl border transition-all duration-200 ${
                checkInResult.status === 'ALLOWED'
                  ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                  : 'bg-rose-50/70 border-rose-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                      checkInResult.status === 'ALLOWED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {checkInResult.status === 'ALLOWED' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {checkInResult.customer
                          ? `${checkInResult.customer.firstName} ${checkInResult.customer.lastName}`
                          : 'لم يتم العثور على العميل'}
                      </h3>
                      <StatusBadge status={checkInResult.status} size="sm" />
                    </div>
                    {checkInResult.customer && (
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                        <span>كود: <strong className="text-gray-900">{checkInResult.customer.customerCode}</strong></span>
                        <span>هاتف: <strong className="text-gray-900">{checkInResult.customer.phone}</strong></span>
                        <span>الفرع الأساسي: <strong className="text-emerald-700">{checkInResult.customer.homeBranch.name}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Reason Notice */}
              {checkInResult.denialReason && (
                <div className="mt-4 p-3 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>سبب الرفض:</strong> {checkInResult.denialReason}</span>
                </div>
              )}

              {/* Membership details */}
              {checkInResult.membership && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-200 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block text-[10px]">الباقة:</span>
                    <span className="text-gray-900 font-semibold truncate block">{checkInResult.membership.planName}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block text-[10px]">نوع الصلاحية:</span>
                    <span className="text-emerald-700 font-semibold">{checkInResult.membership.accessType}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block text-[10px]">تاريخ الانتهاء:</span>
                    <span className="text-gray-900 font-semibold">{formatDate(checkInResult.membership.endDate)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block text-[10px]">المبلغ المتبقي:</span>
                    <span className={`font-semibold ${checkInResult.membership.remainingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {checkInResult.membership.remainingAmount > 0 ? `${checkInResult.membership.remainingAmount} ج.م` : 'مسدد بالكامل'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Terminal Activity */}
          {recentLogs.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-gray-700">آخر عمليات التسجيل في هذه الجلسة:</div>
              <div className="space-y-1.5">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.status === 'ALLOWED' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="text-gray-900 font-semibold">{log.customerName}</span>
                      <span className="text-gray-500 text-[11px]">({log.code})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.reason && (
                        <span className="text-[10px] text-rose-600 truncate max-w-[200px]">{log.reason}</span>
                      )}
                      <span className="text-gray-500 text-[11px]">{formatTime(log.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
