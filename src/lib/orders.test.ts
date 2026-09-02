import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateInvoiceCode } from '@/lib/orders';

const mockState = {
  voucher: null as Record<string, unknown> | null,
  error: null as Error | null,
};

const singleMock = vi.fn(() => Promise.resolve({ data: mockState.voucher, error: mockState.error }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: singleMock,
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

describe('generateInvoiceCode', () => {
  it('generates LG- prefixed code', () => {
    const code = generateInvoiceCode();
    expect(code).toMatch(/^LG-\d{8}-[A-Z0-9]{4}$/);
  });

  it('includes current date', () => {
    const code = generateInvoiceCode();
    const today = new Date();
    const dateStr = `${today.getFullYear()}${
      String(today.getMonth() + 1).padStart(2, '0')
    }${String(today.getDate()).padStart(2, '0')}`;
    expect(code).toContain(dateStr);
  });

  it('generates unique codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInvoiceCode()));
    expect(codes.size).toBe(20);
  });
});

function makeVoucher(overrides: Record<string, unknown> = {}) {
  return {
    code: 'TEST',
    is_active: true,
    discount_type: 'FIXED',
    discount_value: 5000,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    quota_total: 100,
    quota_used: 0,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    ...overrides,
  };
}

describe('validateVoucher', () => {
  beforeEach(() => {
    mockState.voucher = null;
    mockState.error = null;
  });

  it('returns invalid for voucher not found', async () => {
    mockState.error = Object.assign(new Error('Not found'), { message: 'Not found' });
    singleMock.mockResolvedValueOnce({ data: null, error: mockState.error });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('INVALID', 50000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('tidak ditemukan');
  });

  it('returns invalid for inactive voucher', async () => {
    mockState.voucher = makeVoucher({ code: 'INACTIVE', is_active: false });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('INACTIVE', 50000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('tidak aktif');
  });

  it('returns invalid for voucher not yet started', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    mockState.voucher = makeVoucher({ code: 'FUTURE', start_date: tomorrow, end_date: '2099-12-31' });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('FUTURE', 50000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('belum berlaku');
  });

  it('returns invalid for expired voucher', async () => {
    mockState.voucher = makeVoucher({ code: 'EXPIRED', start_date: '2025-01-01', end_date: '2025-12-31' });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('EXPIRED', 50000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('kadaluarsa');
  });

  it('returns invalid when quota exhausted', async () => {
    mockState.voucher = makeVoucher({ code: 'FULL', quota_used: 10, quota_total: 10 });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('FULL', 50000);
    expect(result.valid).toBe(false);
    expect(result.message.toLowerCase()).toContain('kuota');
  });

  it('returns invalid when below minimum order', async () => {
    mockState.voucher = makeVoucher({ code: 'MINORDER', min_order_amount: 100000 });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('MINORDER', 50000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Minimum');
  });

  it('applies fixed discount correctly', async () => {
    mockState.voucher = makeVoucher({ code: 'FLAT5K', discount_value: 5000 });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('FLAT5K', 50000);
    expect(result.valid).toBe(true);
    expect(result.discount_amount).toBe(5000);
  });

  it('caps percentage discount at max_discount_amount', async () => {
    mockState.voucher = makeVoucher({
      code: 'PROMO50',
      discount_type: 'PERCENT',
      discount_value: 50,
      max_discount_amount: 15000,
    });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('PROMO50', 50000);
    expect(result.valid).toBe(true);
    expect(result.discount_amount).toBe(15000);
  });

  it('applies percentage discount without cap', async () => {
    mockState.voucher = makeVoucher({
      code: 'PROMO20',
      discount_type: 'PERCENT',
      discount_value: 20,
      max_discount_amount: null,
    });
    singleMock.mockResolvedValueOnce({ data: mockState.voucher, error: null });
    const { validateVoucher } = await import('@/lib/orders');
    const result = await validateVoucher('PROMO20', 100000);
    expect(result.valid).toBe(true);
    expect(result.discount_amount).toBe(20000);
  });
});
