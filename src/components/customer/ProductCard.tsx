'use client';

import { Product } from '@/types';
import { formatRupiah, getActivePrice, getStockLabel } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { Plus, Image as ImageIcon } from 'lucide-react';
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
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-neutral-800/80 overflow-hidden flex flex-col hover:shadow-lg hover:shadow-blue-500/5 dark:hover:border-neutral-700 transition-all duration-200 group">
      {/* Image Area */}
      <div className="relative aspect-square bg-slate-100 dark:bg-neutral-800/80 overflow-hidden flex items-center justify-center">
        {imgSrc && imgSrc !== '/placeholder-gabin.jpg' ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs ${
              stockLabel === 'ready'
                ? 'bg-emerald-600/90 text-white'
                : 'bg-amber-600/90 text-white'
            }`}
          >
            {stockLabel === 'ready' ? 'Ready' : 'Pre-Order'}
          </span>
        )}

        {/* Promo Tag */}
        {hasDiscount && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
            PROMO
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex flex-col flex-1 gap-1.5">
        <div>
          <h3 className="font-heading font-bold text-xs sm:text-sm text-neutral-900 dark:text-white line-clamp-1 tracking-tight">
            {product.name}
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-0.5">
            {product.description || 'Es gabin aneka rasa, manis dan renyah.'}
          </p>
        </div>

        <div className="mt-auto pt-2.5 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-neutral-800/80">
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-neutral-900 dark:text-white text-sm">
              {formatRupiah(price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-neutral-400 line-through">
                {formatRupiah(product.base_price)}
              </span>
            )}
          </div>

          <button
            disabled={!canOrder}
            onClick={handleAdd}
            className={`w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all active:scale-90 shadow-md ${
              adding
                ? 'bg-emerald-600 scale-105'
                : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-blue-500/20'
            } ${!canOrder ? 'opacity-30 cursor-not-allowed bg-neutral-400 shadow-none' : ''}`}
            title={isShopClosed ? 'Toko tutup' : canOrder ? 'Tambah' : 'Stok habis'}
            aria-label="Tambah ke Keranjang"
          >
            {adding ? <span className="text-xs">✓</span> : <Plus size={15} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
