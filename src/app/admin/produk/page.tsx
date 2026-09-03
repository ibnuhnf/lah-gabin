'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, Image as ImageIcon, Upload, X, AlertCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/imageUpload';
import { Product } from '@/types';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Es Gabin Coklat', base_price: 5000, hpp_per_pcs: 775, stock_quantity: 25, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Renyah gabin topping coklat meises legit, segar dengan es batu.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '2', name: 'Es Gabin Keju', base_price: 5500, hpp_per_pcs: 800, stock_quantity: 20, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Perpaduan keju gurih dan gabin renyah, dingin menyegarkan.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '3', name: 'Es Gabin Susu', base_price: 5000, hpp_per_pcs: 700, stock_quantity: 30, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Susu kental manis melimpah, gabin lembut nan manis.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '4', name: 'Es Gabin Tiramisu', base_price: 7000, hpp_per_pcs: 1400, stock_quantity: 0, minimum_stock: 5, status: 'po_mode', image_urls: ['/placeholder-gabin.jpg'], description: 'Varian premium rasa tiramisu, kopi dan keju.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '5', name: 'Es Gabin Matcha', base_price: 6500, hpp_per_pcs: 1100, stock_quantity: 15, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Matcha asli Jepang dipadu susu creamy.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '6', name: 'Es Gabin Strawberry', base_price: 6000, hpp_per_pcs: 900, stock_quantity: 18, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Topping strawberry segar dan manis.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '7', name: 'Es Gabin Oreo', base_price: 6000, hpp_per_pcs: 950, stock_quantity: 0, minimum_stock: 5, status: 'po_mode', image_urls: ['/placeholder-gabin.jpg'], description: 'Crushed oreo dan krim vanilla.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '8', name: 'Es Gabin Original', base_price: 4000, hpp_per_pcs: 600, stock_quantity: 40, minimum_stock: 5, status: 'active', image_urls: ['/placeholder-gabin.jpg'], description: 'Original gabin renyah es, manis klasik.', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    stock_quantity: '',
    minimum_stock: '5',
    status: 'active' as 'active' | 'po_mode' | 'inactive',
    image_url: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load from Supabase / localStorage on mount
  useEffect(() => {
    async function load() {
      // Check local cache
      try {
        const local = localStorage.getItem('lah_gabin_admin_products');
        if (local) setProducts(JSON.parse(local));
      } catch {}

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');
          if (!error && data && data.length > 0) {
            setProducts(data);
            try { localStorage.setItem('lah_gabin_admin_products', JSON.stringify(data)); } catch {}
          }
        } catch (err) {
          console.warn('Load products fallback:', err);
        }
      }
    }
    load();
  }, []);

  const saveProductsState = (newList: Product[]) => {
    setProducts(newList);
    try {
      localStorage.setItem('lah_gabin_admin_products', JSON.stringify(newList));
    } catch {}
  };

  const openAddModal = () => {
    setEditProduct(null);
    setFormData({
      name: '',
      description: '',
      base_price: '',
      stock_quantity: '20',
      minimum_stock: '5',
      status: 'active',
      image_url: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      base_price: String(p.base_price),
      stock_quantity: String(p.stock_quantity),
      minimum_stock: String(p.minimum_stock || 5),
      status: p.status,
      image_url: p.image_urls?.[0] || '',
    });
    setModalOpen(true);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.base_price) return;

    setLoading(true);
    const numPrice = Number(formData.base_price) || 0;
    const numStock = Number(formData.stock_quantity) || 0;
    const numMin = Number(formData.minimum_stock) || 5;
    const imgUrls = formData.image_url ? [formData.image_url] : [];

    try {
      if (editProduct) {
        // Edit existing
        const updated: Product = {
          ...editProduct,
          name: formData.name,
          description: formData.description,
          base_price: numPrice,
          stock_quantity: numStock,
          minimum_stock: numMin,
          status: formData.status,
          image_urls: imgUrls,
          updated_at: new Date().toISOString(),
        };

        const newList = products.map((p) => (p.id === editProduct.id ? updated : p));
        saveProductsState(newList);

        if (isSupabaseConfigured()) {
          await supabase
            .from('products')
            .update({
              name: updated.name,
              description: updated.description,
              base_price: updated.base_price,
              stock_quantity: updated.stock_quantity,
              minimum_stock: updated.minimum_stock,
              status: updated.status,
              image_urls: updated.image_urls,
              updated_at: updated.updated_at,
            })
            .eq('id', editProduct.id);
        }
        setMessage('Produk berhasil diperbarui!');
      } else {
        // Add new
        const newProd: Product = {
          id: crypto.randomUUID(),
          name: formData.name,
          description: formData.description,
          base_price: numPrice,
          hpp_per_pcs: 0,
          stock_quantity: numStock,
          minimum_stock: numMin,
          status: formData.status,
          image_urls: imgUrls,
          discount_price: null,
          discount_start_date: null,
          discount_end_date: null,
          unit: 'pcs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newList = [newProd, ...products];
        saveProductsState(newList);

        if (isSupabaseConfigured()) {
          await supabase.from('products').insert([newProd]);
        }
        setMessage('Produk baru berhasil ditambahkan!');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    const newList = products.filter((p) => p.id !== id);
    saveProductsState(newList);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete error:', err);
      }
    }
    setDeleteConfirm(null);
    setMessage('Produk berhasil dihapus');
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleStatus = async (p: Product) => {
    const cycle: ('active' | 'po_mode' | 'inactive')[] = ['active', 'po_mode', 'inactive'];
    const next = cycle[(cycle.indexOf(p.status) + 1) % cycle.length];
    const updated = { ...p, status: next };

    const newList = products.map((item) => (item.id === p.id ? updated : item));
    saveProductsState(newList);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').update({ status: next }).eq('id', p.id);
      } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-3">
          <Check size={16} />
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white tracking-tight">
            Manajemen Produk & Foto
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Kelola katalog rasa, foto gabin, harga jual, dan status ketersediaan.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary text-sm shadow-md"
        >
          <Plus size={18} /> Tambah Produk Baru
        </button>
      </div>

      {/* Product Table Card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold">Produk & Foto</th>
                <th className="text-right px-4 py-3.5 font-semibold">Harga Jual</th>
                <th className="text-right px-4 py-3.5 font-semibold">HPP</th>
                <th className="text-right px-4 py-3.5 font-semibold">Stok</th>
                <th className="text-center px-4 py-3.5 font-semibold">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {products.map((p) => {
                const img = p.image_urls?.[0] || '';
                return (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-neutral-400 line-clamp-1">{p.description || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatRupiah(p.base_price)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-neutral-500">
                      {formatRupiah(p.hpp_per_pcs)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">
                      <span className={p.stock_quantity <= (p.minimum_stock || 5) ? 'text-rose-500 font-bold' : 'text-neutral-900 dark:text-neutral-200'}>
                        {p.stock_quantity} pcs
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleStatus(p)}
                        title="Klik untuk ubah status"
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-all active:scale-95 ${
                          p.status === 'active' ? 'badge-ready' :
                          p.status === 'po_mode' ? 'badge-po' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {p.status === 'active' ? '● Ready' : p.status === 'po_mode' ? '● PO Mode' : '○ Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors"
                          title="Edit Produk & Foto"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-neutral-200/80 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-heading font-bold text-xl text-neutral-900 dark:text-white">
                {editProduct ? 'Edit Produk & Foto' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center hover:bg-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Foto Produk
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-neutral-400" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white font-bold">
                        Loading...
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload size={14} />
                      {uploadingImage ? 'Mengunggah...' : 'Pilih Foto dari HP/Laptop'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFile}
                        disabled={uploadingImage}
                      />
                    </label>
                    <p className="text-[11px] text-neutral-400">Format JPG, PNG atau WebP (Maks 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Es Gabin Coklat Keju"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  placeholder="Paduan rasa coklat lezat dan biskuit renyah..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Stok Saat Ini (pcs)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input-field"
                >
                  <option value="active">Active (Siap Dijual / Ready Stock)</option>
                  <option value="po_mode">PO Mode (Pre-Order)</option>
                  <option value="inactive">Nonaktif (Disembunyikan dari Toko)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="flex-1 btn-primary text-sm font-semibold shadow-md"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg text-neutral-900 dark:text-white mb-1">
              Hapus Produk?
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Apakah Anda yakin ingin menghapus produk <strong>{deleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
