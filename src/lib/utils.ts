import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function getActivePrice(
  basePrice: number,
  discountPrice: number | null,
  startDate: string | null,
  endDate: string | null
): { price: number; hasDiscount: boolean } {
  if (!discountPrice) return { price: basePrice, hasDiscount: false };

  const now = new Date();
  const inRange =
    (!startDate || now >= new Date(startDate)) &&
    (!endDate || now <= new Date(endDate));

  return inRange
    ? { price: discountPrice, hasDiscount: true }
    : { price: basePrice, hasDiscount: false };
}

export function getStockLabel(
  quantity: number,
  status: 'active' | 'po_mode' | 'inactive'
): 'ready' | 'po' | 'inactive' {
  if (status === 'inactive') return 'inactive';
  if (status === 'po_mode' || quantity === 0) return 'po';
  return 'ready';
}
