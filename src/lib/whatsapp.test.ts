import { describe, it, expect } from 'vitest';
import {
  normalizeIndonesianPhone,
  isValidIndonesianPhone,
  buildWhatsAppURL,
} from '@/lib/whatsapp';
import type { Order } from '@/types';

describe('normalizeIndonesianPhone', () => {
  it('handles 08 prefix', () => {
    expect(normalizeIndonesianPhone('081234567890')).toBe('6281234567890');
  });

  it('handles 62 prefix (already correct)', () => {
    expect(normalizeIndonesianPhone('6281234567890')).toBe('6281234567890');
  });

  it('handles leading +', () => {
    expect(normalizeIndonesianPhone('+6281234567890')).toBe('6281234567890');
  });

  it('strips non-digit characters', () => {
    expect(normalizeIndonesianPhone('+62-812-3456-7890')).toBe('6281234567890');
  });
});

describe('isValidIndonesianPhone', () => {
  it('accepts valid 62 prefix numbers', () => {
    expect(isValidIndonesianPhone('6281234567890')).toBe(true);
  });

  it('accepts valid 08 prefix numbers', () => {
    expect(isValidIndonesianPhone('081234567890')).toBe(true);
  });

  it('accepts number with 11 digits after 62', () => {
    expect(isValidIndonesianPhone('628123456789')).toBe(true);
  });

  it('rejects number that is too short', () => {
    expect(isValidIndonesianPhone('6281234')).toBe(false);
  });

  it('rejects non-Indonesian numbers', () => {
    expect(isValidIndonesianPhone('1234567890')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidIndonesianPhone('')).toBe(false);
  });
});

describe('buildWhatsAppURL', () => {
  const mockOrder: Order = {
    id: 'order-1',
    invoice_code: 'LG-20260902-ABCD',
    customer_name: 'Budi Santoso',
    customer_wa: '6281234567890',
    customer_notes: 'Pedesin ya',
    total_amount: 30000,
    discount_amount: 5000,
    final_amount: 25000,
    payment_method: 'TRANSFER',
    status: 'PENDING_APPROVAL',
    order_source: 'ONLINE',
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-02T10:00:00Z',
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        product_name: 'Es Gabin Coklat',
        price_snapshot: 15000,
        quantity: 2,
        subtotal: 30000,
      },
    ],
  };

  it('returns wa.me URL with encoded text', () => {
    const url = buildWhatsAppURL(mockOrder, '6282121498255');
    expect(url).toContain('wa.me/6282121498255');
    expect(url).toContain('text=');
  });

  it('URL-encodes the message body', () => {
    const url = buildWhatsAppURL(mockOrder, '6282121498255');
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('Budi Santoso');
    expect(decoded).toContain('LG-20260902-ABCD');
    expect(decoded).toContain('25.000');
    expect(decoded).toContain('Pedesin ya');
  });

  it('cleans number to 62 prefix', () => {
    const url = buildWhatsAppURL(mockOrder, '082121498255');
    expect(url).toContain('wa.me/6282121498255');
  });

  it('includes discount line when discount > 0', () => {
    const url = buildWhatsAppURL(mockOrder, '6282121498255');
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('Diskon');
  });

  it('omits discount line when no discount', () => {
    const noDiscountOrder = { ...mockOrder, discount_amount: 0 };
    const url = buildWhatsAppURL(noDiscountOrder, '6282121498255');
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).not.toContain('Diskon');
  });

  it('omits notes line when no notes', () => {
    const noNotesOrder = { ...mockOrder, customer_notes: undefined };
    const url = buildWhatsAppURL(noNotesOrder, '6282121498255');
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).not.toContain('Catatan');
  });
});
