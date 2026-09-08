import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CartItem, Voucher } from '@/types';

function calculateTotals(items: CartItem[], voucher: Voucher | null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;

  if (voucher && voucher.is_active) {
    if (voucher.discount_type === 'PERCENT') {
      discountAmount = Math.round((subtotal * voucher.discount_value) / 100);
      if (voucher.max_discount_amount) {
        discountAmount = Math.min(discountAmount, voucher.max_discount_amount);
      }
    } else {
      discountAmount = Math.min(voucher.discount_value, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, finalTotal };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderPayload, itemsPayload, voucherCode } = body;

    if (!itemsPayload || !Array.isArray(itemsPayload) || itemsPayload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar item pesanan tidak boleh kosong' },
        { status: 400 }
      );
    }

    // 1. Verifikasi harga asli produk dari Supabase jika dikonfigurasi
    let verifiedItems: CartItem[] = itemsPayload;
    if (isSupabaseConfigured()) {
      try {
        const productIds = itemsPayload.map((it: any) => it.product_id).filter(Boolean);
        if (productIds.length > 0) {
          const { data: dbProducts } = await supabase
            .from('products')
            .select('id, name, base_price, discount_price')
            .in('id', productIds);

          if (dbProducts && dbProducts.length > 0) {
            const productMap = new Map(dbProducts.map((p) => [p.id, p]));
            verifiedItems = itemsPayload.map((item: any) => {
              const dbP = productMap.get(item.product_id);
              if (dbP) {
                const activePrice = Number(dbP.discount_price || dbP.base_price);
                return {
                  ...item,
                  price: activePrice,
                  subtotal: activePrice * item.quantity,
                };
              }
              return item;
            });
          }
        }
      } catch (err) {
        console.warn('Server validation fallback to submitted item prices:', err);
      }
    }

    // 2. Verifikasi Voucher diskon
    let appliedVoucher: Voucher | null = null;
    if (voucherCode && isSupabaseConfigured()) {
      try {
        const { data: vData } = await supabase
          .from('vouchers')
          .select('*')
          .eq('code', voucherCode)
          .eq('is_active', true)
          .single();

        if (vData) {
          appliedVoucher = {
            id: vData.id,
            code: vData.code,
            discount_type: vData.discount_type,
            discount_value: Number(vData.discount_value),
            min_order_amount: Number(vData.min_order_amount || 0),
            max_discount_amount: vData.max_discount_amount ? Number(vData.max_discount_amount) : undefined,
            quota_total: vData.quota_total,
            quota_used: vData.quota_used,
            start_date: vData.start_date,
            end_date: vData.end_date,
            is_active: vData.is_active,
          };
        }
      } catch {}
    }

    // 3. Kalkulasi ulang total harga yang valid secara server-side
    const totals = calculateTotals(verifiedItems, appliedVoucher);

    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const secureOrderPayload = {
      id: isUuid(orderPayload?.id) ? orderPayload.id : crypto.randomUUID(),
      invoice_code: orderPayload.invoice_code || `LG-${Date.now()}`,
      customer_name: (orderPayload.customer_name || 'Pelanggan').slice(0, 100),
      customer_wa: (orderPayload.customer_wa || '-').slice(0, 25),
      customer_notes: orderPayload.customer_notes || null,
      total_amount: totals.subtotal,
      discount_amount: totals.discountAmount,
      final_amount: totals.finalTotal,
      payment_method: orderPayload.payment_method || 'QRIS',
      status: 'PENDING_APPROVAL',
      voucher_id: appliedVoucher?.id || null,
      order_source: orderPayload.order_source || 'ONLINE',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        order: secureOrderPayload,
        items: verifiedItems,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server validation error' },
      { status: 500 }
    );
  }
}
