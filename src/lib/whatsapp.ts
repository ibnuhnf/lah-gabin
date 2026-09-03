import { Order } from '@/types';

export function buildWhatsAppURL(order: Order, adminWa: string): string {
  const cleanNumber = adminWa.replace(/\D/g, '').replace(/^0/, '62');
  const items = (order.items || [])
    .map((item, i) => `${i + 1}. ${item.product_name} x${item.quantity} = Rp ${item.subtotal.toLocaleString('id-ID')}`)
    .join('\n');

  const lines = [
    `Halo Admin Lah Gabin!`,
    ``,
    `Saya ingin konfirmasi pesanan:`,
    `*Kode Invoice:* ${order.invoice_code}`,
    `*Nama:* ${order.customer_name}`,
    `*Nomor WA:* ${order.customer_wa}`,
    order.customer_address ? `*Alamat & Lokasi:* ${order.customer_address}` : '',
    ``,
    `*Rincian Pesanan:*`,
    items,
    ``,
    order.discount_amount > 0 ? `*Diskon:* Rp ${order.discount_amount.toLocaleString('id-ID')}` : '',
    `*Total Pembayaran:* *Rp ${order.final_amount.toLocaleString('id-ID')}*`,
    order.customer_notes ? `*Catatan:* ${order.customer_notes}` : '',
    ``,
    `Mohon segera diproses ya. Terima kasih!`,
  ]
    .filter(Boolean)
    .join('\n');

  const encoded = encodeURIComponent(lines);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}

export function normalizeIndonesianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidIndonesianPhone(phone: string): boolean {
  const digits = normalizeIndonesianPhone(phone);
  return /^62[2-9]\d{7,12}$/.test(digits);
}
