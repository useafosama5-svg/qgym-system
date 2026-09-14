'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatDate, formatTime } from '@/lib/utils';
import {
  History,
  Shield,
  Search,
  Filter,
  Eye,
  X,
  User,
  Building2,
  Calendar,
} from 'lucide-react';

export default function ActivityLogsPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const res = await fetch(`/api/activity-logs?branchId=${bId}&action=${actionFilter}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedBranchId, actionFilter]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">سجل العمليات والتدقيق (Security & Audit Trail)</h1>
            <p className="text-xs text-gray-500">
              تسجيل ومراقبة كافة الحركات الحساسة بالكامل على مستوى النظام والفروع
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-1.5">
        {['ALL', 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'PAYMENT', 'FREEZE', 'BRANCH_TRANSFER', 'CASH_CLOSING'].map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              actionFilter === act
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {act === 'ALL' ? 'كافة العمليات' : act}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">نوع الإجراء</th>
                <th className="p-3.5">الكيان (Entity)</th>
                <th className="p-3.5">المستخدم الفاعل</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">التفاصيل</th>
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5 text-center">المعاينة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">جاري تحميل سجل الأنشطة...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">لا توجد سجلات مطابقة</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{l.entityType}</td>
                    <td className="p-3.5 text-gray-800 font-medium">{l.user?.name || 'النظام'}</td>
                    <td className="p-3.5 text-gray-600">{l.branch?.name || '-'}</td>
                    <td className="p-3.5 text-gray-500 font-mono text-[11px] max-w-xs truncate">
                      {l.detailsJson || '-'}
                    </td>
                    <td className="p-3.5 font-mono text-gray-500">
                      {formatDate(l.createdAt)} {formatTime(l.createdAt)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">تفاصيل العملية #{selectedLog.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>الإجراء:</span>
                <span className="font-bold text-emerald-700 font-mono">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>الكيان:</span>
                <span className="text-gray-900 font-bold">{selectedLog.entityType}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>المستخدم:</span>
                <span className="text-gray-900 font-bold">{selectedLog.user?.name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>التاريخ والوقت:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedLog.createdAt)} {formatTime(selectedLog.createdAt)}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-700 font-bold block mb-1">تفاصيل JSON (Payload Data):</span>
              <pre className="p-3.5 rounded-xl bg-gray-900 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-gray-800">
                {selectedLog.detailsJson
                  ? JSON.stringify(JSON.parse(selectedLog.detailsJson), null, 2)
                  : 'No extra payload'}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
