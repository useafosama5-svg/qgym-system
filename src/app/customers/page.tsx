'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/components/Providers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  UserPlus,
  Building2,
  Phone,
  CreditCard,
  ChevronLeft,
  X,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  ScanLine,
  RefreshCw,
  Snowflake,
  ArrowLeftRight,
  QrCode,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';
import { MembershipCardModal } from '@/components/MembershipCardModal';
import { ReceiptModal } from '@/components/ReceiptModal';

export default function CustomersPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [specialFilter, setSpecialFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  // Action Modals State
  const [selectedCustomerForCard, setSelectedCustomerForCard] = useState<any>(null);
  const [selectedCustomerForRenew, setSelectedCustomerForRenew] = useState<any>(null);
  const [selectedCustomerForFreeze, setSelectedCustomerForFreeze] = useState<any>(null);
  const [selectedCustomerForTransfer, setSelectedCustomerForTransfer] = useState<any>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<any>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  // Modal form states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Customer Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    whatsapp: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '',
    emergencyContact: '',
    homeBranchId: '',
    planId: '',
    paidAmount: '',
    discount: '0',
    paymentMethod: 'CASH',
    allowedBranchIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const bId =
        user?.role === 'SUPER_ADMIN'
          ? branchFilter !== 'ALL'
            ? branchFilter
            : selectedBranchId
          : user?.homeBranchId || 'ALL';

      const params = new URLSearchParams({
        branchId: bId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        status: statusFilter,
        special: specialFilter,
      });

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [branchFilter, selectedBranchId, user, currentPage, debouncedSearch, statusFilter, specialFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/memberships/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
          if (data.plans?.length > 0 && !formData.planId) {
            setFormData((prev) => ({ ...prev, planId: data.plans[0].id }));
          }
        }
      } catch (e) {
        // silent
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (branches.length > 0 && !formData.homeBranchId) {
      setFormData((prev) => ({ ...prev, homeBranchId: branches[0].id }));
    }
  }, [branches]);

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Quick Check-in from Table
  const handleQuickCheckin = async (cust: any) => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      const targetBranchId = user?.role === 'SUPER_ADMIN' ? cust.homeBranchId : user?.homeBranchId;
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cust.customerCode,
          branchId: targetBranchId,
          method: 'CUSTOMER_CODE',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'ALLOWED') {
        setActionMessage({ type: 'success', text: `تم تسجيل دخول ${cust.fullName} بنجاح ✅` });
      } else {
        setActionMessage({
          type: 'error',
          text: `تم رفض الدخول: ${data.denialReason || data.error || 'غير مصرح'} ❌`,
        });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'فشل الاتصال بنظام الحضور' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Renew
  const handleQuickRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForRenew) return;
    const form = e.target as HTMLFormElement;
    const planId = (form.elements.namedItem('planId') as HTMLSelectElement)?.value;
    const paidAmount = parseFloat((form.elements.namedItem('paidAmount') as HTMLInputElement)?.value || '0');
    const paymentMethod = (form.elements.namedItem('paymentMethod') as HTMLSelectElement)?.value || 'CASH';

    try {
      setActionLoading(true);
      const activeMem = selectedCustomerForRenew.latestMembership;
      const memId = activeMem?.id || selectedCustomerForRenew.memberships?.[0]?.id;

      const res = await fetch(`/api/memberships/${memId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, paidAmount, paymentMethod }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCustomerForRenew(null);
        fetchCustomers();
        alert('تم تجديد اشتراك العميل بنجاح!');
      } else {
        alert(data.error || 'فشل تجديد الاشتراك');
      }
    } catch (e) {
      alert('خطأ أثناء التجديد');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Freeze
  const handleQuickFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForFreeze) return;
    const form = e.target as HTMLFormElement;
    const freezeDays = parseInt((form.elements.namedItem('freezeDays') as HTMLInputElement)?.value || '7', 10);
    const reason = (form.elements.namedItem('reason') as HTMLInputElement)?.value;

    try {
      setActionLoading(true);
      const activeMem = selectedCustomerForFreeze.latestMembership || selectedCustomerForFreeze.memberships?.[0];
      const res = await fetch(`/api/memberships/${activeMem?.id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freezeDays, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCustomerForFreeze(null);
        fetchCustomers();
        alert(`تم تجميد الاشتراك بنجاح لمدة ${freezeDays} يوم وتمديد نهاية الاشتراك!`);
      } else {
        alert(data.error || 'فشل تجميد الاشتراك');
      }
    } catch (e) {
      alert('خطأ أثناء التجميد');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Transfer Branch
  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForTransfer) return;
    const form = e.target as HTMLFormElement;
    const newBranchId = (form.elements.namedItem('newBranchId') as HTMLSelectElement)?.value;
    const notes = (form.elements.namedItem('notes') as HTMLInputElement)?.value;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/customers/${selectedCustomerForTransfer.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBranchId, notes }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCustomerForTransfer(null);
        fetchCustomers();
        alert('تم نقل الفرع الأساسي للعميل بنجاح مع أرشفة السجل التاريخي!');
      } else {
        alert(data.error || 'فشل نقل الفرع');
      }
    } catch (e) {
      alert('خطأ أثناء نقل الفرع');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Payment
  const handleQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment) return;
    const form = e.target as HTMLFormElement;
    const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement)?.value || '0');
    const paymentMethod = (form.elements.namedItem('paymentMethod') as HTMLSelectElement)?.value || 'CASH';
    const notes = (form.elements.namedItem('notes') as HTMLInputElement)?.value;

    try {
      setActionLoading(true);
      const activeMem = selectedCustomerForPayment.latestMembership || selectedCustomerForPayment.memberships?.[0];
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerForPayment.id,
          membershipId: activeMem?.id || null,
          branchId: selectedCustomerForPayment.homeBranchId,
          amount,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCustomerForPayment(null);
        fetchCustomers();
        setGeneratedReceipt({
          receiptNumber: data.payment.receiptNumber,
          customerName: selectedCustomerForPayment.fullName,
          customerCode: selectedCustomerForPayment.customerCode,
          branchName: selectedCustomerForPayment.homeBranch?.name,
          planName: activeMem?.planName || 'سداد دفعة نقدية',
          amount: data.payment.amount,
          paymentMethod: data.payment.paymentMethod,
          cashierName: user?.name,
          paymentDate: new Date().toISOString(),
        });
      } else {
        alert(data.error || 'فشل تحصيل المبلغ');
      }
    } catch (e) {
      alert('خطأ أثناء تسجيل الدفعة');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل إضافة العميل');
        return;
      }

      setIsAddModalOpen(false);
      fetchCustomers();
      if (data.payment) {
        setGeneratedReceipt({
          receiptNumber: data.payment.receiptNumber,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerCode: data.customer.customerCode,
          branchName: branches.find((b) => b.id === formData.homeBranchId)?.name,
          planName: plans.find((p) => p.id === formData.planId)?.name || 'عضوية جديدة',
          amount: parseFloat(formData.paidAmount || '0'),
          paymentMethod: formData.paymentMethod,
          cashierName: user?.name,
          paymentDate: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setFormError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-sm animate-slideDown ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span className="font-bold">{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">دليل إدارة العملاء</h1>
            <p className="text-xs text-gray-500">
              قاعدة بيانات مركزية موحدة لجميع الأعضاء عبر كافة الفروع
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role !== 'TRAINER' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة عميل جديد (F3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، كود العميل (GYM-000101)، الهاتف، الباركود..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pl-10 text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 shadow-2xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'ACTIVE', 'FROZEN', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st === 'ALL' ? 'كافة المشتركين' : st === 'ACTIVE' ? 'النشطين' : st === 'FROZEN' ? 'المجمدين' : 'غير النشطين'}
              </button>
            ))}

            <button
              onClick={() => {
                setSpecialFilter(specialFilter === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                specialFilter === 'EXPIRING_SOON'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ينتهي قريباً
            </button>
          </div>
        </div>

        {/* Secondary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-3">
            {user?.role === 'SUPER_ADMIN' && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">الفرع:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 text-gray-800 rounded-lg px-2.5 py-1 text-xs"
                >
                  <option value="ALL">جميع الفروع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-gray-500">
            إجمالي الأعضاء المسجلين:{' '}
            <span className="font-bold text-gray-900">{totalCount}</span> عميل
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">كود العميل</th>
                <th className="p-3.5">الاسم الكامل</th>
                <th className="p-3.5">رقم الهاتف</th>
                <th className="p-3.5">الفرع الأساسي</th>
                <th className="p-3.5">حالة الاشتراك</th>
                <th className="p-3.5">الباقة الحالية</th>
                <th className="p-3.5">المتبقي / الأيام</th>
                <th className="p-3.5 text-center">الإجراءات السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3.5"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                    <td className="p-3.5 text-center"><div className="h-6 w-28 bg-gray-100 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    لم يتم العثور على أي عملاء مطابقين
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const mem = c.latestMembership;
                  const isExpiring = mem && mem.daysLeft <= 7 && mem.daysLeft >= 0;
                  const hasRemaining = (mem?.remainingAmount || 0) > 0;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition group">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{c.customerCode}</td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <Link
                          href={`/customers/${c.id}`}
                          className="hover:text-[#D4A72C] transition flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-[#D4A72C] flex items-center justify-center font-bold text-xs">
                            {c.firstName.charAt(0)}
                          </div>
                          <div>
                            <div>{c.fullName}</div>
                            {hasRemaining && (
                              <div className="text-[10px] text-rose-600 font-medium">
                                متبقي: {mem.remainingAmount.toLocaleString()} ج.م
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="p-3.5 font-mono text-gray-600" dir="ltr">
                        {c.phone}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700 font-medium">
                          {c.homeBranch?.name}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="p-3.5 text-gray-700 font-medium">
                        {mem ? mem.planName : <span className="text-gray-400">لا يوجد اشتراك</span>}
                      </td>
                      <td className="p-3.5 font-bold">
                        {mem && c.status === 'ACTIVE' ? (
                          <span
                            className={
                              isExpiring
                                ? 'text-rose-600 font-black flex items-center gap-1'
                                : 'text-emerald-600'
                            }
                          >
                            {mem.daysLeft} يوم
                            {isExpiring && <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Quick Actions Buttons */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Profile 360 View */}
                          <Link
                            href={`/customers/${c.id}`}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 transition"
                            title="الملف الشامل (Profile 360°)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick Checkin */}
                          <button
                            onClick={() => handleQuickCheckin(c)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#D4A72C] border border-amber-200 transition"
                            title="تسجيل حضور فوري"
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Digital Card */}
                          <button
                            onClick={() =>
                              setSelectedCustomerForCard({
                                ...c,
                                memberships: mem
                                  ? [
                                      {
                                        plan: { name: mem.planName, accessType: 'HOME_BRANCH_ONLY' },
                                        startDate: new Date(),
                                        endDate: new Date(Date.now() + mem.daysLeft * 86400000),
                                        status: c.status,
                                      },
                                    ]
                                  : [],
                              })
                            }
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition"
                            title="بطاقة العضوية الرقمية"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Renew */}
                          <button
                            onClick={() => setSelectedCustomerForRenew(c)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition"
                            title="تجديد الاشتراك"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Payment */}
                          <button
                            onClick={() => setSelectedCustomerForPayment(c)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200 transition"
                            title="سند قبض جديد"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Freeze */}
                          <button
                            onClick={() => setSelectedCustomerForFreeze(c)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 transition"
                            title="تجميد الاشتراك"
                          >
                            <Snowflake className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Transfer */}
                          {user?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setSelectedCustomerForTransfer(c)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 transition"
                              title="نقل الفرع الأساسي"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              الصفحة <span className="font-bold text-gray-900">{currentPage}</span> من{' '}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg font-bold transition ${
                    currentPage === p ? 'bg-[#D4A72C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Action Modals in Light Mode --- */}

      {/* 1. Quick Renew Modal */}
      {selectedCustomerForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900">تجديد اشتراك: {selectedCustomerForRenew.fullName}</h3>
              </div>
              <button onClick={() => setSelectedCustomerForRenew(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRenew} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">اختر الباقة الجديدة</label>
                <select name="planId" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold">
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} ج.م - {p.durationDays} يوم)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">المبلغ المدفوع حالياً (ج.م)</label>
                <input
                  type="number"
                  name="paidAmount"
                  defaultValue="0"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">طريقة الدفع</label>
                <select name="paymentMethod" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900">
                  <option value="CASH">نقدي (Cash)</option>
                  <option value="VISA">فيزا (Visa)</option>
                  <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                  <option value="VODAFONE_CASH">فودافون كاش</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForRenew(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  {actionLoading ? 'جاري التجديد...' : 'تأكيد التجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Quick Freeze Modal */}
      {selectedCustomerForFreeze && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-sm text-gray-900">تجميد الاشتراك: {selectedCustomerForFreeze.fullName}</h3>
              </div>
              <button onClick={() => setSelectedCustomerForFreeze(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickFreeze} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">عدد أيام التجميد (Days)</label>
                <input
                  type="number"
                  name="freezeDays"
                  defaultValue="7"
                  min="1"
                  max="60"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">سبب التجميد (اختياري)</label>
                <input
                  type="text"
                  name="reason"
                  placeholder="سفر / ظروف عمل / إصابة"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForFreeze(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition"
                >
                  {actionLoading ? 'جاري التجميد...' : 'تأكيد التجميد وتمديد الاشتراك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Quick Transfer Modal */}
      {selectedCustomerForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-gray-900">نقل الفرع الأساسي: {selectedCustomerForTransfer.fullName}</h3>
              </div>
              <button onClick={() => setSelectedCustomerForTransfer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickTransfer} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">الفرع الحالي</label>
                <input
                  type="text"
                  disabled
                  value={selectedCustomerForTransfer.homeBranch.name}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-gray-500"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">الفرع الجديد المستهدف *</label>
                <select name="newBranchId" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold">
                  {branches
                    .filter((b) => b.id !== selectedCustomerForTransfer.homeBranchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">ملاحظات التحويل</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="طلب العميل لتغيير محل السكن"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForTransfer(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                >
                  {actionLoading ? 'جاري النقل...' : 'تأكيد نقل الفرع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Quick Payment Modal */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D4A72C]" />
                <h3 className="font-bold text-sm text-gray-900">سند قبض جديد: {selectedCustomerForPayment.fullName}</h3>
              </div>
              <button onClick={() => setSelectedCustomerForPayment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPayment} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">المبلغ المطلوب تحصيله (ج.م) *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  defaultValue={selectedCustomerForPayment.latestMembership?.remainingAmount || '500'}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">طريقة السداد</label>
                <select name="paymentMethod" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900">
                  <option value="CASH">نقدي (Cash)</option>
                  <option value="VISA">فيزا (Visa)</option>
                  <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                  <option value="VODAFONE_CASH">فودافون كاش</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">البيان / ملاحظات السند</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="سداد متبقي اشتراك أو خدمات إضافية"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold transition"
                >
                  {actionLoading ? 'جاري التحصيل...' : 'تحصيل وإصدار سند قبض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-[#D4A72C]" />
                <h2 className="text-base font-bold text-gray-900">تسجيل عميل جديد واشتراك أولي</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-200/60 text-gray-500 hover:text-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* Personal Data Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 pb-1 border-b border-gray-100">1. البيانات الشخصية</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">الاسم الأول *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="أحمد"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">اسم العائلة / الأخير *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="محمد"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">رقم الموبايل *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">رقم الواتساب</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="010XXXXXXXX"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">الفرع الأساسي *</label>
                    <select
                      value={formData.homeBranchId}
                      onChange={(e) => setFormData({ ...formData, homeBranchId: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">النوع</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    >
                      <option value="MALE">ذكر (Male)</option>
                      <option value="FEMALE">أنثى (Female)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">جهة اتصال للطوارئ</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="رقم هاتف مقرب"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Membership Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-900 pb-1 border-b border-gray-100">2. باقة الاشتراك الأولية</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">باقة الاشتراك</label>
                    <select
                      value={formData.planId}
                      onChange={(e) => {
                        const p = plans.find((x) => x.id === e.target.value);
                        setFormData({
                          ...formData,
                          planId: e.target.value,
                          paidAmount: p ? p.price.toString() : formData.paidAmount,
                        });
                      }}
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
                    <label className="text-gray-600 block mb-1">المبلغ المدفوع (ج.م) *</label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                      placeholder="1000"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1">طريقة الدفع</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    >
                      <option value="CASH">نقدي (Cash)</option>
                      <option value="VISA">فيزا (Visa)</option>
                      <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                      <option value="VODAFONE_CASH">فودافون كاش</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 block mb-1">خصم ترويجي (ج.م)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="0"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold transition shadow-xs"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتسجيل العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / Viewable Modals */}
      {selectedCustomerForCard && (
        <MembershipCardModal
          customer={selectedCustomerForCard}
          isOpen={true}
          onClose={() => setSelectedCustomerForCard(null)}
        />
      )}

      {generatedReceipt && (
        <ReceiptModal
          data={generatedReceipt}
          isOpen={true}
          onClose={() => setGeneratedReceipt(null)}
        />
      )}
    </div>
  );
}
