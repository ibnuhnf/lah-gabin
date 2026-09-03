'use client';

import { Product } from '@/types';
import { formatRupiah, getActivePrice, getStockLabel } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { ShoppingBag, Plus } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { config } = useStoreConfig();
  const [adding, setAdding] = useState(false);

  const { price, hasDiscount } = getActivePrice(
    product.base_price,
    product.discount_price,
    product.discount_start_date,
    product.discount_end_date
  );

  const stockLabel = getStockLabel(product.stock_quantity, product.status);
  const isShopClosed = !config?.is_open;
  const canOrder = !isShopClosed && stockLabel !== 'inactive';

  const imgSrc = product.image_urls?.[0] || '';

  const handleAdd = () => {
    if (!canOrder) return;
    setAdding(true);
    addItem(product);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/70 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
      {/* Image Area */}
      <div className="relative aspect-square bg-gradient-to-br from-brand-100 to-brand-50 dark:from-neutral-800 dark:to-neutral-900 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-50">
            🧊
          </div>
        )}

        {/* Status Badge */}
        {stockLabel !== 'inactive' && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm ${
              stockLabel === 'ready'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}
          >
            {stockLabel === 'ready' ? '● Ready' : '● PO'}
          </span>
        )}

        {/* Discount Tag */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-sm">
            PROMO
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 tracking-tight">
            {product.name}
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug mt-0.5">
            {product.description || 'Es gabin kekinian, renyah dan manis.'}
          </p>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-neutral-900 dark:text-white text-base">
              {formatRupiah(price)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatRupiah(product.base_price)}
              </span>
            )}
          </div>

          <button
            disabled={!canOrder}
            onClick={handleAdd}
            className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center transition-all active:scale-90 ${
              adding ? 'bg-emerald-500 scale-110' : 'bg-accent-500 hover:bg-accent-600'
            } ${!canOrder ? 'opacity-30 cursor-not-allowed bg-neutral-400' : ''}`}
            title={isShopClosed ? 'Toko sedang tutup' : canOrder ? 'Tambah ke Keranjang' : 'Produk tidak tersedia'}
            aria-label="Tambah ke Keranjang"
          >
            {adding ? <span className="text-xs">✓</span> : <Plus size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
