'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Clock,
  MessageSquare,
  Phone,
  Search,
  AlertTriangle,
  Building2,
  ChevronLeft,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function InactiveMembersPage() {
  const { user, selectedBranchId } = useApp();
  const [days, setDays] = useState('14');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInactive = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const url = `/api/customers/inactive?days=${days}&branchId=${bId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInactive();
  }, [days, selectedBranchId]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.customerCode.toLowerCase().includes(s) ||
      c.phone.includes(s)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">الأعضاء المنقطعون عن الحضور</h1>
            <p className="text-xs text-gray-500">
              حصر المشتركين الذين لم يسجلوا أي زيارة خلال الفترة المحددة للتواصل وتنشيط العضوية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/customers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>دليل العملاء</span>
          </Link>
        </div>
      </div>

      {/* Threshold Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Days Threshold */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 ml-1">مدة الانقطاع:</span>
          {[
            { label: 'أكثر من 7 أيام', value: '7' },
            { label: 'أكثر من 14 يوماً (الافتراضي)', value: '14' },
            { label: 'أكثر من 30 يوماً', value: '30' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setDays(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                days === t.value
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.label}
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
                <th className="p-3.5">الفرع الأساسي</th>
                <th className="p-3.5">الباقة الحالية</th>
                <th className="p-3.5">آخر حضور</th>
                <th className="p-3.5">مدة الغياب</th>
                <th className="p-3.5 text-center">إعادة التنشيط والمراسلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    جاري حصر المشتركين المنقطعين...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    رائع! لا يوجد أعضاء منقطعون عن التدريب في هذا النطاق
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const whatsappClean = (c.whatsapp || c.phone).replace(/[^0-9]/g, '');

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{c.customerCode}</td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <Link href={`/customers/${c.id}`} className="hover:text-[#D4A72C] transition">
                          {c.name}
                        </Link>
                      </td>
                      <td className="p-3.5 font-mono text-gray-600" dir="ltr">
                        {c.phone}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] text-gray-700 font-medium">
                          {c.homeBranch}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-gray-800">{c.planName}</td>
                      <td className="p-3.5 text-gray-500 font-mono">
                        {c.lastAttendanceDate ? formatDate(c.lastAttendanceDate) : 'لم يسجل حضور'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          غائب منذ {c.daysInactive} يوم
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {whatsappClean && (
                            <a
                              href={`https://wa.me/2${whatsappClean}?text=${encodeURIComponent(
                                `مرحباً ${c.name}، لاحظنا غيابك عن تمارين QGYM منذ ${c.daysInactive} يوماً. نفتقد وجودك في الجيم ونتمنى لك السلامة دائماً، ونحن بانتظارك لمتابعة رحلتك الرياضية!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مراسلة واتساب تشجيعية</span>
                            </a>
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
      </div>
    </div>
  );
}
