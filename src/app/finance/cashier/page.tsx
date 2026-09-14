'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  Wallet,
  Building2,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function CashierPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Open Session Modal
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('1000');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  // Close Session Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<any>(null);

  const fetchCashierData = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? (selectedBranchId === 'ALL' ? '' : selectedBranchId) : user?.homeBranchId;
      const res = await fetch(`/api/finance/cashier?branchId=${bId || 'ALL'}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.activeSession || null);
        setSummary(data.summary || null);
        setPastSessions(data.pastSessions || data.sessions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierData();
  }, [selectedBranchId, user]);

  useEffect(() => {
    if (branches.length > 0) {
      setTargetBranchId(user?.homeBranchId || branches[0].id);
    }
  }, [branches, user]);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpening(true);
    try {
      const res = await fetch('/api/finance/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          branchId: targetBranchId,
          openingBalance,
          notes: sessionNotes,
        }),
      });
      if (res.ok) {
        setIsOpenModalOpen(false);
        fetchCashierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !actualCash) return;
    setIsClosing(true);
    try {
      const res = await fetch('/api/finance/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE',
          sessionId: activeSession.id,
          actualCash,
          notes: closeNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCloseResult(data);
        setIsCloseModalOpen(false);
        fetchCashierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClosing(false);
    }
  };

  const expectedCashVal = summary?.expectedCash || 0;
  const countedCash = parseFloat(actualCash || '0');
  const previewDiff = countedCash - expectedCashVal;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">إدارة الخزينة والتقفيل اليومي</h1>
            <p className="text-xs text-gray-500">
              متابعة حركة النقدية اللحظية بالدرج وتقفيل ورديات الاستقبال ومطابقة العجز والزيادة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!activeSession && user?.role !== 'TRAINER' && (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>فتح خزينة جديدة (Open Drawer)</span>
            </button>
          )}

          {activeSession && user?.role !== 'TRAINER' && (
            <button
              onClick={() => {
                setActualCash(String(summary?.expectedCash || 0));
                setIsCloseModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تقفيل الوردية اليومية (Daily Closing)</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Cash Drawer Live Board */}
      {activeSession && summary ? (
        <div className="bg-white p-6 rounded-2xl border border-emerald-300 shadow-2xs space-y-6">
          {/* Top Session Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-base font-bold text-gray-900">الخزينة المفتوحة حالياً: {activeSession.sessionNumber}</h2>
                <StatusBadge status="OPEN" size="sm" />
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-4 mt-1">
                <span>الفرع: <strong className="text-emerald-700">{activeSession.branch.name}</strong></span>
                <span>المسؤول: <strong className="text-gray-800">{activeSession.employee.name}</strong></span>
                <span>وقت الفتح: <strong className="text-gray-800">{formatTime(activeSession.openedAt)}</strong> ({formatDate(activeSession.openedAt)})</span>
              </div>
            </div>

            <div className="text-left bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block">رصيد فتح الدرج (Opening Cash):</span>
              <span className="text-base font-black text-gray-900 font-mono">{formatCurrency(summary.openingBalance)}</span>
            </div>
          </div>

          {/* Key Numbers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-500 font-medium block">إجمالي مبيعات اليوم (Sales)</span>
              <span className="text-xl font-black text-emerald-600 font-mono block">{formatCurrency(summary.totalSales)}</span>
              <span className="text-[10px] text-gray-400">{activeSession.payments.length} عملية تحصيل</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-500 font-medium block">التحصيل النقدي (Cash In)</span>
              <span className="text-xl font-black text-[#D4A72C] font-mono block">{formatCurrency(summary.cashPayments)}</span>
              <span className="text-[10px] text-gray-400">نقدية دخلت الدرج</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-500 font-medium block">المصروفات النقدية (Cash Out)</span>
              <span className="text-xl font-black text-rose-600 font-mono block">{formatCurrency(summary.cashExpenses)}</span>
              <span className="text-[10px] text-gray-400">مصروفات خرجت من الدرج</span>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-emerald-900 font-bold block">النقدية المتوقعة بالدرج (Expected)</span>
              <span className="text-2xl font-black text-emerald-950 font-mono block">{formatCurrency(summary.expectedCash)}</span>
              <span className="text-[10px] text-emerald-700">Opening + CashIn - CashOut</span>
            </div>
          </div>

          {/* Breakdown by Method */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <h3 className="text-xs font-bold text-gray-800">تفصيل التحصيلات حسب طريقة الدفع:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block text-[10px]">كاش (Cash)</span>
                <span className="font-bold text-gray-900 font-mono">{formatCurrency(summary.cashPayments)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block text-[10px]">فيزا (Visa/POS)</span>
                <span className="font-bold text-blue-600 font-mono">{formatCurrency(summary.visaPayments)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block text-[10px]">إنستاباي (InstaPay)</span>
                <span className="font-bold text-purple-600 font-mono">{formatCurrency(summary.instapayPayments)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block text-[10px]">فودافون كاش</span>
                <span className="font-bold text-rose-600 font-mono">{formatCurrency(summary.vodafoneCashPayments)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500 block text-[10px]">إجمالي الدفع الإلكتروني</span>
                <span className="font-bold text-cyan-600 font-mono">{formatCurrency(summary.digitalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-2 shadow-2xs">
          <Wallet className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900">لا توجد خزينة مفتوحة حالياً لهذا الفرع</h3>
          <p className="text-xs text-gray-500">يمكنك فتح وردية جديدة لبدء تسجيل المقبوضات والمصروفات</p>
        </div>
      )}

      {/* Past Sessions History Table */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#D4A72C]" />
          سجل الورديات والتقفيلات اليومية السابقة
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">رقم الوردية</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">تاريخ الفتح</th>
                <th className="p-3.5">تاريخ الإغلاق</th>
                <th className="p-3.5">رصيد الفتح</th>
                <th className="p-3.5">المتوقع بالدرج</th>
                <th className="p-3.5">الموجود الفعلي</th>
                <th className="p-3.5">الفارق (عجز/زيادة)</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    جاري تحميل سجل الورديات...
                  </td>
                </tr>
              ) : pastSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                    لا توجد ورديات سابقة مسجلة
                  </td>
                </tr>
              ) : (
                pastSessions.map((s: any) => {
                  const diff = s.discrepancy || 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{s.sessionNumber}</td>
                      <td className="p-3.5 text-gray-800">{s.branch.name}</td>
                      <td className="p-3.5 text-gray-600">{s.employee.name}</td>
                      <td className="p-3.5 font-mono text-gray-500">{formatDate(s.openedAt)} {formatTime(s.openedAt)}</td>
                      <td className="p-3.5 font-mono text-gray-500">{s.closedAt ? `${formatDate(s.closedAt)} ${formatTime(s.closedAt)}` : '-'}</td>
                      <td className="p-3.5 font-mono">{formatCurrency(s.openingBalance)}</td>
                      <td className="p-3.5 font-mono font-bold text-gray-900">{s.expectedCash ? formatCurrency(s.expectedCash) : '-'}</td>
                      <td className="p-3.5 font-mono font-bold text-gray-900">{s.actualCash ? formatCurrency(s.actualCash) : '-'}</td>
                      <td className="p-3.5 font-mono">
                        {s.status === 'CLOSED' ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                              diff === 0
                                ? 'bg-emerald-50 text-emerald-800'
                                : diff > 0
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-rose-50 text-rose-800 font-black'
                            }`}
                          >
                            {diff === 0 ? 'مطابق (0)' : diff > 0 ? `+${formatCurrency(diff)} زيادة` : `${formatCurrency(diff)} عجز`}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={s.status} size="sm" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">فتح خزينة ووردية جديدة</h3>
            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">الفرع</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600 block mb-1">رصيد بداية الدرج (Opening Balance)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>
              <div>
                <label className="text-gray-600 block mb-1">ملاحظات الفتح</label>
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="استلام الدرج من الوردية السابقة"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isOpening}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  {isOpening ? 'جاري الفتح...' : 'تأكيد فتح الخزينة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تقفيل الخزينة والوردية اليومية</h3>
            <form onSubmit={handleCloseSession} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="text-gray-500 block">النقدية المتوقعة حسابياً بالدرج:</span>
                <span className="text-lg font-black text-gray-900 font-mono">{formatCurrency(expectedCashVal)}</span>
              </div>
              <div>
                <label className="text-gray-600 block mb-1">الموجود النقدي الفعلي بعد الجرد (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-black text-base"
                />
              </div>

              {actualCash && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    previewDiff === 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : previewDiff > 0
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {previewDiff === 0
                    ? '✓ الدرج مطابق تماماً (لا يوجد عجز أو زيادة)'
                    : previewDiff > 0
                    ? `+ زيادة بمقدار ${formatCurrency(previewDiff)}`
                    : ` عجز بمقدار ${formatCurrency(previewDiff)}`}
                </div>
              )}

              <div>
                <label className="text-gray-600 block mb-1">ملاحظات التقفيل</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="تم الجرد وتسليم العهدة للإدارة"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isClosing}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold"
                >
                  {isClosing ? 'جاري التقفيل...' : 'تأكيد التقفيل النهائي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
