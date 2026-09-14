'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, CreditCard, ScanLine, X, ArrowRight, Phone, ShieldCheck, Sparkles } from 'lucide-react';

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.customers || []);
        }
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fadeIn">
      <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/70">
          <Search className="w-5 h-5 text-[#D4A72C] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث فوري في النظام (اسم العميل، رقم الهاتف، الكود، الباركود، QR)..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-gray-200 text-[11px] font-mono text-gray-600 hover:text-gray-900 font-semibold"
          >
            ESC
          </button>
        </div>

        {/* Results / Suggestions */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-xs">جاري البحث في قاعدة البيانات المركزية...</div>
          ) : results.length > 0 ? (
            results.map((cust) => {
              const activePlan = cust.memberships?.[0]?.plan?.name || 'بدون باقة نشطة';
              const isStatusActive = cust.status === 'ACTIVE';

              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    router.push(`/customers/${cust.id}`);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-amber-50/60 border border-gray-100 hover:border-amber-300 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm">
                      {cust.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 group-hover:text-amber-800 transition">
                          {cust.firstName} {cust.lastName}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                          {cust.customerCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span dir="ltr">{cust.phone}</span>
                        </span>
                        <span>•</span>
                        <span>{cust.homeBranch?.name}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-medium">{activePlan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        isStatusActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {cust.status === 'ACTIVE' ? 'نشط' : cust.status === 'FROZEN' ? 'مجمد' : 'منتهي'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#D4A72C] group-hover:translate-x-[-2px] transition rotate-180" />
                  </div>
                </div>
              );
            })
          ) : query.trim().length >= 2 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              لم يتم العثور على أي عميل يطابق &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-3 space-y-3">
              <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A72C]" />
                <span>اختصارات لوحة المفاتيح السريعة (Keyboard Shortcuts)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">تسجيل حضور سريع</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-gray-300 text-gray-800 font-mono text-[11px] shadow-xs">
                    F2
                  </kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">إضافة عميل جديد</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-gray-300 text-gray-800 font-mono text-[11px] shadow-xs">
                    F3
                  </kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">سند قبض / تحصيل</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-gray-300 text-gray-800 font-mono text-[11px] shadow-xs">
                    F4
                  </kbd>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">البحث الشامل</span>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-gray-300 text-gray-800 font-mono text-[11px] shadow-xs">
                    Ctrl + K
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
