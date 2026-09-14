'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Receipt,
  PlusCircle,
  Building2,
  Calendar,
  X,
  Filter,
} from 'lucide-react';

export default function ExpensesPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form
  const [targetBranchId, setTargetBranchId] = useState('');
  const [expCategory, setExpCategory] = useState('SUPPLIES');
  const [expAmount, setExpAmount] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState('CASH');
  const [expDescription, setExpDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const res = await fetch(`/api/finance/expenses?branchId=${bId}&category=${categoryFilter}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedBranchId, categoryFilter]);

  useEffect(() => {
    if (branches.length > 0) {
      setTargetBranchId(user?.homeBranchId || branches[0].id);
    }
  }, [branches, user]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchId || !expAmount || !expDescription) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: targetBranchId,
          category: expCategory,
          amount: expAmount,
          paymentMethod: expPaymentMethod,
          description: expDescription,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setExpAmount('');
        setExpDescription('');
        fetchExpenses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoryLabels: Record<string, string> = {
    SUPPLIES: 'أدوات ومستلزمات',
    MAINTENANCE: 'صيانة وتصليحات',
    UTILITIES: 'فواتير ومرافق',
    SALARIES: 'رواتب ومكافآت',
    CLEANING: 'نظافة ومطهرات',
    MARKETING: 'دعاية وتسويق',
    OTHER: 'أخرى',
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">المصروفات التشغيلية</h1>
            <p className="text-xs text-gray-500">
              تسجيل وتبويب النفقات والمصروفات اليومية للفروع ومطابقتها مع الخزينة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-left">
            <span className="text-[10px] text-gray-500 block">إجمالي المصروفات</span>
            <span className="text-base font-black text-rose-600 font-mono">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 ml-1">التصنيف:</span>
        {['ALL', 'SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'SALARIES', 'CLEANING', 'MARKETING', 'OTHER'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              categoryFilter === cat
                ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat === 'ALL' ? 'الكل' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">البيان والوصف</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">التصنيف</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">طريقة الصرف</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    جاري تحميل المصروفات...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-bold text-gray-900">{exp.description}</td>
                    <td className="p-3.5 text-gray-700">{exp.branch?.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                        {categoryLabels[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-gray-500">{formatDate(exp.expenseDate)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-rose-600">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3.5 text-gray-500">{exp.recordedBy?.name || 'مدير النظام'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">تسجيل مصروف جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-gray-600 block mb-1">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="شراء أدوات نظافة / صيانة جهاز السير"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-medium"
                />
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
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="350"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">التصنيف</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-semibold"
                  >
                    <option value="SUPPLIES">أدوات ومستلزمات</option>
                    <option value="MAINTENANCE">صيانة وتصليحات</option>
                    <option value="UTILITIES">فواتير ومرافق</option>
                    <option value="SALARIES">رواتب ومكافآت</option>
                    <option value="CLEANING">نظافة ومطهرات</option>
                    <option value="MARKETING">دعاية وتسويق</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">طريقة الصرف</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  >
                    <option value="CASH">نقدي من الدرج (Cash)</option>
                    <option value="VISA">بطاقة بنكية (Visa)</option>
                    <option value="INSTAPAY">تحويل إنستاباي</option>
                    <option value="VODAFONE_CASH">فودافون كاش</option>
                  </select>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
