'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import {
  Users,
  CreditCard,
  UserCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  BarChart2,
  PieChart as PieIcon,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  Receipt,
  Wallet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Recharts containers
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl bg-white border border-gray-200 animate-pulse flex items-center justify-center text-xs text-gray-400">
      جاري تحميل الرسوم البيانية...
    </div>
  ),
});

const PaymentPieChart = dynamic(
  () => import('@/components/DashboardCharts').then((mod) => mod.PaymentPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
        جاري التحميل...
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user, selectedBranchId, branches, setIsCheckInModalOpen } = useApp();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/reports?branchId=${selectedBranchId}&period=30`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBranchId]);

  if (!user) return null;

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentBranchName =
    selectedBranchId === 'ALL'
      ? 'كافة الفروع'
      : branches.find((b) => b.id === selectedBranchId)?.name || user.homeBranchName || 'الفرع الرئيسي';

  const kpis = data?.kpis || {
    totalCustomers: 0,
    activeMemberships: 0,
    todayCheckins: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    expiringSoonCount: 0,
  };

  const branchComparison = data?.branchComparison || [];
  const peakHoursData = data?.peakHoursData || [];
  const recentAttendances = data?.recentAttendances || [];
  const expiringSoonList = data?.expiringSoonList || [];
  const cashierExpected = data?.activeCashierSession?.expectedCash || 0;

  const paymentMethods = [
    { name: 'كاش', value: data?.paymentBreakdown?.CASH || 0 },
    { name: 'فيزا / بطاقة', value: data?.paymentBreakdown?.VISA || 0 },
    { name: 'إنستاباي', value: data?.paymentBreakdown?.INSTAPAY || 0 },
    { name: 'فودافون كاش', value: data?.paymentBreakdown?.VODAFONE_CASH || 0 },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#D4A72C', '#EC4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Clean Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              مرحباً، {user.name}
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {user.roleDisplayName}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            نطاق البيانات المعروضة: <span className="font-semibold text-gray-700">{currentBranchName}</span>
          </p>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white text-xs font-bold shadow-xs transition active:scale-98"
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل حضور (F2)</span>
          </button>
          <Link
            href="/customers?new=1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition"
          >
            <UserPlus className="w-3.5 h-3.5 text-gray-500" />
            <span>عميل جديد (F3)</span>
          </Link>
          <Link
            href="/finance/payments?new=1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition"
          >
            <DollarSign className="w-3.5 h-3.5 text-gray-500" />
            <span>تحصيل دفعة (F4)</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">إجمالي العملاء</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {isLoading ? <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse"></div> : (kpis.totalCustomers || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">مسجلين في النظام</div>
        </div>

        {/* Active Memberships */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">العضويات النشطة</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {isLoading ? <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse"></div> : (kpis.activeMemberships || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600/80 font-medium">اشتراكات سارية</div>
        </div>

        {/* Today's Checkins */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">حضور اليوم</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">
            {isLoading ? <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse"></div> : (kpis.todayCheckins || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">تسجيل دخول اليوم</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">إجمالي الإيرادات</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D4A72C] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {isLoading ? <div className="h-7 w-20 bg-gray-100 rounded-md animate-pulse"></div> : `${(kpis.totalRevenue || 0).toLocaleString()}`}
          </div>
          <div className="text-[10px] text-[#D4A72C] font-semibold">ج.م (خلال 30 يوم)</div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">تنتهي قريباً</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {isLoading ? <div className="h-7 w-12 bg-gray-100 rounded-md animate-pulse"></div> : (kpis.expiringSoonCount || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-600 font-medium">خلال 7 أيام</div>
        </div>

        {/* Cash in Drawer */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span className="font-semibold">نقدية الدرج</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {isLoading ? <div className="h-7 w-16 bg-gray-100 rounded-md animate-pulse"></div> : `${(cashierExpected || 0).toLocaleString()}`}
          </div>
          <div className="text-[10px] text-teal-600 font-medium">ج.م رصيد الوردية</div>
        </div>
      </div>

      {/* 3. Priority Operations Grid: Today's Attendance + Expiring Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Recent Check-ins (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">آخر حركات تسجيل الحضور اليوم</h2>
            </div>
            <Link
              href="/attendance"
              className="text-xs font-semibold text-[#D4A72C] hover:underline flex items-center gap-1"
            >
              <span>عرض كل الحضور</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="py-2.5 font-semibold">العميل</th>
                  <th className="py-2.5 font-semibold">الفرع</th>
                  <th className="py-2.5 font-semibold">الوقت</th>
                  <th className="py-2.5 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      جاري تحميل بيانات الحضور...
                    </td>
                  </tr>
                ) : recentAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 font-medium">
                      لم يتم تسجيل أي حضور اليوم بعد
                    </td>
                  </tr>
                ) : (
                  recentAttendances.slice(0, 5).map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-2.5 font-medium text-gray-900">
                        <Link href={`/customers/${att.customerId}`} className="hover:text-[#D4A72C]">
                          {att.customer?.firstName} {att.customer?.lastName}
                        </Link>
                        <span className="text-[10px] text-gray-400 block">{att.customer?.customerCode}</span>
                      </td>
                      <td className="py-2.5 text-gray-600">{att.branch?.name}</td>
                      <td className="py-2.5 text-gray-500 font-mono">{formatTime(att.checkinTime)}</td>
                      <td className="py-2.5">
                        {att.status === 'ALLOWED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            مسموح
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            مرفوض
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Soon Widget (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">تنتهي قريباً</h2>
            </div>
            <Link
              href="/memberships/expiring"
              className="text-xs font-semibold text-[#D4A72C] hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-gray-400">جاري التحميل...</div>
            ) : expiringSoonList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 font-medium">
                لا توجد عضويات تنتهي قريباً
              </div>
            ) : (
              expiringSoonList.slice(0, 4).map((m: any) => {
                const diffDays = Math.max(
                  0,
                  Math.ceil((new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                );
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-900">
                        {m.customer.firstName} {m.customer.lastName}
                      </div>
                      <div className="text-[10px] text-gray-500">{m.plan?.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {diffDays === 0 ? 'اليوم' : `${diffDays} أيام`}
                      </span>
                      <Link
                        href={`/customers/${m.customer.id}`}
                        className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700"
                        title="تفاصيل العميل"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Multi-Branch Performance & Analytics */}
      <DashboardCharts
        branchComparison={branchComparison}
        peakHoursData={peakHoursData}
        isLoading={isLoading}
      />

      {/* 5. Payment Methods Breakdown & Branch Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#D4A72C]" />
              توزيع طرق التحصيل والدفع
            </h3>
            <p className="text-[11px] text-gray-500">كاش، فيزا، إنستاباي، فودافون كاش</p>
          </div>

          <div className="h-48 w-full">
            <PaymentPieChart paymentMethods={paymentMethods} colors={COLORS} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
            {paymentMethods.map((pm, idx) => (
              <div key={pm.name} className="flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{pm.name}</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">{pm.value.toLocaleString()} ج.م</span>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Leaderboard (Super Admin view or Branch Overview) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D4A72C] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-gray-900">مؤشرات أداء الفروع (Branch Leaderboard)</h3>
            </div>
            <span className="text-[10px] text-gray-400">ترتيب الفروع حسب الإيرادات</span>
          </div>

          <div className="space-y-3">
            {branchComparison.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">لا توجد بيانات مقارنة متاحة</div>
            ) : (
              branchComparison.map((b: any, idx: number) => {
                const totalRev = branchComparison.reduce((acc: number, curr: any) => acc + curr.revenue, 0) || 1;
                const percentage = Math.round((b.revenue / totalRev) * 100);

                let badgeColor = 'bg-gray-100 text-gray-700';
                if (idx === 0) badgeColor = 'bg-amber-100 text-amber-900 font-bold';
                if (idx === 1) badgeColor = 'bg-slate-200 text-slate-800 font-bold';
                if (idx === 2) badgeColor = 'bg-orange-100 text-orange-900 font-bold';

                return (
                  <div key={b.name} className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeColor}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-gray-900">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-[11px]">{b.membersCount || 0} عضو</span>
                        <span className="font-bold text-gray-900 font-mono">{b.revenue.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#D4A72C] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
