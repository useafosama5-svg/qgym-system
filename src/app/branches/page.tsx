'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import {
  Building2,
  PlusCircle,
  Phone,
  Clock,
  MapPin,
  Users,
  CreditCard,
  UserCheck,
  X,
} from 'lucide-react';

export default function BranchesPage() {
  const { user } = useApp();
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('00:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          address,
          phone,
          openingTime,
          closingTime,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setCode('');
        setAddress('');
        setPhone('');
        fetchBranches();
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">إدارة الفروع</h1>
            <p className="text-xs text-gray-500">
              شبكة فروع QGYM وإدارة مواعيد العمل والقدرة الاستيعابية
            </p>
          </div>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold text-xs shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة فرع جديد</span>
          </button>
        )}
      </div>

      {/* Branches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
          ))
        ) : branches.length === 0 ? (
          <div className="col-span-3 bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400">
            لا توجد فروع مسجلة
          </div>
        ) : (
          branches.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:border-amber-400 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{b.name}</h3>
                  <span className="text-[11px] font-mono text-[#D4A72C] font-bold">{b.code}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{b.address || 'العنوان غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span dir="ltr">{b.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>
                    {b.openingTime} — {b.closingTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs text-center">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">الأعضاء</span>
                  <span className="font-bold text-gray-900 font-mono">{b._count?.customers || 0}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">الموظفون</span>
                  <span className="font-bold text-gray-900 font-mono">{b._count?.employees || 0}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">الزيارات</span>
                  <span className="font-bold text-gray-900 font-mono">{b._count?.attendances || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-sm text-gray-900">إضافة فرع جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5">
              <div>
                <label className="text-gray-600 block mb-1">اسم الفرع *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="فرع الشيخ زايد"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">كود الفرع *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="BR-ZAYED"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">العنوان</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مول أركان، الشيخ زايد"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 block mb-1">وقت الفتح</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">وقت الإغلاق</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
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
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفرع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
