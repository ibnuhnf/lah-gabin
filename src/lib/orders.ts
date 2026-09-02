import { supabase } from '@/lib/supabase';
import { Voucher } from '@/types';

export interface VoucherValidationResult {
  valid: boolean;
  discount_amount: number;
  message: string;
  voucher?: Voucher;
}

export async function validateVoucher(
  code: string,
  orderTotal: number
): Promise<VoucherValidationResult> {
  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (error || !voucher) {
    return { valid: false, discount_amount: 0, message: 'Kode voucher tidak ditemukan.' };
  }

  if (!voucher.is_active) {
    return { valid: false, discount_amount: 0, message: 'Voucher tidak aktif.' };
  }

  const now = new Date();
  if (now < new Date(voucher.start_date)) {
    return { valid: false, discount_amount: 0, message: 'Voucher belum berlaku.' };
  }
  if (now > new Date(voucher.end_date)) {
    return { valid: false, discount_amount: 0, message: 'Voucher sudah kadaluarsa.' };
  }

  if (voucher.quota_used >= voucher.quota_total) {
    return { valid: false, discount_amount: 0, message: 'Kuota voucher sudah habis.' };
  }

  if (orderTotal < voucher.min_order_amount) {
    return {
      valid: false,
      discount_amount: 0,
      message: `Minimum pembelian Rp ${voucher.min_order_amount.toLocaleString('id-ID')} untuk voucher ini.`,
    };
  }

  let discount_amount = 0;
  if (voucher.discount_type === 'FIXED') {
    discount_amount = voucher.discount_value;
  } else {
    discount_amount = Math.round((orderTotal * voucher.discount_value) / 100);
    if (voucher.max_discount_amount) {
      discount_amount = Math.min(discount_amount, voucher.max_discount_amount);
    }
  }

  return { valid: true, discount_amount, message: 'Voucher berhasil dipakai!', voucher };
}

export async function consumeVoucherQuota(voucherId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_voucher_quota', { p_voucher_id: voucherId });
  return !error;
}

export function generateInvoiceCode(): string {
  const now = new Date();
  const pad = (n: number, size = 2) => String(n).padStart(size, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LG-${dateStr}-${rand}`;
}
