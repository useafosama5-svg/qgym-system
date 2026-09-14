import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency === 'EGP' ? 'ج.م' : currency}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateCustomerCode(nextNumber: number): string {
  return `GYM-${String(nextNumber).padStart(6, '0')}`;
}

export function generatePaymentNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `PAY-${year}-${String(seq).padStart(5, '0')}`;
}

export function generateSessionNumber(branchCode: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10 + Math.random() * 90);
  return `SES-${branchCode}-${dateStr}-${rand}`;
}
