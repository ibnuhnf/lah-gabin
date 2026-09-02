import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  getActivePrice,
  getStockLabel,
} from '@/lib/utils';

describe('formatRupiah', () => {
  it('formats zero', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('formats thousands with separator', () => {
    expect(formatRupiah(1500)).toBe('Rp 1.500');
  });

  it('formats large numbers', () => {
    expect(formatRupiah(125000000)).toBe('Rp 125.000.000');
  });
});

describe('getActivePrice', () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
  const twoWeeksLater = new Date(now.getTime() + 14 * 86400000).toISOString();

  it('returns base price when no discount', () => {
    const result = getActivePrice(15000, null, null, null);
    expect(result.price).toBe(15000);
    expect(result.hasDiscount).toBe(false);
  });

  it('returns discount price when in range', () => {
    const result = getActivePrice(15000, 12000, yesterday, tomorrow);
    expect(result.price).toBe(12000);
    expect(result.hasDiscount).toBe(true);
  });

  it('returns base price when before start date', () => {
    const result = getActivePrice(15000, 12000, tomorrow, twoWeeksLater);
    expect(result.price).toBe(15000);
    expect(result.hasDiscount).toBe(false);
  });

  it('returns base price when after end date', () => {
    const result = getActivePrice(15000, 12000, twoWeeksAgo, yesterday);
    expect(result.price).toBe(15000);
    expect(result.hasDiscount).toBe(false);
  });
});

describe('getStockLabel', () => {
  it('returns inactive when status inactive', () => {
    expect(getStockLabel(100, 'inactive')).toBe('inactive');
  });

  it('returns po when status po_mode', () => {
    expect(getStockLabel(100, 'po_mode')).toBe('po');
  });

  it('returns po when quantity zero regardless of status', () => {
    expect(getStockLabel(0, 'active')).toBe('po');
  });

  it('returns ready when active and has stock', () => {
    expect(getStockLabel(5, 'active')).toBe('ready');
  });
});
