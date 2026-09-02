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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full">
      {/* Product Grid */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-neutral-900 mb-4 flex items-center gap-2">
          <ShoppingBag size={22} /> POS / Kasir Internal
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOCK_PRODUCTS.filter((p) => p.stock_quantity > 0).map((product) => {
            const { price } = getActivePrice(product.base_price, product.discount_price, product.discount_start_date, product.discount_end_date);
            const inCart = cart.find((i) => i.productId === product.id);
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                  inCart ? 'border-brand-600 bg-brand-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <p className="font-heading font-semibold text-sm text-neutral-900">{product.name}</p>
                <p className="text-brand-800 font-bold text-base mt-1">{formatRupiah(price)}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Stok: {product.stock_quantity}</p>
                {inCart && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-brand-700 font-bold mt-1">
                    <Check size={10} /> x{inCart.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-4 h-fit sticky top-6">
        <h2 className="font-heading font-bold text-base">Keranjang POS</h2>

        {cart.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">Pilih produk di sebelah kiri.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-neutral-400">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="qty-stepper-btn !w-7 !h-7 text-xs"><Minus size={12} /></button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="qty-stepper-btn !w-7 !h-7 text-xs"><Plus size={12} /></button>
                  <button onClick={() => updateQty(item.productId, 0)} className="text-danger-500 ml-1"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <>
            <hr className="border-neutral-100" />

            <div className="space-y-2 text-sm">
              <input
                type="text"
                placeholder="Nama customer (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Diskon nominal (Rp)"
                value={discountNominal}
                onChange={(e) => setDiscountNominal(e.target.value)}
                className="input-field py-2 text-sm"
                min={0}
              />
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                {(['CASH', 'TRANSFER', 'QRIS'] as PaymentMethod[]).map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${paymentMethod === pm ? 'bg-white shadow-xs font-bold text-brand-900' : 'text-neutral-600'}`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-success-500">Diskon</span><span className="text-success-500">- {formatRupiah(discount)}</span></div>}
              <div className="flex justify-between font-heading font-bold text-base border-t border-neutral-100 pt-1">
                <span>Total</span>
                <span className="text-accent-500">{formatRupiah(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full btn-primary"
            >
              Proses Transaksi
            </button>
          </>
        )}

        {successMsg && (
          <p className="text-sm text-center text-success-500 font-semibold bg-green-50 py-2 rounded-lg">
            ✓ {successMsg}
          </p>
        )}
      </div>
    </div>
  );
}
