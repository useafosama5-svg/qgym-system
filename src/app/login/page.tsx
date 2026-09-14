'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Lock, User, ArrowLeft, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        return;
      }

      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = (userVal: string) => {
    setUsername(userVal);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen -m-6 flex flex-col justify-center items-center p-4 relative bg-[#f7f8fa] select-none">
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-20 h-20 items-center justify-center mb-1">
            <img
              src="/assets/LOGO.svg"
              alt="QGYM Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            QGYM <span className="text-[#D4A72C]">SYSTEM</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">النظام المركزي الاحترافي لإدارة الجيم متعدد الفروع</p>
        </div>

        {/* Clean Light Login Card */}
        <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-md space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">اسم المستخدم أو البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin أو mgr_nasr..."
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-gray-900 text-xs focus:outline-none focus:border-[#D4A72C] focus:ring-2 focus:ring-amber-100 transition font-medium"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-gray-900 text-xs focus:outline-none focus:border-[#D4A72C] focus:ring-2 focus:ring-amber-100 transition"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-gray-900 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>تسجيل الدخول للنظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Persona Quick Select */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5">
            <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A72C]" />
              <span>تجربة سريعة للأدوار (Fast Role Switch):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLoginAs('admin')}
                className="p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200 text-right transition group"
              >
                <div className="font-bold text-amber-900 group-hover:text-amber-800">👑 Super Admin</div>
                <div className="text-[10px] text-amber-700/70">كافة الفروع والإحصائيات</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('mgr_nasr')}
                className="p-2.5 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-200 text-right transition group"
              >
                <div className="font-bold text-blue-900 group-hover:text-blue-800">🏢 مدير فرع نصر</div>
                <div className="text-[10px] text-blue-700/70">إدارة فرع مدينة نصر</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('rec_maadi')}
                className="p-2.5 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 text-right transition group"
              >
                <div className="font-bold text-emerald-900 group-hover:text-emerald-800">🛎️ استقبال المعادي</div>
                <div className="text-[10px] text-emerald-700/70">تسجيل حضور وخزينة</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('trainer_omar')}
                className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-200 text-right transition group"
              >
                <div className="font-bold text-purple-900 group-hover:text-purple-800">🏋️ كابتن عمر</div>
                <div className="text-[10px] text-purple-700/70">خطط تدريبية وإنبادي</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-gray-400 font-medium">
          QGYM Multi-Branch System © 2026 — Enterprise Centralized Architecture
        </div>
      </div>
    </div>
  );
}
