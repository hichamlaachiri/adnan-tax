import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEUR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return '€' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format MAD cleanly without confusing thousands dots:
// 4 digits: 9999 MAD, 9829 MAD (no dot, no space)
// 5+ digits: 14 000 MAD, 14 444 MAD (space as thousands separator)
// Whole numbers do not show .00 or ,00
export function formatMAD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  
  const isWhole = Math.abs(num - Math.round(num)) < 0.005;
  const rounded = isWhole ? Math.round(num) : Number(num.toFixed(2));
  
  const parts = rounded.toString().split('.');
  let intPart = parts[0];
  
  // 5 digits or more get a space separator (e.g. 14 000, 120 000). 4 digits stay plain (9829, 9999).
  if (intPart.length >= 5) {
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  
  const result = parts.length > 1 ? `${intPart}.${parts[1].padEnd(2, '0')}` : intPart;
  return `${result} MAD`;
}

export function formatNumber(amount: number | null | undefined, digits = 2): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
