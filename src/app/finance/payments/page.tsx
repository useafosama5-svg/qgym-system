'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  X,
  CreditCard,
  Receipt,
  User,
} from 'lucide-react';

export default function PaymentsPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Payment Form
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const res = await fetch(`/api/finance/payments?branchId=${bId}&paymentMethod=${methodFilter}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedBranchId, methodFilter]);

  useEffect(() => {
    fetchCustomers();
    if (branches.length > 0) {
      setTargetBranchId(user?.homeBranchId || branches[0].id);
    }
  }, [branches, user]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount || !targetBranchId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          branchId: targetBranchId,
          amount: paymentAmount,
          paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setPaymentAmount('');
        setPaymentReference('');
        setPaymentNotes('');
        fetchPayments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">سندات القبض والمدفوعات</h1>
            <p className="text-xs text-gray-500">
              سجل التحصيلات المالية المباشرة وإصدار إيصالات الدفع الإلكترونية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-left">
            <span className="text-[10px] text-gray-500 block">إجمالي التحصيلات</span>
            <span className="text-base font-black text-emerald-600 font-mono">
              {formatCurrency(totalCollected)}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>سند قبض جديد (F4)</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 ml-1">طريقة الدفع:</span>
          {['ALL', 'CASH', 'VISA', 'INSTAPAY', 'VODAFONE_CASH'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                methodFilter === m
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {m === 'ALL'
                ? 'الكل'
                : m === 'CASH'
                ? 'كاش'
                : m === 'VISA'
                ? 'فيزا'
                : m === 'INSTAPAY'
                ? 'إنستاباي'
                : 'فودافون كاش'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">رقم السند</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">تاريخ السداد</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">المحصل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    جاري تحميل المدفوعات...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    لا توجد مدفوعات مسجلة
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-gray-900">{p.receiptNumber}</td>
                    <td className="p-3.5 font-bold text-gray-900">
                      {p.customer?.firstName} {p.customer?.lastName}
                      <span className="block text-[10px] text-gray-400 font-mono font-normal">
                        {p.customer?.customerCode}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-700">{p.branch?.name}</td>
                    <td className="p-3.5 font-mono text-gray-500">{formatDate(p.paymentDate)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3.5 text-gray-500">{p.cashier?.name || 'الكاشير'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">تحصيل دفعة نقدية جديدة</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">اختر العميل *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || `${c.firstName} ${c.lastName}`} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">الفرع *</label>
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
                  <label className="text-gray-600 block mb-1">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  >
                    <option value="CASH">كاش (Cash)</option>
                    <option value="VISA">فيزا (Visa)</option>
                    <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                    <option value="VODAFONE_CASH">فودافون كاش</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">رقم المرجع (اختياري)</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="رقم إيصال البنك"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">ملاحظات التحصيل</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="سداد قسط أو اشتراك"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold"
                >
                  {isSubmitting ? 'جاري التحصيل...' : 'حفظ وإصدار السند'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
