'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Lock,
  X,
  User,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, branches, selectedBranchId } = useApp();
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Employee form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [homeBranchId, setHomeBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const bId = user?.role === 'SUPER_ADMIN' ? selectedBranchId : (user?.homeBranchId || 'ALL');
      const res = await fetch(`/api/employees?branchId=${bId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
        setRoles(data.roles || []);
        if (data.roles?.length > 0 && !roleId) {
          setRoleId(data.roles[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedBranchId]);

  useEffect(() => {
    if (branches.length > 0 && !homeBranchId) {
      setHomeBranchId(branches[0].id);
    }
  }, [branches]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          phone,
          roleId,
          homeBranchId: homeBranchId || null,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setEmail('');
        setUsername('');
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">الموظفون والصلاحيات</h1>
            <p className="text-xs text-gray-500">
              إدارة حسابات فريق العمل وتعيين الأدوار والنطاقات لكل فرع
            </p>
          </div>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3.5">الاسم</th>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">البريد الإلكتروني</th>
                <th className="p-3.5">الهاتف</th>
                <th className="p-3.5">الدور الوظيفي</th>
                <th className="p-3.5">الفرع التابع له</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    جاري تحميل الموظفين...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    لا يوجد موظفون مسجلون
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D4A72C] flex items-center justify-center font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <span>{emp.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600">{emp.username}</td>
                    <td className="p-3.5 text-gray-500">{emp.email}</td>
                    <td className="p-3.5 font-mono text-gray-600" dir="ltr">{emp.phone || '-'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-semibold text-[10px]">
                        {emp.role?.displayName || emp.role?.name}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-700 font-medium">
                      {emp.homeBranch?.name || '🌐 كافة الفروع'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {emp.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">إضافة موظف جديد وتعيين صلاحياته</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="text-gray-600 block mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">اسم المستخدم *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="m_ahmed"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@qgym.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">الدور الوظيفي *</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">الفرع التابع له</label>
                  <select
                    value={homeBranchId}
                    onChange={(e) => setHomeBranchId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  >
                    <option value="">🌐 كافة الفروع (مدير عام)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
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
                  className="px-5 py-2 rounded-xl bg-[#D4A72C] text-white font-bold"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
