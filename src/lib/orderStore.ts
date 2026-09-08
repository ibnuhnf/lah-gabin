import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Order } from '@/types';

const FALLBACK_ORDERS_KEY = 'lah_gabin_admin_orders';

export async function fetchAllOrders(): Promise<Order[]> {
  // 1. Coba ambil dari Supabase Cloud DB
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: Order[] = data.map((d: any) => ({
          ...d,
          items: d.order_items || d.items || [],
          order_items: d.order_items || d.items || [],
        }));
        // Update local cache
        try {
          localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify(formatted));
        } catch {}
        return formatted;
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase, fallback to cache:', err);
    }
  }

  // 2. Fallback ke local cache jika Supabase offline/unconfigured
  try {
    const cached = localStorage.getItem(FALLBACK_ORDERS_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

export async function createOrder(orderPayload: any, itemsPayload: any[]): Promise<{ success: boolean; data?: any; error?: string }> {
  const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Optional: Validasi server-side via API route jika tersedia di environment
  let validatedOrder = { ...orderPayload };
  let validatedItems = itemsPayload;
  if (typeof window !== 'undefined' && orderPayload.order_source !== 'POS') {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderPayload,
          itemsPayload,
          voucherCode: orderPayload.voucher_code,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          validatedOrder = { ...validatedOrder, ...json.data.order };
          if (json.data.items) {
            validatedItems = json.data.items;
          }
        }
      }
    } catch {
      // Graceful fallback to client calculation
    }
  }

  // Gabungkan alamat & catatan ke customer_notes agar tidak ditolak schema database
  const notesParts = [];
  if (validatedOrder.customer_address) notesParts.push(`Alamat: ${validatedOrder.customer_address}`);
  if (validatedOrder.delivery_zone) notesParts.push(`Zona: ${validatedOrder.delivery_zone}`);
  if (validatedOrder.customer_notes) notesParts.push(validatedOrder.customer_notes);
  const combinedNotes = notesParts.join(' | ') || null;

  // Supabase db order payload: hanya kolom yang valid di schema Supabase
  const dbOrderPayload: any = {
    id: isUuid(validatedOrder.id) ? validatedOrder.id : crypto.randomUUID(),
    invoice_code: validatedOrder.invoice_code,
    customer_name: validatedOrder.customer_name || 'Pelanggan',
    customer_wa: validatedOrder.customer_wa || '-',
    customer_notes: combinedNotes,
    total_amount: Number(validatedOrder.total_amount) || 0,
    discount_amount: Number(validatedOrder.discount_amount) || 0,
    final_amount: Number(validatedOrder.final_amount) || 0,
    payment_method: validatedOrder.payment_method || 'QRIS',
    status: validatedOrder.status || 'PENDING_APPROVAL',
    voucher_id: isUuid(validatedOrder.voucher_id) ? validatedOrder.voucher_id : null,
    order_source: validatedOrder.order_source || 'ONLINE',
    created_at: validatedOrder.created_at || new Date().toISOString(),
  };

  // 1. Simpan ke Supabase Cloud
  if (isSupabaseConfigured()) {
    try {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([dbOrderPayload])
        .select()
        .maybeSingle();

      if (orderErr) {
        console.error('Supabase order insert error:', orderErr);
      } else if (dbOrder && itemsPayload && itemsPayload.length > 0) {
        const sanitizedItems = itemsPayload.map((item) => ({
          id: isUuid(item.id) ? item.id : crypto.randomUUID(),
          order_id: dbOrder.id,
          product_id: isUuid(item.product_id) ? item.product_id : null,
          product_name: item.product_name || 'Produk',
          price_snapshot: Number(item.price_snapshot) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal) || 0,
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(sanitizedItems);
        if (itemsErr) console.error('Supabase order_items insert error:', itemsErr);
      }
    } catch (err) {
      console.error('Network/Exception inserting order to Supabase:', err);
    }
  }

  // 2. Potong Stok Ready & Catat Mutasi Stok (untuk pesanan Online)
  if (orderPayload.order_source !== 'POS' && itemsPayload && itemsPayload.length > 0) {
    try {
      // Ambil data produk saat ini (Supabase atau LocalStorage)
      let products: any[] = [];
      if (isSupabaseConfigured()) {
        const { data: dbProds } = await supabase.from('products').select('*');
        if (dbProds) products = dbProds;
      }
      if (products.length === 0) {
        try {
          const local = localStorage.getItem('lah_gabin_admin_products');
          if (local) products = JSON.parse(local);
        } catch {}
      }

      // Group quantity per product_id
      const qtyMap: Record<string, number> = {};
      for (const it of itemsPayload) {
        if (it.product_id) {
          qtyMap[it.product_id] = (qtyMap[it.product_id] || 0) + (Number(it.quantity) || 1);
        }
      }

      // Update produk
      const updatedProducts = products.map((p) => {
        const orderQty = qtyMap[p.id];
        if (orderQty && orderQty > 0) {
          const currentStock = Number(p.stock_quantity) || 0;
          const newStock = Math.max(0, currentStock - orderQty);
          return { ...p, stock_quantity: newStock };
        }
        return p;
      });

      // Simpan perubahan ke local storage
      try {
        localStorage.setItem('lah_gabin_admin_products', JSON.stringify(updatedProducts));
      } catch {}

      // Simpan perubahan dan mutasi ke Supabase
      if (isSupabaseConfigured()) {
        for (const [pId, orderedQty] of Object.entries(qtyMap)) {
          const prod = products.find((p) => p.id === pId);
          if (prod) {
            const beforeStock = Number(prod.stock_quantity) || 0;
            const deduction = Math.min(beforeStock, orderedQty);
            const afterStock = Math.max(0, beforeStock - orderedQty);

            if (deduction > 0 || beforeStock > 0) {
              await supabase
                .from('products')
                .update({ stock_quantity: afterStock })
                .eq('id', pId);

              await supabase.from('stock_mutations').insert([
                {
                  id: crypto.randomUUID(),
                  product_id: pId,
                  type: 'KELUAR_PENJUALAN',
                  quantity: deduction,
                  stock_before: beforeStock,
                  stock_after: afterStock,
                  reference_id: dbOrderPayload.invoice_code,
                  notes: `Pesanan Online #${dbOrderPayload.invoice_code} (${dbOrderPayload.customer_name})`,
                  created_at: new Date().toISOString(),
                },
              ]);
            }
          }
        }
      }
    } catch (stockErr) {
      console.warn('Gagal memproses pemotongan stok otomatis:', stockErr);
    }
  }

  // 3. Simpan ke Local Storage Cache
  try {
    const fullOrder: Order = {
      ...orderPayload,
      id: dbOrderPayload.id,
      customer_notes: combinedNotes,
      items: itemsPayload,
      order_items: itemsPayload,
    };
    localStorage.setItem(`lah_gabin_order_${dbOrderPayload.invoice_code}`, JSON.stringify(fullOrder));

    const existing: Order[] = JSON.parse(localStorage.getItem(FALLBACK_ORDERS_KEY) || '[]');
    const filtered = existing.filter((o) => o.id !== dbOrderPayload.id && o.invoice_code !== dbOrderPayload.invoice_code);
    localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify([fullOrder, ...filtered]));
  } catch {}

  return { success: true, data: dbOrderPayload };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status'],
  cancelReason?: string
): Promise<boolean> {
  // 1. Update di Supabase
  if (isSupabaseConfigured()) {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (cancelReason !== undefined) {
        updateData.cancelled_reason = cancelReason;
      }
      await supabase.from('orders').update(updateData).eq('id', orderId);
    } catch (err) {
      console.warn('Failed to update order status in Supabase:', err);
    }
  }

  // 2. Update local cache
  try {
    const existing: Order[] = JSON.parse(localStorage.getItem(FALLBACK_ORDERS_KEY) || '[]');
    const updated = existing.map((o) => {
      if (o.id === orderId) {
        const up = { ...o, status: newStatus, cancelled_reason: cancelReason || o.cancelled_reason };
        if (o.invoice_code) {
          localStorage.setItem(`lah_gabin_order_${o.invoice_code}`, JSON.stringify(up));
        }
        return up;
      }
      return o;
    });
    localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify(updated));
  } catch {}

  return true;
}

export async function deleteOrderPermanently(orderId: string, invoiceCode?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (err) {
      console.warn('Failed to delete order from Supabase:', err);
    }
  }

  try {
    const existing: Order[] = JSON.parse(localStorage.getItem(FALLBACK_ORDERS_KEY) || '[]');
    const filtered = existing.filter((o) => o.id !== orderId);
    localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify(filtered));
    if (invoiceCode) {
      localStorage.removeItem(`lah_gabin_order_${invoiceCode}`);
    }
  } catch {}

  return true;
}
