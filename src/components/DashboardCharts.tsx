'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, Clock } from 'lucide-react';

interface DashboardChartsProps {
  branchComparison: any[];
  peakHoursData: any[];
  isLoading: boolean;
}

export default function DashboardCharts({
  branchComparison,
  peakHoursData,
  isLoading,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Branch Financial Comparison */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#D4A72C]" />
            مقارنة الإيرادات والمصروفات بين الفروع (ج.م)
          </h3>
          <span className="text-[10px] text-gray-400">آخر 30 يوم</span>
        </div>
        <div className="h-60 w-full">
          {isLoading || branchComparison.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
              جاري تحميل بيانات المقارنة...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    fontSize: '11px',
                    color: '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="الإيرادات" fill="#D4A72C" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="المصروفات" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Peak Hours Checkin */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            ساعات الذروة لتسجيلات الدخول (Check-in Peak Hours)
          </h3>
          <span className="text-[10px] text-gray-400">توزيع الزيارات</span>
        </div>
        <div className="h-60 w-full">
          {isLoading || peakHoursData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
              جاري تحميل ساعات الذروة...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    fontSize: '11px',
                    color: '#0f172a',
                  }}
                />
                <Bar dataKey="count" name="عدد الزيارات" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export function PaymentPieChart({
  paymentMethods,
  colors,
  isLoading,
}: {
  paymentMethods: any[];
  colors: string[];
  isLoading: boolean;
}) {
  if (isLoading || paymentMethods.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={paymentMethods.filter((p: any) => p.value > 0)}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={70}
          paddingAngle={4}
          dataKey="value"
        >
          {paymentMethods.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            fontSize: '11px',
            color: '#0f172a',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
