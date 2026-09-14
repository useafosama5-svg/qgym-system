'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import {
  Settings,
  Save,
  Building2,
  DollarSign,
  Bell,
  Clock,
  Shield,
  CheckCircle2,
  CreditCard,
  Phone,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, branches } = useApp();
  const [activeTab, setActiveTab] = useState<'branding' | 'branches' | 'thresholds' | 'payments'>('branding');
  const [settings, setSettings] = useState<any>({
    gym_name: 'QGYM Central Fitness & Sports Club',
    gym_phone: '01000000000',
    currency: 'EGP',
    tax_percentage: '0',
    tax_number: '123-456-789',
    checkin_grace_minutes: '15',
    notifications_expiry_days: '7,3,1',
    inactive_members_threshold_days: '14',
    max_freeze_days_default: '30',
    allow_cash: true,
    allow_visa: true,
    allow_mastercard: true,
    allow_instapay: true,
    allow_vodafone_cash: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev: any) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A72C] flex items-center justify-center border border-amber-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">إعدادات المنظومة والتهيئة العامة</h1>
            <p className="text-xs text-gray-500">
              تخصيص هوية الجيم، مواعيد الفروع، محددات التنبيهات، وطرق الدفع والتحصيل
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'branding', label: 'الهوية والشعار', icon: Sparkles },
          { id: 'branches', label: 'الفروع ومواعيد العمل', icon: Building2 },
          { id: 'thresholds', label: 'محددات النظام والتنبيهات', icon: Sliders },
          { id: 'payments', label: 'طرق الدفع والضرائب', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                isActive
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6 text-xs">
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ التغييرات وتحديث إعدادات المنظومة بنجاح!</span>
          </div>
        )}

        {/* Tab 1: Branding */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">بيانات المنشأة والهوية البصرية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 block mb-1">اسم الجيم / العلامة التجارية *</label>
                <input
                  type="text"
                  value={settings.gym_name}
                  onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">رقم الهاتف الرسمي</label>
                <input
                  type="text"
                  value={settings.gym_phone}
                  onChange={(e) => setSettings({ ...settings, gym_phone: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">الرقم الضريبي (Tax ID)</label>
                <input
                  type="text"
                  value={settings.tax_number}
                  onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">العملة الافتراضية</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Branches Overview */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">الفروع المرتبطة بالنظام المركزي</h3>
            <div className="space-y-2">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div>
                    <div className="font-bold text-gray-900">{b.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{b.code} — {b.address}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 font-mono text-[11px] text-gray-700">
                    {b.openingTime || '06:00'} - {b.closingTime || '23:00'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Thresholds */}
        {activeTab === 'thresholds' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">محددات التنبيهات وقواعد العمل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 block mb-1">أيام تنبيه انتهاء الاشتراك (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={settings.notifications_expiry_days}
                  onChange={(e) => setSettings({ ...settings, notifications_expiry_days: e.target.value })}
                  placeholder="7,3,1"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">إرسال تنبيه قبل 7 و 3 و 1 يوم من انتهاء العضوية</span>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">حد رصد المشتركين المنقطعين (بالأيام)</label>
                <input
                  type="number"
                  value={settings.inactive_members_threshold_days}
                  onChange={(e) => setSettings({ ...settings, inactive_members_threshold_days: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">اعتبار العضو منقطعاً إذا غاب أكثر من هذا العدد</span>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">الحد الأقصى الافتراضي لأيام التجميد</label>
                <input
                  type="number"
                  value={settings.max_freeze_days_default}
                  onChange={(e) => setSettings({ ...settings, max_freeze_days_default: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">فترة السماح بالدخول بعد انتهاء الباقة (دقائق)</label>
                <input
                  type="number"
                  value={settings.checkin_grace_minutes}
                  onChange={(e) => setSettings({ ...settings, checkin_grace_minutes: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payment Methods */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">طرق الدفع والتحصيل المعتمدة</h3>
            <div className="space-y-2.5">
              {[
                { key: 'allow_cash', label: 'الدفع النقدي (Cash)' },
                { key: 'allow_visa', label: 'بطاقات فيزا / ماستركارد (POS & Cards)' },
                { key: 'allow_instapay', label: 'التحويل المباشر عبر إنستاباي (InstaPay)' },
                { key: 'allow_vodafone_cash', label: 'محافظ إلكترونية (Vodafone Cash)' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={!!settings[item.key]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    className="w-4 h-4 text-[#D4A72C] rounded focus:ring-amber-400"
                  />
                  <span className="font-bold text-gray-900">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4A72C] hover:bg-[#b88d1b] text-white font-bold transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
