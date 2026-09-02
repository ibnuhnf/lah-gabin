'use client';

import { Product } from '@/types';
import { formatRupiah, getActivePrice, getStockLabel } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useStoreConfig } from '@/contexts/StoreContext';
import { ShoppingCart, Clock, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { config } = useStoreConfig();

  const { price, hasDiscount } = getActivePrice(
    product.base_price,
    product.discount_price,
    product.discount_start_date,
    product.discount_end_date
  );

  const stockLabel = getStockLabel(product.stock_quantity, product.status);
  const isShopClosed = !config?.is_open;
  const canOrder = !isShopClosed && stockLabel !== 'inactive';

  const imgSrc = product.image_urls?.[0] || '/placeholder-gabin.jpg';

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-neutral-100">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span
          className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
            stockLabel === 'ready'
              ? 'bg-success-500 text-white'
              : stockLabel === 'po'
                ? 'bg-warning-amber text-white'
                : 'bg-neutral-400 text-white'
          }`}
        >
          {stockLabel === 'ready' && (
            <span className="flex items-center gap-1"><Check size={12} /> Ready</span>
          )}
          {stockLabel === 'po' && (
            <span className="flex items-center gap-1"><Clock size={12} /> PO</span>
          )}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <h3 className="font-heading font-semibold text-sm text-neutral-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-neutral-500 line-clamp-2">{product.description}</p>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-heading font-bold text-brand-800 text-base">
              {formatRupiah(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through">
                {formatRupiah(product.base_price)}
              </span>
            )}
          </div>

          <button
            disabled={!canOrder}
            onClick={() => addItem(product)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent-500 text-white hover:bg-accent-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
