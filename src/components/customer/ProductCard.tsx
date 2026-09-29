'use client';

import { Product } from '@/types';
import { formatRupiah, getActivePrice, getStockLabel } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { Plus, Image as ImageIcon, Check } from 'lucide-react';
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
    setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800/80 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-neutral-700 transition-all duration-150 group">
      {/* Image Area */}
      <div className="relative aspect-square bg-slate-100 dark:bg-neutral-800/80 overflow-hidden flex items-center justify-center">
        {imgSrc && imgSrc !== '/placeholder-gabin.jpg' ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500 gap-1">
            <ImageIcon size={28} strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Lah Gabin</span>
          </div>
        )}

        {/* Status Badge */}
        {stockLabel !== 'inactive' && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              stockLabel === 'ready'
                ? 'bg-emerald-600/95 text-white'
                : 'bg-amber-600/95 text-white'
            }`}
          >
            {stockLabel === 'ready' ? 'Ready' : 'Pre-Order'}
          </span>
        )}

        {/* Promo Tag */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white">
            PROMO
          </span>
        )}

        {/* Box Sisa Stok di dalam kotak gambar tepat di atas nama produk */}
        {stockLabel === 'ready' && (
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/85 dark:bg-black/85 text-white text-[11px] font-bold border border-white/15">
            <span className="text-slate-300 dark:text-neutral-300 font-medium text-[10px]">Sisa Stok :</span>
            <span className="text-emerald-400 font-extrabold">{product.stock_quantity ?? 0}</span>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <div>
          <h3 className="font-heading font-bold text-xs sm:text-sm text-neutral-900 dark:text-white line-clamp-1 tracking-tight">
            {product.name}
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-0.5">
            {product.description || 'Es gabin aneka rasa, manis dan renyah.'}
          </p>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-neutral-800/80">
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-neutral-900 dark:text-white text-sm tabular-nums">
              {formatRupiah(price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-neutral-400 line-through tabular-nums">
                {formatRupiah(product.base_price)}
              </span>
            )}
          </div>

          <button
            disabled={!canOrder}
            onClick={handleAdd}
            className={`w-9 h-9 rounded-lg text-white flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              adding ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-accent-600'
            } ${!canOrder ? 'opacity-40 cursor-not-allowed bg-neutral-400 shadow-none' : ''}`}
            title={isShopClosed ? 'Toko tutup' : canOrder ? 'Tambah' : 'Stok habis'}
            aria-label="Tambah ke Keranjang"
          >
            {adding ? <Check size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
