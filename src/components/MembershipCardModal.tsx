'use client';

import React from 'react';
import { Dumbbell, Printer, X, ShieldCheck, QrCode, Calendar, MapPin, User, Sparkles } from 'lucide-react';

interface MemberCardProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    customerCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string | null;
    status: string;
    homeBranch: { name: string; code: string };
    memberships?: Array<{
      plan: { name: string; accessType: string };
      startDate: string | Date;
      endDate: string | Date;
      status: string;
    }>;
  } | null;
}

export function MembershipCardModal({ isOpen, onClose, customer }: MemberCardProps) {
  if (!isOpen || !customer) return null;

  const activeMembership = customer.memberships?.[0];
  const isStatusActive = customer.status === 'ACTIVE' && activeMembership?.status === 'ACTIVE';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A72C]" />
            <span className="text-xs font-bold text-gray-900">بطاقة عضوية رقمية (Digital Gym Pass)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A72C] hover:bg-[#b88d1b] text-gray-900 text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكارنيه</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Card View Container */}
        <div className="p-6 flex items-center justify-center bg-gray-50">
          <div
            id="printable-card"
            className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 via-[#101726] to-black border-2 border-amber-500/40 p-5 shadow-2xl text-white relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm tracking-wider text-amber-400">QGYM CLUB</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">VIP Member Pass</div>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                  isStatusActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isStatusActive ? 'نشط (ACTIVE)' : 'غير نشط'}
              </span>
            </div>

            {/* Card Body */}
            <div className="flex gap-4 items-center mb-4">
              <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-2xl shrink-0 shadow-lg">
                {customer.firstName.charAt(0)}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black text-slate-100">
                  {customer.firstName} {customer.lastName}
                </h3>
                <div className="text-xs font-mono text-amber-300 font-bold tracking-wider">
                  {customer.customerCode}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{customer.homeBranch.name}</span>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">نوع الباقة:</span>
                <span className="font-bold text-amber-300">{activeMembership?.plan?.name || 'غير مشترك'}</span>
              </div>
              {activeMembership && (
                <div className="flex justify-between">
                  <span className="text-slate-400">صلاحية حتى:</span>
                  <span className="font-bold text-slate-200">
                    {new Date(activeMembership.endDate).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </div>

            {/* Barcode & QR Simulator */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <div className="flex-1 pr-2">
                {/* Visual Barcode Lines */}
                <div className="flex items-center gap-[2px] h-8 opacity-80">
                  {[4, 2, 6, 3, 5, 2, 4, 7, 2, 5, 3, 6, 2, 4, 3, 5, 2, 6, 4, 3, 5, 2, 6, 3, 4, 2, 5].map((h, i) => (
                    <div
                      key={i}
                      className="bg-slate-300"
                      style={{
                        width: `${(i % 3) + 1}px`,
                        height: `${h * 4}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-400 tracking-widest mt-1">
                  {customer.customerCode}
                </div>
              </div>

              {/* QR Code Icon / Placeholder */}
              <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
