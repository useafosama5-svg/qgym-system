'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  RefreshCw,
  MessageSquare,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  X,
  Phone,
  Building2,
  Filter,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function ExpiringMembershipsPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [range, setRange] = useState('7');
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Renew modal
  const [selectedForRenew, setSelectedForRenew] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewPaidAmount, setRenewPaidAmount] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('CASH');
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchExpiring = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const url = `/api/memberships/expiring?range=${range}&branchId=${bId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/memberships/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, [range, selectedBranchId]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRenew) return;
    setIsRenewing(true);
    try {
      const res = await fetch(`/api/memberships/${selectedForRenew.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: renewPlanId || selectedForRenew.planId,
          paidAmount: parseFloat(renewPaidAmount || '0'),
          paymentMethod: renewPaymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedForRenew(null);
        fetchExpiring();
        alert('تم تجديد الاشتراك بنجاح!');
      } else {
        alert(data.error || 'فشل تجديد الاشتراك');
      }
    } catch (e) {
      alert('خطأ أثناء التجديد');
    } finally {
      setIsRenewing(false);
    }
  };

  const filtered = memberships.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.customerName.toLowerCase().includes(q) ||
      m.customerCode.toLowerCase().includes(q) ||
      m.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">الاشتراكات المنتهية والقريبة من الانتهاء</h1>
            <p className="text-xs text-gray-500">
              متابعة العضويات التي أوشكت على الانتهاء وإرسال تذكيرات عبر الواتساب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/memberships"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>كافة الاشتراكات</span>
          </Link>
        </div>
      </div>

      {/* Filter Range Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Range Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 ml-1">النطاق الزمني:</span>
          {[
            { label: 'اليوم فقط', value: '0' },
            { label: 'خلال 3 أيام', value: '3' },
            { label: 'خلال 7 أيام', value: '7' },
            { label: 'خلال 14 يوم', value: '14' },
            { label: 'خلال 30 يوم', value: '30' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === tab.value
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو الهاتف..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pl-10 text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 shadow-2xs"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">كود العميل</th>
                <th className="p-3.5">الاسم الكامل</th>
                <th className="p-3.5">رقم الهاتف</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">الباقة الحالية</th>
                <th className="p-3.5">تاريخ الانتهاء</th>
                <th className="p-3.5">المتبقي</th>
                <th className="p-3.5 text-center">الإجراءات السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    جاري استرجاع الاشتراكات...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    لا توجد أي اشتراكات تنتهي في النطاق الزمني المحدد ({range} أيام)
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const days = m.daysLeft;
                  const isCritical = days <= 3;
                  const isExpired = days < 0;
                  const whatsappClean = (m.whatsapp || m.phone).replace(/[^0-9]/g, '');

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{m.customerCode}</td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <Link href={`/customers/${m.customerId}`} className="hover:text-[#D4A72C] transition">
                          {m.customerName}
                        </Link>
                      </td>
                      <td className="p-3.5 font-mono text-gray-600" dir="ltr">
                        {m.phone}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700 font-medium">
                          {m.homeBranch}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-gray-800">{m.planName}</td>
                      <td className="p-3.5 font-mono text-gray-600">{formatDate(m.endDate)}</td>
                      <td className="p-3.5 font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isExpired
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : isCritical
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isExpired ? 'منتهي بالفعل' : days === 0 ? 'ينتهي اليوم!' : `متبقي ${days} يوم`}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Reminder */}
                          {whatsappClean && (
                            <a
                              href={`https://wa.me/2${whatsappClean}?text=${encodeURIComponent(
                                `مرحباً ${m.customerName}، نود تذكيرك بأن اشتراكك في باقة (${m.planName}) في QGYM سينتهي خلال ${days} يوم (${formatDate(
                                  m.endDate
                                )}). يسعدنا تجديد اشتراكك للاستمرار في تحقيق أهدافك الرياضية!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                              title="إرسال تذكير واتساب"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* 1-Click Renew */}
                          <button
                            onClick={() => {
                              setSelectedForRenew(m);
                              setRenewPlanId(m.planId);
                              setRenewPaidAmount(String(m.planPrice || 0));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs transition"
                          >
                            تجديد
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      {selectedForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">تجديد اشتراك: {selectedForRenew.customerName}</h3>
              <button onClick={() => setSelectedForRenew(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">اختر الباقة</label>
                <select
                  value={renewPlanId}
                  onChange={(e) => {
                    setRenewPlanId(e.target.value);
                    const p = plans.find((x) => x.id === e.target.value);
                    if (p) setRenewPaidAmount(String(p.price));
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
                <label className="text-gray-600 block mb-1">المبلغ المدفوع (ج.م)</label>
                <input
                  type="number"
                  value={renewPaidAmount}
                  onChange={(e) => setRenewPaidAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">طريقة الدفع</label>
                <select
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                >
                  <option value="CASH">نقدي (Cash)</option>
                  <option value="VISA">فيزا (Visa)</option>
                  <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                  <option value="VODAFONE_CASH">فودافون كاش</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedForRenew(null)}
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
