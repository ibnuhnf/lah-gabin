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
  // Pastikan customer_wa tidak null karena schema database
  const safeOrderPayload = {
    ...orderPayload,
    customer_wa: orderPayload.customer_wa || '-',
    customer_notes: orderPayload.customer_notes || null,
    customer_address: orderPayload.customer_address || '-',
  };

  // 1. Simpan ke Supabase Cloud
  if (isSupabaseConfigured()) {
    try {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([safeOrderPayload])
        .select()
        .maybeSingle();

      if (orderErr) {
        console.error('Supabase order insert error:', orderErr);
      } else if (dbOrder) {
        if (itemsPayload && itemsPayload.length > 0) {
          const { error: itemsErr } = await supabase
            .from('order_items')
            .insert(itemsPayload);
          if (itemsErr) console.error('Supabase order_items insert error:', itemsErr);
        }
      }
    } catch (err) {
      console.error('Network/Exception inserting order to Supabase:', err);
    }
  }

  // 2. Simpan ke Local Storage Cache
  try {
    const fullOrder: Order = {
      ...safeOrderPayload,
      items: itemsPayload,
      order_items: itemsPayload,
    };
    localStorage.setItem(`lah_gabin_order_${safeOrderPayload.invoice_code}`, JSON.stringify(fullOrder));

    const existing: Order[] = JSON.parse(localStorage.getItem(FALLBACK_ORDERS_KEY) || '[]');
    const filtered = existing.filter((o) => o.id !== safeOrderPayload.id && o.invoice_code !== safeOrderPayload.invoice_code);
    localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify([fullOrder, ...filtered]));
  } catch {}

  return { success: true, data: safeOrderPayload };
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
