'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Es Gabin Coklat', base_price: 5000, hpp_per_pcs: 775, stock_quantity: 25, minimum_stock: 5, status: 'active', image_urls: [], description: '', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '2', name: 'Es Gabin Keju', base_price: 5500, hpp_per_pcs: 800, stock_quantity: 20, minimum_stock: 5, status: 'active', image_urls: [], description: '', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '4', name: 'Es Gabin Tiramisu', base_price: 7000, hpp_per_pcs: 1400, stock_quantity: 0, minimum_stock: 5, status: 'po_mode', image_urls: [], description: '', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '7', name: 'Es Gabin Oreo', base_price: 6000, hpp_per_pcs: 950, stock_quantity: 0, minimum_stock: 5, status: 'po_mode', image_urls: [], description: '', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
  { id: '8', name: 'Es Gabin Original', base_price: 4000, hpp_per_pcs: 600, stock_quantity: 40, minimum_stock: 5, status: 'active', image_urls: [], description: '', discount_price: null, discount_start_date: null, discount_end_date: null, unit: 'pcs', created_at: '', updated_at: '' },
];

const STATUS_OPTIONS = ['active', 'po_mode', 'inactive'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState(false);
  const [form, setForm] = useState({ name: '', base_price: '', stock_quantity: '', status: 'active' });

  const startEdit = (p: typeof MOCK_PRODUCTS[number]) => {
    setEditId(p.id);
    setEditData({
      name: p.name,
      base_price: String(p.base_price),
      stock_quantity: String(p.stock_quantity),
      minimum_stock: String(p.minimum_stock),
    });
  };

  const saveEdit = (id: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? {
      ...p,
      name: editData.name,
      base_price: Number(editData.base_price),
      stock_quantity: Number(editData.stock_quantity),
      minimum_stock: Number(editData.minimum_stock),
    } : p));
    setEditId(null);
  };

  const addProduct = () => {
    if (!form.name || !form.base_price) return;
    setProducts((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: form.name,
      base_price: Number(form.base_price),
      hpp_per_pcs: 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      minimum_stock: 5,
      status: form.status as 'active',
      image_urls: [],
      description: '',
      discount_price: null,
      discount_start_date: null,
      discount_end_date: null,
      unit: 'pcs',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    setNewProduct(false);
    setForm({ name: '', base_price: '', stock_quantity: '', status: 'active' });
  };

  const toggleStatus = (id: string) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const cycle = ['active', 'po_mode', 'inactive'];
      const next = cycle[(cycle.indexOf(p.status) + 1) % cycle.length];
      return { ...p, status: next };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-neutral-900">Manajemen Produk</h1>
          <p className="text-sm text-neutral-500">{products.length} produk.</p>
        </div>
        <button
          onClick={() => setNewProduct(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {newProduct && (
        <div className="card p-5 border-2 border-brand-500">
          <h3 className="font-heading font-semibold text-sm mb-3">Produk Baru</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="Nama produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field py-2 text-sm col-span-2" />
            <input type="number" placeholder="Harga Jual (Rp)" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input-field py-2 text-sm" />
            <input type="number" placeholder="Stok awal" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field py-2 text-sm" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field py-2 text-sm">
              <option value="active">Active</option>
              <option value="po_mode">PO Mode</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addProduct} className="btn-primary text-sm">Simpan</button>
            <button onClick={() => setNewProduct(false)} className="px-4 py-2 rounded-xl border border-neutral-300 text-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Produk</th>
              <th className="text-right px-4 py-3 font-semibold">Harga Jual</th>
              <th className="text-right px-4 py-3 font-semibold">HPP</th>
              <th className="text-right px-4 py-3 font-semibold">Stok</th>
              <th className="text-center px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-right font-medium">{formatRupiah(p.base_price)}</td>
                <td className="px-4 py-3 text-right text-neutral-500">{formatRupiah(p.hpp_per_pcs)}</td>
                <td className="px-4 py-3 text-right">
                  {editId === p.id ? (
                    <input
                      type="number"
                      value={editData.stock_quantity}
                      onChange={(e) => setEditData({ ...editData, stock_quantity: e.target.value })}
                      className="w-20 border border-neutral-300 rounded-lg px-2 py-1 text-right text-sm"
                    />
                  ) : (
                    <span className={p.stock_quantity <= p.minimum_stock ? 'text-danger-500 font-bold' : 'text-neutral-900'}>
                      {p.stock_quantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStatus(p.id)}
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.status === 'active' ? 'badge-ready' :
                      p.status === 'po_mode' ? 'badge-po' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {p.status === 'active' ? 'Ready' : p.status === 'po_mode' ? 'PO' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === p.id ? (
                    <button onClick={() => saveEdit(p.id)} className="text-success-500"><Check size={16} /></button>
                  ) : (
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => startEdit(p)} className="text-neutral-500 hover:text-brand-700"><Pencil size={15} /></button>
                      <button className="text-danger-500 hover:text-red-700"><Trash2 size={15} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
