'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  PieChart as PieIcon,
  Users,
  Trophy,
  Award,
  Sparkles,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function ReportsPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [data, setData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any[]>([]);
  const [period, setPeriod] = useState('30');
  const [financialPeriod, setFinancialPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const [repRes, finRes, empRes] = await Promise.all([
        fetch(`/api/reports?branchId=${bId}&period=${period}`),
        fetch(`/api/reports/financial?branchId=${bId}&period=${financialPeriod}`),
        fetch(`/api/reports/employees?branchId=${bId}`),
      ]);

      if (repRes.ok) {
        const json = await repRes.json();
        setData(json);
      }
      if (finRes.ok) {
        const json = await finRes.json();
        setFinancialData(json);
      }
      if (empRes.ok) {
        const json = await empRes.json();
        setEmployeeStats(json.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedBranchId, period, financialPeriod]);

  const exportCSV = () => {
    if (!data?.branchComparison) return;
    const headers = ['الفرع', 'الكود', 'الأعضاء', 'النشطين', 'الزيارات', 'الإيرادات', 'المصروفات', 'صافي الأرباح'];
    const rows = data.branchComparison.map((b: any) => [
      b.name,
      b.code,
      b.membersCount,
      b.activeMembersCount,
      b.checkinsCount,
      b.revenue,
      b.expenses,
      b.netProfit,
    ]);

    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach((r: any[]) => {
      csvContent += r.map((field) => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QGym_MultiBranch_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 pb-16 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-gray-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-32 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-32 bg-white rounded-2xl border border-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-gray-200"></div>
          <div className="h-80 bg-white rounded-2xl border border-gray-200"></div>
        </div>
      </div>
    );
  }

  const { branchComparison, peakHoursData } = data;
  const rankedBranches = [...(branchComparison || [])].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center border border-amber-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">التقارير المالية ولوحة أداء الفروع والموظفين</h1>
            <p className="text-xs text-gray-500">
              تحليل مقارن للمبيعات، ترتيب الفروع، مؤشرات كفاءة الموظفين، وتقارير النمو المالي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 font-semibold"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 3 أشهر</option>
            <option value="365">السنة الحالية</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Super Admin: Branch Leaderboard Ranking */}
      {user?.role === 'SUPER_ADMIN' && rankedBranches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D4A72C]" />
            <h2 className="text-sm font-bold text-gray-900">ترتيب الفروع الأكثر أداءً وتحصيلاً (Branch Leaderboard)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankedBranches.map((branch: any, idx: number) => {
              let medalBg = 'bg-amber-50 border-amber-300 text-amber-900';
              let rankTitle = '🥇 المركز الأول';
              if (idx === 1) {
                medalBg = 'bg-slate-50 border-slate-300 text-slate-900';
                rankTitle = '🥈 المركز الثاني';
              } else if (idx === 2) {
                medalBg = 'bg-orange-50 border-orange-300 text-orange-900';
                rankTitle = '🥉 المركز الثالث';
              }

              return (
                <div
                  key={branch.id}
                  className={`p-5 rounded-2xl border ${medalBg} shadow-2xs space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-white border border-gray-200 shadow-2xs">
                      {rankTitle}
                    </span>
                    <span className="font-mono text-xs text-gray-500 font-semibold">{branch.code}</span>
                  </div>

                  <h3 className="text-base font-black text-gray-900">{branch.name}</h3>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">إجمالي الإيرادات:</span>
                      <span className="font-bold text-gray-900 font-mono">{formatCurrency(branch.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">الأعضاء النشطون:</span>
                      <span className="font-bold text-emerald-700">{branch.activeMembersCount} مشترك</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">مرات الحضور:</span>
                      <span className="font-bold text-teal-700">{branch.checkinsCount} زيارة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Growth Summary vs Previous Period */}
      {financialData && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">تحليل النمو المالي ومقارنة الفترات (Period Growth)</h2>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              {['today', 'week', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFinancialPeriod(p)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    financialPeriod === p
                      ? 'bg-white text-gray-900 shadow-2xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p === 'today' ? 'اليوم' : p === 'week' ? 'هذا الأسبوع' : p === 'month' ? 'هذا الشهر' : 'هذا العام'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">إيرادات الفترة الحالية</span>
              <div className="text-xl font-black text-gray-900 font-mono">
                {formatCurrency(financialData.summary.currentRevenue)}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                {financialData.summary.revenueGrowth >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{financialData.summary.revenueGrowth}% نمو
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {financialData.summary.revenueGrowth}%
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">إيرادات الفترة السابقة</span>
              <div className="text-xl font-black text-gray-600 font-mono">
                {formatCurrency(financialData.summary.previousRevenue)}
              </div>
              <span className="text-[10px] text-gray-400 mt-2 block">للمقارنة الزمنية</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">مصروفات الفترة الحالية</span>
              <div className="text-xl font-black text-rose-600 font-mono">
                {formatCurrency(financialData.summary.currentExpenses)}
              </div>
              <span className="text-[10px] text-gray-400 mt-2 block">تكاليف تشغيلية</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold block mb-1">صافي الأرباح (Net Profit)</span>
              <div className="text-2xl font-black text-emerald-950 font-mono">
                {formatCurrency(financialData.summary.currentNetProfit)}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">الفائض التشغيلي</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Branch Financial Comparison Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#D4A72C]" />
            مقارنة الإيرادات والمصروفات بين الفروع (EGP)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="الإيرادات" fill="#D4A72C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Checkin Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            ساعات الذروة لتسجيلات الدخول (Peak Hours)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 10 }} />
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
                <Bar dataKey="count" name="عدد الزيارات" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee KPIs Performance Table */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4A72C]" />
            <h3 className="text-sm font-bold text-gray-900">مؤشرات كفاءة وإنتاجية الموظفين (Staff KPIs)</h3>
          </div>
          <span className="text-[10px] text-gray-400">إجمالي المبيعات وحركات الحضور المسجلة</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">الدور الوظيفي</th>
                <th className="p-3.5">الاشتراكات المباعة</th>
                <th className="p-3.5">المبالغ المحصلة</th>
                <th className="p-3.5">عمليات الحضور المسجلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {employeeStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    لا توجد إحصائيات للموظفين حالياً
                  </td>
                </tr>
              ) : (
                employeeStats.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-bold text-gray-900">{emp.name}</td>
                    <td className="p-3.5 text-gray-700">{emp.branchName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-medium">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-blue-600 font-mono">{emp.membershipsSold} اشتراك</td>
                    <td className="p-3.5 font-bold text-emerald-600 font-mono">{formatCurrency(emp.revenueCollected)}</td>
                    <td className="p-3.5 font-bold text-purple-600 font-mono">{emp.checkinsProcessed} حركة</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Branch Detailed Comparison Matrix */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">مصفوفة مقارنة الفروع التفصيلية</h3>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">الكود</th>
                <th className="p-3.5">إجمالي الأعضاء</th>
                <th className="p-3.5">الأعضاء النشطون</th>
                <th className="p-3.5">حركات الحضور</th>
                <th className="p-3.5">الإيرادات</th>
                <th className="p-3.5">المصروفات</th>
                <th className="p-3.5">صافي الأرباح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {branchComparison.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition font-medium">
                  <td className="p-3.5 font-bold text-gray-900">{b.name}</td>
                  <td className="p-3.5 font-mono text-gray-500">{b.code}</td>
                  <td className="p-3.5 font-mono">{b.membersCount}</td>
                  <td className="p-3.5 font-mono text-emerald-700 font-bold">{b.activeMembersCount}</td>
                  <td className="p-3.5 font-mono text-teal-700 font-bold">{b.checkinsCount}</td>
                  <td className="p-3.5 font-mono font-bold text-[#D4A72C]">{formatCurrency(b.revenue)}</td>
                  <td className="p-3.5 font-mono text-rose-600">{formatCurrency(b.expenses)}</td>
                  <td className="p-3.5 font-mono font-black text-emerald-600">{formatCurrency(b.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
