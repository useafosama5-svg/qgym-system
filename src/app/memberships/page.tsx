'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard,
  PlusCircle,
  PauseCircle,
  Building2,
  Calendar,
  X,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function MembershipsPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'memberships' | 'plans'>('memberships');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Add / Edit Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDuration, setPlanDuration] = useState('30');
  const [planPrice, setPlanPrice] = useState('1000');
  const [planAccessType, setPlanAccessType] = useState('HOME_BRANCH_ONLY');
  const [planFreezeAllowed, setPlanFreezeAllowed] = useState(true);
  const [planFreezeDays, setPlanFreezeDays] = useState('15');
  const [planStatus, setPlanStatus] = useState('ACTIVE');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Freeze Modal
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [selectedMem, setSelectedMem] = useState<any>(null);
  const [freezeDays, setFreezeDays] = useState('15');
  const [freezeReason, setFreezeReason] = useState('');
  const [isFreezing, setIsFreezing] = useState(false);

  // Renew Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedMemForRenew, setSelectedMemForRenew] = useState<any>(null);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewPaidAmount, setRenewPaidAmount] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('CASH');
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const [memRes, planRes] = await Promise.all([
        fetch(`/api/memberships?branchId=${bId}&status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch('/api/memberships/plans'),
      ]);

      if (memRes.ok) {
        const data = await memRes.json();
        setMemberships(data.memberships || []);
      }
      if (planRes.ok) {
        const data = await planRes.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId, statusFilter]);

  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDesc('');
    setPlanDuration('30');
    setPlanPrice('1000');
    setPlanAccessType('HOME_BRANCH_ONLY');
    setPlanFreezeAllowed(true);
    setPlanFreezeDays('15');
    setPlanStatus('ACTIVE');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setPlanDuration(String(plan.durationDays));
    setPlanPrice(String(plan.price));
    setPlanAccessType(plan.accessType);
    setPlanFreezeAllowed(plan.freezeAllowed);
    setPlanFreezeDays(String(plan.maxFreezeDays || 15));
    setPlanStatus(plan.status || 'ACTIVE');
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPlan(true);

    try {
      const payload = {
        id: editingPlanId,
        name: planName,
        description: planDesc,
        durationDays: parseInt(planDuration, 10),
        price: parseFloat(planPrice),
        accessType: planAccessType,
        freezeAllowed: planFreezeAllowed,
        maxFreezeDays: parseInt(planFreezeDays, 10),
        status: planStatus,
      };

      const res = await fetch('/api/memberships/plans', {
        method: editingPlanId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPlanModalOpen(false);
        fetchData();
      } else {
        alert('حدث خطأ أثناء حفظ الباقة');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleArchivePlan = async (id: string) => {
    if (!confirm('هل أنت متأكد من تعطيل/أرشفة هذه الباقة؟')) return;
    try {
      const res = await fetch(`/api/memberships/plans?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMem) return;
    setIsFreezing(true);
    try {
      const res = await fetch(`/api/memberships/${selectedMem.id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freezeDays: parseInt(freezeDays, 10),
          reason: freezeReason,
        }),
      });
      if (res.ok) {
        setIsFreezeModalOpen(false);
        fetchData();
        alert('تم تجميد الاشتراك بنجاح!');
      } else {
        alert('فشل تجميد الاشتراك');
      }
    } catch (e) {
      alert('خطأ أثناء التجميد');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemForRenew) return;
    setIsRenewing(true);
    try {
      const res = await fetch(`/api/memberships/${selectedMemForRenew.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: renewPlanId || selectedMemForRenew.planId,
          paidAmount: parseFloat(renewPaidAmount || '0'),
          paymentMethod: renewPaymentMethod,
        }),
      });
      if (res.ok) {
        setIsRenewModalOpen(false);
        fetchData();
        alert('تم تجديد الاشتراك بنجاح!');
      } else {
        alert('فشل تجديد الاشتراك');
      }
    } catch (e) {
      alert('خطأ أثناء التجديد');
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center border border-amber-200">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">إدارة الاشتراكات وباقات العضوية</h1>
            <p className="text-xs text-gray-500">
              كتالوج الباقات المركزي والتحكم في صلاحيات الفروع وتجميد وتجديد الاشتراكات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/memberships/expiring"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span>المنتهية قريباً</span>
          </Link>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={handleOpenCreatePlan}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة باقة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'memberships'
              ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>سجل الاشتراكات ({memberships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'plans'
              ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>كتالوج باقات العضوية ({plans.length})</span>
        </button>
      </div>

      {/* Tab 1: Memberships List */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {['ALL', 'ACTIVE', 'FROZEN', 'EXPIRED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'النشطة' : st === 'FROZEN' ? 'المجمدة' : 'المنتهية'}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchData();
              }}
              className="w-full md:w-80 relative"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم العضوية أو اسم العميل..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pl-9 text-xs text-gray-900 focus:outline-none focus:border-amber-400 shadow-2xs"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Memberships Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">رقم العضوية</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">الباقة</th>
                    <th className="p-3.5">نطاق الفروع</th>
                    <th className="p-3.5">فترة الاشتراك</th>
                    <th className="p-3.5">السعر والمتبقي</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        جاري تحميل الاشتراكات...
                      </td>
                    </tr>
                  ) : memberships.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                        لا توجد اشتراكات مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    memberships.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-gray-900">{m.membershipNumber}</td>
                        <td className="p-3.5 font-bold text-gray-900">
                          <Link href={`/customers/${m.customer.id}`} className="hover:text-[#D4A72C]">
                            {m.customer.firstName} {m.customer.lastName}
                          </Link>
                          <span className="block text-[10px] text-gray-400 font-mono">
                            {m.customer.customerCode}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-800 font-medium">{m.plan.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[10px]">
                            {m.plan.accessType}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-600">
                          <div>{formatDate(m.startDate)}</div>
                          <div className="text-gray-400 text-[10px]">إلى {formatDate(m.endDate)}</div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div className="text-gray-900 font-bold">{formatCurrency(m.price - m.discount)}</div>
                          {m.remainingAmount > 0 && (
                            <div className="text-rose-600 text-[10px]">متبقي: {formatCurrency(m.remainingAmount)}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Renew Button */}
                            <button
                              onClick={() => {
                                setSelectedMemForRenew(m);
                                setRenewPlanId(m.planId);
                                setRenewPaidAmount(String(m.plan?.price || 0));
                                setIsRenewModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center gap-1"
                              title="تجديد الاشتراك"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>تجديد</span>
                            </button>

                            {/* Freeze Button */}
                            {m.status === 'ACTIVE' && m.plan.freezeAllowed && (
                              <button
                                onClick={() => {
                                  setSelectedMem(m);
                                  setIsFreezeModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition flex items-center gap-1"
                              >
                                <PauseCircle className="w-3 h-3" />
                                <span>تجميد</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Plans Catalog */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isArchived = p.status === 'ARCHIVED' || p.status === 'INACTIVE';

            return (
              <div
                key={p.id}
                className={`bg-white p-5 rounded-2xl border ${
                  isArchived ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-amber-400'
                } transition shadow-2xs flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                      <span className="text-[10px] text-gray-400">{p.status === 'ACTIVE' ? 'نشطة' : 'مؤرشفة'}</span>
                    </div>
                    <span className="text-lg font-black text-[#D4A72C] font-mono">
                      {formatCurrency(p.price)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">{p.description || 'باقة تدريبية متكاملة'}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px]">المدة</span>
                      <span className="font-bold text-gray-800">{p.durationDays} يوم</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">نطاق الفروع</span>
                      <span className="font-bold text-gray-800">{p.accessType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">تجميد متاح</span>
                      <span className="font-bold text-gray-800">
                        {p.freezeAllowed ? `نعم (${p.maxFreezeDays} يوم)` : 'لا'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">المشتركون</span>
                      <span className="font-bold text-gray-800">{p._count?.memberships || 0} عضو</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'SUPER_ADMIN' && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    {!isArchived && (
                      <button
                        onClick={() => handleArchivePlan(p.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition"
                        title="أرشفة الباقة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">
                {editingPlanId ? 'تعديل بيانات الباقة' : 'إضافة باقة عضوية جديدة'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5">
              <div>
                <label className="text-gray-600 block mb-1">اسم الباقة *</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="اشتراك 3 شهور VIP"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">الوصف</label>
                <input
                  type="text"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="شامل الجيم والساونا وكافة الفروع"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">المدة بالأيام *</label>
                  <input
                    type="number"
                    required
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">صلاحية الفروع (Access Type)</label>
                <select
                  value={planAccessType}
                  onChange={(e) => setPlanAccessType(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold"
                >
                  <option value="HOME_BRANCH_ONLY">الفرع الأساسي فقط (Home Branch Only)</option>
                  <option value="ALL_BRANCHES">شامل جميع الفروع (All Branches Unlimited)</option>
                  <option value="SELECTED_BRANCHES">فروع محددة (Selected Branches)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">تجميد متاح</label>
                  <select
                    value={planFreezeAllowed ? 'true' : 'false'}
                    onChange={(e) => setPlanFreezeAllowed(e.target.value === 'true')}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  >
                    <option value="true">مسموح بالتجميد</option>
                    <option value="false">غير مسموح</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">أقصى أيام تجميد</label>
                  <input
                    type="number"
                    value={planFreezeDays}
                    onChange={(e) => setPlanFreezeDays(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] text-white font-bold"
                >
                  {isSubmittingPlan ? 'جاري الحفظ...' : 'حفظ الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {isFreezeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تجميد اشتراك</h3>
            <form onSubmit={handleFreezeSubmit} className="space-y-4">
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

      {/* Renew Modal */}
      {selectedMemForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-4">تجديد اشتراك العميل</h3>
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">اختر الباقة</label>
                <select
                  value={renewPlanId}
                  onChange={(e) => setRenewPlanId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} ج.م)
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
    </div>
  );
}
