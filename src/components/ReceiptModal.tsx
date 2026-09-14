'use client';

import React from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Dumbbell } from 'lucide-react';

interface ReceiptData {
  paymentNumber: string;
  paymentDate: string | Date;
  customerName: string;
  customerCode: string;
  phone: string;
  planName?: string;
  amount: number;
  paymentMethod: string;
  branchName: string;
  receivedByName: string;
  notes?: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const methodTranslations: Record<string, string> = {
    CASH: 'نقدي (Cash)',
    VISA: 'فيزا (Visa)',
    MASTERCARD: 'ماستركارد (Mastercard)',
    INSTAPAY: 'إنستاباي (InstaPay)',
    VODAFONE_CASH: 'فودافون كاش (Vodafone Cash)',
    OTHER: 'أخرى (Other)',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Actions bar (hidden in print) */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 print:hidden">
          <span className="text-xs font-bold text-gray-900">سند قبض إلكتروني رسمي</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A72C] hover:bg-[#b88d1b] text-gray-900 text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="p-8 bg-white text-slate-900 printable-content" id="printable-receipt">
          {/* Gym Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Dumbbell className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-black tracking-tight text-slate-900">QGYM FITNESS SYSTEM</h2>
            </div>
            <p className="text-xs text-slate-600 font-bold">فرع: {data.branchName}</p>
            <p className="text-[11px] text-slate-500 font-mono">سند قبض رقم: {data.paymentNumber}</p>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-xs mb-6">
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">التاريخ والوقت:</span>
              <span className="font-mono font-bold">
                {new Date(data.paymentDate).toLocaleString('ar-EG')}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">اسم العميل:</span>
              <span className="font-bold">{data.customerName}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">كود العميل:</span>
              <span className="font-mono font-bold">{data.customerCode}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">رقم الهاتف:</span>
              <span className="font-mono" dir="ltr">
                {data.phone}
              </span>
            </div>

            {data.planName && (
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold">الباقة / البيان:</span>
                <span className="font-bold text-slate-900">{data.planName}</span>
              </div>
            )}

            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">طريقة الدفع:</span>
              <span className="font-bold">{methodTranslations[data.paymentMethod] || data.paymentMethod}</span>
            </div>

            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-bold">المستلم (الكاشير):</span>
              <span className="font-bold">{data.receivedByName}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-100 border-2 border-slate-900 rounded-xl p-4 text-center my-4">
            <div className="text-xs text-slate-600 font-bold mb-1">المبلغ الإجمالي المدفوع</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {data.amount.toLocaleString()} <span className="text-base font-bold">ج.م</span>
            </div>
          </div>

          {/* Footer & QR info */}
          <div className="text-center pt-3 border-t border-slate-300 text-[10px] text-slate-500 space-y-1">
            <p className="font-bold">شكراً لاختياركم QGYM - نتمنى لكم تمريناً رائعاً!</p>
            <p>سند إلكتروني معتمد من النظام المركزي الموحد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
