'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from '@/types';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import ProductCard from '@/components/customer/ProductCard';
import { useStoreConfig } from '@/contexts/StoreContext';
import { Search, ShoppingBag, AlertCircle, Sparkles } from 'lucide-react';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Es Gabin Coklat',
    description: 'Biskuit gabin renyah dengan isian fla coklat lembut manis.',
    base_price: 5000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 775,
    stock_quantity: 25,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    name: 'Es Gabin Keju',
    description: 'Paduan keju gurih creamy dan biskuit renyah dingin.',
    base_price: 5500,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 800,
    stock_quantity: 20,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '3',
    name: 'Es Gabin Susu',
    description: 'Susu manis legit dengan sensasi dingin menyegarkan.',
    base_price: 5000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 700,
    stock_quantity: 30,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '4',
    name: 'Es Gabin Tiramisu',
    description: 'Varian premium rasa tiramisu dengan aroma kopi khas.',
    base_price: 7000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 1400,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'po_mode',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '5',
    name: 'Es Gabin Matcha',
    description: 'Matcha otentik berpadu susu lembut dan biskuit.',
    base_price: 6500,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 1100,
    stock_quantity: 15,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '6',
    name: 'Es Gabin Strawberry',
    description: 'Topping fla strawberry segar dengan rasa manis alami.',
    base_price: 6000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 900,
    stock_quantity: 18,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '7',
    name: 'Es Gabin Oreo',
    description: 'Remukan biskuit oreo dan krim vanilla gurih.',
    base_price: 6000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 950,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'po_mode',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
  {
    id: '8',
    name: 'Es Gabin Original',
    description: 'Cita rasa klasik gabin legendaris yang manis renyah.',
    base_price: 4000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 600,
    stock_quantity: 40,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: ['/placeholder-gabin.jpg'],
    created_at: '',
    updated_at: '',
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'po'>('all');
  const { config } = useStoreConfig();
  const isOpen = Boolean(config?.is_open);

  useEffect(() => {
    try {
      const local = localStorage.getItem('lah_gabin_admin_products');
      if (local) {
        const parsed: Product[] = JSON.parse(local);
        if (parsed.length > 0) setProducts(parsed);
      }
    } catch {}

    async function loadProducts() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .neq('status', 'inactive')
            .order('name');
          if (!error && data && data.length > 0) {
            setProducts(data);
          }
        } catch {}
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'ready') return p.status === 'active' && p.stock_quantity > 0;
    if (filter === 'po') return p.status === 'po_mode' || p.stock_quantity === 0;
    return true;
  });

  return (
    <CustomerPageWrapper>
      {/* Closed Notice */}
      {!isOpen && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-4 py-2.5 text-center text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          Saat ini toko sedang tutup. Pemesanan akan dibuka kembali segera.
        </div>
      )}

      {/* Hero Header with Soft Blue Ambient Glow */}
      <section className="relative px-4 pt-10 pb-8 sm:pt-16 sm:pb-12 text-center max-w-2xl mx-auto overflow-hidden">
        {/* Soft Blue Radial Gradient Backdrop (Photo 2 Reference) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-400/20 via-sky-300/15 to-indigo-400/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold mb-4 shadow-xs">
          <Sparkles size={13} className="text-blue-500" />
          <span>Es Gabin Premium Renyah & Lembut</span>
        </div>

        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-neutral-900 dark:text-white tracking-tight leading-tight">
          Cita Rasa Manis Dingin <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
            Lah Gabin
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
          Biskuit gabin renyah dengan isian fla aneka varian rasa, dibuat fresh setiap hari.
        </p>

        <div className="flex justify-center gap-3 mt-6">
          <a href="#menu" className="btn-primary text-xs py-2.5 px-5 shadow-lg shadow-blue-500/25">
            <ShoppingBag size={14} /> Lihat Menu
          </a>
          <Link
            href="/pemesanan"
            className="btn-secondary text-xs py-2.5 px-5"
          >
            Lacak Pesanan
          </Link>
        </div>
      </section>

      {/* Menu Catalog */}
      <div id="menu" className="max-w-3xl mx-auto px-4 py-4">
        {/* Search & Segmented Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari varian rasa kesukaanmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-10 py-2.5 text-xs shadow-xs"
            />
          </div>

          <div className="flex bg-slate-200/70 dark:bg-neutral-800/90 p-1 rounded-2xl gap-1 self-start sm:self-auto border border-slate-300/40 dark:border-neutral-700/60">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-neutral-900 shadow-xs text-blue-600 dark:text-white font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filter === 'ready'
                  ? 'bg-white dark:bg-neutral-900 shadow-xs text-blue-600 dark:text-white font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Ready Stock
            </button>
            <button
              onClick={() => setFilter('po')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                filter === 'po'
                  ? 'bg-white dark:bg-neutral-900 shadow-xs text-blue-600 dark:text-white font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Pre-Order
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="card p-10 text-center text-neutral-400 text-xs">
            Tidak ditemukan varian yang cocok dengan &quot;{search}&quot;.
          </div>
        )}
      </div>
    </CustomerPageWrapper>
  );
}
