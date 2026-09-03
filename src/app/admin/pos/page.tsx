'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { formatRupiah, getActivePrice } from '@/lib/utils';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Es Gabin Coklat', base_price: 5000, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 25, status: 'active' as const, hpp_per_pcs: 775, unit: 'pcs' },
  { id: '2', name: 'Es Gabin Keju', base_price: 5500, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 20, status: 'active' as const, hpp_per_pcs: 800, unit: 'pcs' },
  { id: '3', name: 'Es Gabin Susu', base_price: 5000, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 30, status: 'active' as const, hpp_per_pcs: 720, unit: 'pcs' },
  { id: '5', name: 'Es Gabin Matcha', base_price: 6500, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 15, status: 'active' as const, hpp_per_pcs: 1200, unit: 'pcs' },
  { id: '6', name: 'Es Gabin Strawberry', base_price: 6000, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 18, status: 'active' as const, hpp_per_pcs: 900, unit: 'pcs' },
  { id: '8', name: 'Es Gabin Original', base_price: 4000, discount_price: null, discount_start_date: null, discount_end_date: null, stock_quantity: 40, status: 'active' as const, hpp_per_pcs: 600, unit: 'pcs' },
];

type CartItem = { productId: string; name: string; price: number; quantity: number };
type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';

export default function AdminPOSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountNominal, setDiscountNominal] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [customerName, setCustomerName] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Math.min(Number(discountNominal) || 0, subtotal);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (product: typeof MOCK_PRODUCTS[number]) => {
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

  const handleSubmit = () => {
    if (cart.length === 0) return;
    setSuccessMsg(`Transaksi POS berhasil! Total: ${formatRupiah(total)}`);
    setCart([]);
    setDiscountNominal('');
    setCustomerName('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 h-full">
      {/* Product Grid */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight mb-4 flex items-center gap-2.5">
          <ShoppingBag size={24} className="text-accent-500" /> POS / Kasir Kas
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOCK_PRODUCTS.filter((p) => p.stock_quantity > 0).map((product) => {
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
              className="w-full btn-primary text-xs py-2.5"
            >
              Selesaikan Transaksi POS
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
