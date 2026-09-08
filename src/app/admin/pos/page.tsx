'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { formatRupiah, getActivePrice } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Product } from '@/types';

type CartItem = { productId: string; name: string; price: number; quantity: number };
type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';

export default function AdminPOSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    function loadFromLocal() {
      try {
        const local = localStorage.getItem('lah_gabin_admin_products');
        if (local) {
          setProducts(JSON.parse(local));
          setLoading(false);
        }
      } catch {}
    }

    loadFromLocal();

    async function loadFromDB() {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.from('products').select('*');
          if (data && data.length > 0) {
            setProducts(data);
            try { localStorage.setItem('lah_gabin_admin_products', JSON.stringify(data)); } catch {}
          }
        } catch {}
      }
      setLoading(false);
    }

    loadFromDB();

    const onFocus = () => { loadFromLocal(); loadFromDB(); };
    window.addEventListener('focus', onFocus);

    function syncFromStorage(e: StorageEvent) {
      if (e.key === 'lah_gabin_admin_products' && e.newValue) {
        try { setProducts(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountNominal, setDiscountNominal] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Math.min(Number(discountNominal) || 0, subtotal);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (product: Product) => {
    const { price } = getActivePrice(product.base_price, product.discount_price, product.discount_start_date, product.discount_end_date);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.productId !== productId));
    else setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleSubmit = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const invoiceCode = `POS-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const orderId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const orderItems = cart.map((ci) => {
        const product = products.find((p) => p.id === ci.productId);
        return {
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: ci.productId,
          product_name: ci.name,
          price_snapshot: ci.price,
          quantity: ci.quantity,
          subtotal: ci.price * ci.quantity,
          created_at: createdAt,
        };
      });

      const fullOrder = {
        id: orderId,
        invoice_code: invoiceCode,
        customer_name: customerName.trim() || 'Walk-in POS',
        customer_wa: null,
        customer_notes: null,
        customer_address: 'POS (langsung di kasir)',
        delivery_zone: 'POS',
        delivery_fee: 0,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: total,
        payment_method: paymentMethod,
        status: 'SELESAI' as const,
        voucher_id: null,
        order_source: 'POS' as const,
        created_at: createdAt,
        items: orderItems,
        order_items: orderItems,
      };

      // 1) Save order ke localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('lah_gabin_admin_orders') || '[]');
        localStorage.setItem('lah_gabin_admin_orders', JSON.stringify([fullOrder, ...existing]));
        localStorage.setItem(`lah_gabin_order_${invoiceCode}`, JSON.stringify(fullOrder));
      } catch {}

      // 2) Catat kas IN
      try {
        const existingCash = JSON.parse(localStorage.getItem('lah_gabin_cash_transactions') || '[]');
        const cashTx = {
          id: crypto.randomUUID(),
          type: 'IN' as const,
          amount: total,
          category: 'PENJUALAN_POS',
          description: `Penjualan POS ${invoiceCode}${customerName.trim() ? ` - ${customerName.trim()}` : ''}`,
          time: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        localStorage.setItem('lah_gabin_cash_transactions', JSON.stringify([cashTx, ...existingCash]));
      } catch {}

      // 3) Kurangi stok produk di localStorage
      try {
        const savedProducts = JSON.parse(localStorage.getItem('lah_gabin_admin_products') || '[]');
        const updatedProducts = savedProducts.map((p: Product) => {
          const cartItem = cart.find((c) => c.productId === p.id);
          if (cartItem) {
            return { ...p, stock_quantity: Math.max(0, (p.stock_quantity || 0) - cartItem.quantity) };
          }
          return p;
        });
        localStorage.setItem('lah_gabin_admin_products', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
      } catch {}

      // 4) Sync ke Supabase jika configured (graceful fallback)
      if (isSupabaseConfigured()) {
        try {
          const orderData = {
            id: orderId,
            invoice_code: invoiceCode,
            customer_name: fullOrder.customer_name,
            customer_wa: null,
            customer_notes: null,
            customer_address: fullOrder.customer_address,
            delivery_zone: 'POS',
            delivery_fee: 0,
            total_amount: subtotal,
            discount_amount: discount,
            final_amount: total,
            payment_method: paymentMethod,
            status: 'SELESAI',
            voucher_id: null,
            order_source: 'POS',
            created_at: createdAt,
          };
          const { data: dbOrder, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .maybeSingle();
          if (!orderError && dbOrder) {
            await supabase.from('order_items').insert(orderItems);
          }

          // Update stok di Supabase juga
          for (const ci of cart) {
            const prod = products.find((p) => p.id === ci.productId);
            if (prod) {
              await supabase
                .from('products')
                .update({ stock_quantity: Math.max(0, (prod.stock_quantity || 0) - ci.quantity) })
                .eq('id', ci.productId);
            }
          }
        } catch (err) {
          console.warn('Supabase POS sync fallback:', err);
        }
      }

      setSuccessMsg(`Transaksi POS berhasil! Invoice: ${invoiceCode} · Total: ${formatRupiah(total)}`);
      setCart([]);
      setDiscountNominal('');
      setCustomerName('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('POS submit error:', err);
      setSuccessMsg('Transaksi gagal, coba lagi.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 h-full">
      {/* Product Grid */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight mb-4 flex items-center gap-2.5">
          <ShoppingBag size={24} className="text-accent-500" /> POS / Kasir Kas
        </h1>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-neutral-400" />
          </div>
        ) : products.filter((p) => p.status !== 'inactive').length === 0 ? (
          <div className="text-center py-20 text-sm text-neutral-400">Belum ada produk terdaftar. Tambahkan produk di menu Produk &amp; Foto.</div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.filter((p) => p.status !== 'inactive').map((product) => {
            const { price } = getActivePrice(product.base_price, product.discount_price, product.discount_start_date, product.discount_end_date);
            const inCart = cart.find((i) => i.productId === product.id);
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${
                  inCart
                    ? 'border-accent-500 bg-accent-50/40 dark:bg-accent-950/20'
                    : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                <p className="font-heading font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">{product.name}</p>
                <p className="text-neutral-900 dark:text-white font-extrabold text-base mt-1">{formatRupiah(price)}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stok: {product.stock_quantity}</p>
                {inCart && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-accent-600 dark:text-accent-400 font-bold mt-1 bg-accent-500/10 px-2 py-0.5 rounded-full">
                    <Check size={10} /> x{inCart.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Cart & Checkout */}
      <div className="card p-5 flex flex-col gap-4 h-fit sticky top-6">
        <h2 className="font-heading font-bold text-base text-neutral-900 dark:text-white">Keranjang POS</h2>

        {cart.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-8">Klik menu di sebelah kiri untuk menambah ke kasir.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-xs py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-neutral-400 font-medium">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="qty-stepper-btn !w-6 !h-6"><Minus size={11} /></button>
                  <span className="w-5 text-center font-bold text-neutral-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="qty-stepper-btn !w-6 !h-6"><Plus size={11} /></button>
                  <button onClick={() => updateQty(item.productId, 0)} className="text-rose-500 ml-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-lg"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <>
            <hr className="border-neutral-100 dark:border-neutral-800" />

            <div className="space-y-2.5 text-xs">
              <input
                type="text"
                placeholder="Nama customer (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Diskon potongan (Rp)"
                value={discountNominal}
                onChange={(e) => setDiscountNominal(e.target.value)}
                className="input-field"
                min={0}
              />
              <div className="flex bg-neutral-200/80 dark:bg-neutral-800 p-1 rounded-xl gap-1">
                {(['CASH', 'TRANSFER', 'QRIS'] as PaymentMethod[]).map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      paymentMethod === pm
                        ? 'bg-white dark:bg-neutral-900 shadow-xs font-bold text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold"><span>Diskon</span><span>- {formatRupiah(discount)}</span></div>}
              <div className="flex justify-between font-heading font-extrabold text-sm border-t border-neutral-100 dark:border-neutral-800 pt-2 text-neutral-900 dark:text-white">
                <span>Total</span>
                <span className="text-accent-500">{formatRupiah(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Memproses Transaksi...
                </>
              ) : (
                'Selesaikan Transaksi POS'
              )}
            </button>
          </>
        )}

        {successMsg && (
          <div className="text-xs text-center text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}
