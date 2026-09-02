'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import CustomerPageWrapper from '@/components/customer/CustomerPageWrapper';
import ProductCard from '@/components/customer/ProductCard';
import { useStoreConfig } from '@/contexts/StoreContext';
import { Search, ShoppingBag } from 'lucide-react';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Es Gabin Coklat',
    description: 'Renyah gabin topping coklat meises legit, segar dengan es batu.',
    base_price: 5000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 25,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
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
    hpp_per_pcs: 0,
    stock_quantity: 20,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
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
    hpp_per_pcs: 0,
    stock_quantity: 30,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: '4',
    name: 'Es Gabin Tiramisu',
    description: 'Varian premium rasa tiramisu, kopi dan keju.',
    base_price: 7000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'po_mode',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: '5',
    name: 'Es Gabin Matcha',
    description: 'Matcha asli Jepang dipadu susu creamy.',
    base_price: 6500,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 15,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: '6',
    name: 'Es Gabin Strawberry',
    description: 'Topping strawberry segar dan manis.',
    base_price: 6000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 18,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: '7',
    name: 'Es Gabin Oreo',
    description: 'Crushed oreo dan krim vanilla.',
    base_price: 6000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'po_mode',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: '8',
    name: 'Es Gabin Original',
    description: 'Original gabin renyah es, manis klasik.',
    base_price: 4000,
    discount_price: null,
    discount_start_date: null,
    discount_end_date: null,
    hpp_per_pcs: 0,
    stock_quantity: 40,
    minimum_stock: 5,
    unit: 'pcs',
    status: 'active',
    image_urls: [],
    created_at: '',
    updated_at: '',
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'po'>('all');
  const { config } = useStoreConfig();

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .neq('status', 'inactive')
          .order('name');
        if (!error && data && data.length > 0) {
          setProducts(data);
        }
      } catch {
        // Fallback already in state
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
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-brand-100">
            <span>🧊 Es Gabin Kekinian</span>
            <span>•</span>
            <span>{config?.is_open ? 'Toko Buka' : 'Toko Tutup'}</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Dingin di Hati, <br />
            <span className="text-accent-500">Renyah di Lidah!</span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100 max-w-md">
            Es Gabin aneka rasa dengan paduan vla lembut, gurih manis, dan biskuit renyah. Pesan sekarang untuk dinikmati bersama!
          </p>

          <div className="flex gap-3 mt-2">
            <a
              href="#katalog"
              className="btn-primary text-sm flex items-center gap-2"
            >
              <ShoppingBag size={16} /> Pesan Sekarang
            </a>
            <Link
              href="/pemesanan"
              className="px-4 py-2.5 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cek Status Order
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog & Search */}
      <div id="katalog" className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl text-neutral-900 w-full sm:w-auto">
            Daftar Menu
          </h2>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari rasa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex bg-neutral-100 p-1 rounded-xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-white shadow-xs font-bold text-brand-900' : 'text-neutral-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filter === 'ready' ? 'bg-white shadow-xs font-bold text-brand-900' : 'text-neutral-600'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setFilter('po')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filter === 'po' ? 'bg-white shadow-xs font-bold text-brand-900' : 'text-neutral-600'
                }`}
              >
                PO
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        )}
      </div>
    </CustomerPageWrapper>
  );
}
