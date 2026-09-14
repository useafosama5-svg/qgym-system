'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  User,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  History,
  Activity,
  Dumbbell,
  ArrowRightLeft,
  PauseCircle,
  PlusCircle,
  DollarSign,
  Clock,
  AlertCircle,
  QrCode,
  Barcode,
  X,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Printer,
  Sparkles,
  ShieldCheck,
  Award,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { MembershipCardModal } from '@/components/MembershipCardModal';
import { ReceiptModal } from '@/components/ReceiptModal';

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const { user, branches } = useApp();

  const [customer, setCustomer] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('memberships');

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferBranchId, setTransferBranchId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeMembershipId, setFreezeMembershipId] = useState('');
  const [freezeDays, setFreezeDays] = useState('15');
  const [freezeReason, setFreezeReason] = useState('');
  const [isFreezing, setIsFreezing] = useState(false);

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewPaidAmount, setRenewPaidAmount] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('CASH');
  const [isRenewing, setIsRenewing] = useState(false);

  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [measWeight, setMeasWeight] = useState('');
  const [measHeight, setMeasHeight] = useState('175');
  const [measBodyFat, setMeasBodyFat] = useState('');
  const [measChest, setMeasChest] = useState('');
  const [measWaist, setMeasWaist] = useState('');
  const [measArms, setMeasArms] = useState('');
  const [measNotes, setMeasNotes] = useState('');
  const [isRecordingMeas, setIsRecordingMeas] = useState(false);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchCustomerProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/memberships/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (e) {
        // silent
      }
    };
    fetchPlans();
  }, [customerId]);

  // Handle Transfer Branch
  const handleTransferBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBranchId) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newBranchId: transferBranchId,
          notes: transferReason,
        }),
      });
      if (res.ok) {
        setIsTransferModalOpen(false);
        fetchCustomerProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Freeze Membership
  const handleFreezeMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeMembershipId) return;
    setIsFreezing(true);
    try {
      const res = await fetch(`/api/memberships/${freezeMembershipId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freezeDays: parseInt(freezeDays, 10),
          reason: freezeReason,
        }),
      });
      if (res.ok) {
        setIsFreezeModalOpen(false);
        fetchCustomerProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFreezing(false);
    }
  };

  // Handle Renew Membership
  const handleRenewMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    const memId = customer.memberships?.[0]?.id;
    if (!memId || !renewPlanId) return;
    setIsRenewing(true);
    try {
      const res = await fetch(`/api/memberships/${memId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: renewPlanId,
          paidAmount: parseFloat(renewPaidAmount || '0'),
          paymentMethod: renewPaymentMethod,
        }),
      });
      if (res.ok) {
        setIsRenewModalOpen(false);
        fetchCustomerProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRenewing(false);
    }
  };

  // Handle Add InBody Measurement
  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measWeight) return;
    setIsRecordingMeas(true);
    try {
      const res = await fetch('/api/fitness/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          weight: parseFloat(measWeight),
          height: parseFloat(measHeight),
          bodyFat: measBodyFat ? parseFloat(measBodyFat) : undefined,
          chest: measChest ? parseFloat(measChest) : undefined,
          waist: measWaist ? parseFloat(measWaist) : undefined,
          arms: measArms ? parseFloat(measArms) : undefined,
          notes: measNotes,
        }),
      });
      if (res.ok) {
        setIsMeasurementModalOpen(false);
        setMeasWeight('');
        setMeasBodyFat('');
        fetchCustomerProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecordingMeas(false);
    }
  };

  if (isLoading || !customer) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        <div className="h-40 bg-white rounded-3xl border border-gray-200"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
        </div>
        <div className="h-80 bg-white rounded-2xl border border-gray-200"></div>
      </div>
    );
  }

  const latestMembership = customer.memberships?.[0];
  const lastAttendance = customer.attendance?.[0];
  const assignedTrainer = customer.trainerAssignments?.[0]?.trainer?.user?.name || 'غير محدد';

  let daysRemaining = 0;
  if (latestMembership) {
    const diff = new Date(latestMembership.endDate).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const chartData = (customer.measurements || []).map((m: any) => ({
    date: formatDate(m.recordedAt),
    weight: m.weight,
    bodyFat: m.bodyFat || 0,
    bmi: m.bmi || 0,
  }));

  const whatsappNumber = (customer.whatsapp || customer.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>الرجوع إلى دليل العملاء</span>
        </Link>

        <div className="flex items-center gap-2">
          {whatsappNumber && (
            <a
              href={`https://wa.me/2${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>مراسلة واتساب</span>
            </a>
          )}

          <button
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4A72C] text-white font-bold text-xs shadow-xs hover:bg-[#b88d1b] transition"
          >
            <QrCode className="w-4 h-4" />
            <span>كارنيه العضوية الرقمي</span>
          </button>
        </div>
      </div>

      {/* 360 Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Info */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl font-black text-[#D4A72C]">
              {customer.firstName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                <StatusBadge status={customer.status} size="md" />
                <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200 font-mono font-bold text-xs">
                  {customer.customerCode}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <strong className="text-gray-800" dir="ltr">
                    {customer.phone}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#D4A72C]" />
                  <span>
                    الفرع الأساسي: <strong className="text-gray-900">{customer.homeBranch.name}</strong>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>تاريخ التسجيل: {formatDate(customer.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {latestMembership && (
              <button
                onClick={() => {
                  setRenewPlanId(latestMembership.planId);
                  setRenewPaidAmount(String(latestMembership.plan?.price || 0));
                  setIsRenewModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تجديد الاشتراك</span>
              </button>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  setTransferBranchId(branches.find((b) => b.id !== customer.homeBranchId)?.id || '');
                  setIsTransferModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                <span>نقل الفرع</span>
              </button>
            )}

            <button
              onClick={() => setIsMeasurementModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200 transition"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>تسجيل إنبادي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Days Left */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">الأيام المتبقية</span>
            <Clock className="w-4 h-4 text-[#D4A72C]" />
          </div>
          <div className="text-xl font-black text-gray-900">
            {customer.status === 'ACTIVE' && latestMembership ? (
              <span className={daysRemaining <= 7 ? 'text-rose-600' : 'text-emerald-600'}>
                {daysRemaining} يوم
              </span>
            ) : (
              <span className="text-gray-400">منتهي</span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 truncate">
            {latestMembership ? latestMembership.plan.name : 'لا يوجد اشتراك'}
          </div>
        </div>

        {/* Card 2: Balance Due */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">المبلغ المتبقي</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black">
            {(latestMembership?.remainingAmount || 0) > 0 ? (
              <span className="text-rose-600">{formatCurrency(latestMembership.remainingAmount)}</span>
            ) : (
              <span className="text-emerald-600">خالص (0 ج.م)</span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">حالة الحساب المالي</div>
        </div>

        {/* Card 3: Last Checkin */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">آخر تسجيل حضور</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">
            {lastAttendance ? formatDate(lastAttendance.checkinTime) : 'لم يحضر بعد'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 truncate">
            {lastAttendance ? lastAttendance.branch.name : '-'}
          </div>
        </div>

        {/* Card 4: Total Visits */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">إجمالي الزيارات</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-gray-900">
            {customer.attendance?.filter((a: any) => a.status === 'ALLOWED').length || 0}{' '}
            <span className="text-xs font-normal text-gray-500">زيارة</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1">عبر كافة الفروع</div>
        </div>

        {/* Card 5: Trainer */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">المدرب المشرف</span>
            <Dumbbell className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">{assignedTrainer}</div>
          <div className="text-[10px] text-gray-500 mt-1">متابعة التدريب</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'memberships', label: 'الاشتراكات والعضوية', icon: CreditCard, count: customer.memberships?.length || 0 },
          { id: 'attendance', label: 'سجل الحضور عبر الفروع', icon: Clock, count: customer.attendance?.length || 0 },
          { id: 'payments', label: 'المدفوعات والإيصالات', icon: DollarSign, count: customer.payments?.length || 0 },
          { id: 'fitness', label: 'القياسات والإنبادي', icon: Activity, count: customer.measurements?.length || 0 },
          { id: 'workouts', label: 'جداول التمارين', icon: Dumbbell, count: customer.workoutPlans?.length || 0 },
          { id: 'history', label: 'تاريخ انتقالات الفرع', icon: History, count: customer.branchHistories?.length || 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 bg-gray-100 text-[10px] rounded-full text-gray-600 font-mono">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Memberships */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {customer.memberships?.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
              لا توجد اشتراكات مسجلة لهذا العميل
            </div>
          ) : (
            customer.memberships.map((mem: any, idx: number) => (
              <div
                key={mem.id}
                className={`bg-white p-5 rounded-2xl border ${
                  idx === 0 ? 'border-amber-300 shadow-2xs' : 'border-gray-200 opacity-80'
                } space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center font-bold">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{mem.plan.name}</h3>
                        <StatusBadge status={mem.status} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500">
                        الفرع الأساسي للباقة: <span className="font-semibold text-gray-700">{mem.homeBranch.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mem.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setFreezeMembershipId(mem.id);
                          setIsFreezeModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 text-xs font-semibold transition"
                      >
                        تجميد الاشتراك
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">تاريخ البدء</span>
                    <span className="font-semibold text-gray-800">{formatDate(mem.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">تاريخ الانتهاء</span>
                    <span className="font-semibold text-gray-800">{formatDate(mem.endDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">إجمالي السعر</span>
                    <span className="font-bold text-gray-900">{formatCurrency(mem.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">المبلغ المتبقي</span>
                    <span className={mem.remainingAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {formatCurrency(mem.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">الفرع</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">طريقة التحقق</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">الموظف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customer.attendance?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      لا يوجد سجل حضور مسجل لهذا العميل
                    </td>
                  </tr>
                ) : (
                  customer.attendance.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-bold text-gray-900">{att.branch.name}</td>
                      <td className="p-3.5 text-gray-500 font-mono">
                        {formatDate(att.checkinTime)} — {formatTime(att.checkinTime)}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px]">
                          {att.method}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={att.status} size="sm" />
                      </td>
                      <td className="p-3.5 text-gray-500">{att.staff?.name || 'النظام الذكي'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">الفرع</th>
                  <th className="p-3.5">تاريخ السداد</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">المحصل</th>
                  <th className="p-3.5 text-center">طباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customer.payments?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">
                      لا توجد مدفوعات مسجلة
                    </td>
                  </tr>
                ) : (
                  customer.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{p.receiptNumber}</td>
                      <td className="p-3.5 text-gray-700">{p.branch.name}</td>
                      <td className="p-3.5 text-gray-500 font-mono">{formatDate(p.paymentDate)}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="p-3.5 text-gray-500">{p.cashier?.name || 'الكاشير'}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() =>
                            setSelectedReceipt({
                              receiptNumber: p.receiptNumber,
                              customerName: `${customer.firstName} ${customer.lastName}`,
                              customerCode: customer.customerCode,
                              branchName: p.branch.name,
                              planName: latestMembership?.plan.name || 'سداد دفعة',
                              amount: p.amount,
                              paymentMethod: p.paymentMethod,
                              cashierName: p.cashier?.name || user?.name,
                              paymentDate: p.paymentDate,
                            })
                          }
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: InBody Measurements Chart & Records */}
      {activeTab === 'fitness' && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                تطور الوزن ونسبة الدهون عبر الزمن (InBody Progress)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#0f172a',
                      }}
                    />
                    <Line type="monotone" dataKey="weight" name="الوزن (kg)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bodyFat" name="نسبة الدهون (%)" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">تاريخ القياس</th>
                    <th className="p-3.5">الوزن (kg)</th>
                    <th className="p-3.5">الطول (cm)</th>
                    <th className="p-3.5">الدهون (%)</th>
                    <th className="p-3.5">مؤشر BMI</th>
                    <th className="p-3.5">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {customer.measurements?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        لا توجد قياسات InBody مسجلة
                      </td>
                    </tr>
                  ) : (
                    customer.measurements.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-mono text-gray-900 font-semibold">{formatDate(m.recordedAt)}</td>
                        <td className="p-3.5 font-bold text-blue-600">{m.weight} kg</td>
                        <td className="p-3.5 text-gray-600">{m.height} cm</td>
                        <td className="p-3.5 text-rose-600 font-bold">{m.bodyFat ? `${m.bodyFat}%` : '-'}</td>
                        <td className="p-3.5 text-gray-800 font-mono">{m.bmi ? m.bmi.toFixed(1) : '-'}</td>
                        <td className="p-3.5 text-gray-500">{m.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Workouts */}
      {activeTab === 'workouts' && (
        <div className="space-y-4">
          {customer.workoutPlans?.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
              لم يتم تعيين جدول تمارين لهذا العميل بعد
            </div>
          ) : (
            customer.workoutPlans.map((wp: any) => (
              <div key={wp.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{wp.name}</h3>
                  <span className="text-[10px] text-gray-500">تم الإنشاء: {formatDate(wp.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-600">{wp.description}</p>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {wp.exercises?.map((ex: any) => (
                    <div key={ex.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
                      <span className="font-bold text-gray-800">{ex.exerciseName} ({ex.dayOfWeek})</span>
                      <span className="text-gray-500 font-mono">
                        {ex.sets} مجموعات × {ex.reps} تكرار {ex.targetWeight ? `— ${ex.targetWeight} kg` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Branch Transfers History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">الفرع القديم</th>
                  <th className="p-3.5">الفرع الجديد</th>
                  <th className="p-3.5">تاريخ النقل</th>
                  <th className="p-3.5">السبب</th>
                  <th className="p-3.5">الموظف المنفذ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customer.branchHistories?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
                      لا يوجد سجل انتقالات بين الفروع لهذا العميل
                    </td>
                  </tr>
                ) : (
                  customer.branchHistories.map((h: any) => (
                    <tr key={h.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 text-gray-600">{h.oldBranch?.name || 'الفرع السابق'}</td>
                      <td className="p-3.5 font-bold text-gray-900">{h.newBranch?.name}</td>
                      <td className="p-3.5 text-gray-500 font-mono">{formatDate(h.changedAt)}</td>
                      <td className="p-3.5 text-gray-600">{h.notes || '-'}</td>
                      <td className="p-3.5 text-gray-500">{h.changedBy?.name || 'مدير النظام'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for 360 Actions */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تجديد الاشتراك للعميل</h3>
            <form onSubmit={handleRenewMembership} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">اختر الباقة</label>
                <select
                  value={renewPlanId}
                  onChange={(e) => setRenewPlanId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} ج.م - {p.durationDays} يوم)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600 block mb-1">المبلغ المدفوع (ج.م)</label>
                <input
                  type="number"
                  value={renewPaidAmount}
                  onChange={(e) => setRenewPaidAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  {isRenewing ? 'جاري التجديد...' : 'تأكيد التجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFreezeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تجميد الاشتراك</h3>
            <form onSubmit={handleFreezeMembership} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">عدد أيام التجميد</label>
                <input
                  type="number"
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>
              <div>
                <label className="text-gray-600 block mb-1">السبب</label>
                <input
                  type="text"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="سفر / ظروف خاصة"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFreezeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isFreezing}
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold"
                >
                  {isFreezing ? 'جاري التجميد...' : 'تأكيد التجميد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMeasurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تسجيل قياس InBody جديد</h3>
            <form onSubmit={handleAddMeasurement} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">الوزن (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={measWeight}
                    onChange={(e) => setMeasWeight(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">الطول (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={measHeight}
                    onChange={(e) => setMeasHeight(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-600 block mb-1">نسبة الدهون (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={measBodyFat}
                  onChange={(e) => setMeasBodyFat(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMeasurementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isRecordingMeas}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  {isRecordingMeas ? 'جاري التسجيل...' : 'حفظ القياس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card & Receipt Modals */}
      {isCardModalOpen && (
        <MembershipCardModal
          customer={customer}
          isOpen={true}
          onClose={() => setIsCardModalOpen(false)}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          data={selectedReceipt}
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
