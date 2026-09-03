'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from '@/types';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import ProductCard from '@/components/customer/ProductCard';
import { useStoreConfig } from '@/contexts/StoreContext';
import { Search, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Es Gabin Coklat',
    description: 'Renyah gabin topping coklat meises legit, segar dengan es batu.',
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
    description: 'Perpaduan keju gurih dan gabin renyah, dingin menyegarkan.',
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
    description: 'Susu kental manis melimpah, gabin lembut nan manis.',
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
    description: 'Varian premium rasa tiramisu, perpaduan kopi dan keju.',
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
    description: 'Matcha asli dipadu susu creamy dan biskuit gabin.',
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
    description: 'Topping strawberry segar manis bikin nagih.',
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
    description: 'Crushed oreo dan krim vanilla gurih lezat.',
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
    description: 'Original gabin renyah es, rasa manis klasik masa kecil.',
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
    // Try localStorage cache first for instant sync
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
      {/* Closed Banner Warning */}
      {!isOpen && (
        <div className="bg-rose-500/10 dark:bg-rose-950/40 border-b border-rose-500/20 px-4 py-2.5 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
          <AlertCircle size={15} />
          Saat ini toko sedang tutup. Anda tetap dapat melihat menu, pemesanan akan dibuka kembali segera.
        </div>
      )}

      {/* Hero Section (iOS Modern Minimalist) */}
      <section className="relative px-4 pt-10 pb-8 sm:pt-14 sm:pb-12 text-center overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent-500/10 dark:bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold border border-neutral-200/80 dark:border-neutral-700 shadow-2xs">
            <Sparkles size={13} className="text-accent-500" />
            <span>Aneka Varian Es Gabin Kekinian</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
            Dingin di Hati, <br />
            <span className="text-accent-500">Renyah di Lidah.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mt-1">
            Paduan vla susu lembut, biskuit renyah, dan aneka topping istimewa. Nikmati kesegaran es gabin kapan saja.
          </p>

          <div className="flex gap-3 mt-3">
            <a
              href="#katalog"
              className="btn-primary text-sm shadow-md"
            >
              <ShoppingBag size={17} /> Pesan Sekarang
            </a>
            <Link
              href="/pemesanan"
              className="px-5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-semibold transition-all border border-neutral-200/60 dark:border-neutral-700"
            >
              Cek Status Order
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog & Search Section */}
      <div id="katalog" className="max-w-3xl mx-auto px-4 py-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <h2 className="font-heading font-extrabold text-xl text-neutral-900 dark:text-white w-full sm:w-auto">
            Daftar Menu
          </h2>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            {/* Search Input (Pill iOS style) */}
            <div className="relative flex-1 sm:w-56">
              <Search size={15} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari rasa gabin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Segment Controls */}
            <div className="flex bg-neutral-200/70 dark:bg-neutral-800/80 p-1 rounded-full gap-1 self-start sm:self-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                  filter === 'all'
                    ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                  filter === 'ready'
                    ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setFilter('po')}
                className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all ${
                  filter === 'po'
                    ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                PO
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-neutral-400 text-sm">
            Tidak ada produk yang cocok dengan pencarian &quot;{search}&quot;.
          </div>
        )}
      </div>
    </CustomerPageWrapper>
  );
}
