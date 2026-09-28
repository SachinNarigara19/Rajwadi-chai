import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Camera,
  BarChart2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Product, Category, Supplier } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CameraCaptureModal } from '../components/CameraCaptureModal';
import { ProductAnalyticsModal } from '../components/ProductAnalyticsModal';

export const Products: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Camera & Analytics Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [analyticsProductId, setAnalyticsProductId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    brand: 'Jay Mataji Rajwadi',
    sku: '',
    barcode: '',
    unit: 'Cup',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    openingStock: 0,
    minStockLevel: 5,
    taxRate: 5,
    supplierId: '',
    imageUrl: '',
    isAgeRestricted: false,
    complianceNotes: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, suppsRes] = await Promise.all([
        api.get<{ success: boolean; products: Product[] }>('/products'),
        api.get<{ success: boolean; categories: Category[] }>('/categories'),
        api.get<{ success: boolean; suppliers: Supplier[] }>('/suppliers'),
      ]);

      if (prodsRes.success) setProducts(prodsRes.products);
      if (catsRes.success) setCategories(catsRes.categories);
      if (suppsRes.success) setSuppliers(suppsRes.suppliers);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      brand: 'Jay Mataji Rajwadi',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `890${Date.now().toString().slice(-9)}`,
      unit: 'Cup',
      purchasePrice: 10,
      sellingPrice: 20,
      mrp: 20,
      openingStock: 50,
      minStockLevel: 10,
      taxRate: 5,
      supplierId: suppliers[0]?.id || '',
      imageUrl: '',
      isAgeRestricted: false,
      complianceNotes: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      brand: p.brand || 'Jay Mataji Rajwadi',
      sku: p.sku,
      barcode: p.barcode || '',
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      openingStock: p.openingStock,
      minStockLevel: p.minStockLevel,
      taxRate: p.taxRate,
      supplierId: p.supplierId || '',
      imageUrl: p.imageUrl || '',
      isAgeRestricted: p.isAgeRestricted,
      complianceNotes: p.complianceNotes || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploadingImage(true);

    try {
      const res = await api.post<{ success: boolean; imageUrl: string }>('/products/upload-image', data);
      if (res.success && res.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      }
    } catch (err: any) {
      setModalError('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save product
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      setModalError('Product name and category are required.');
      return;
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save product.');
    }
  };

  // Delete product
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  // Filtering
  const filtered = products.filter((p) => {
    if (selectedCat !== 'ALL' && p.categoryId !== selectedCat) return false;
    if (stockFilter === 'LOW' && (p.currentStock <= 0 || p.currentStock > p.minStockLevel)) return false;
    if (stockFilter === 'OUT' && p.currentStock > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900">Product Catalogue</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage tea shop items, prices, barcodes, units and statutory age regulations
          </p>
        </div>

        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, SKU or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs py-2 px-3 border rounded-xl bg-stone-50 font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="text-xs py-2 px-3 border rounded-xl bg-stone-50 font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW">⚠️ Low Stock Alerts</option>
            <option value="OUT">🛑 Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Tax (GST)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-stone-400">
                    No products matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isOut = p.currentStock <= 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setAnalyticsProductId(p.id)}
                          className="flex items-center space-x-3 cursor-pointer group"
                          title="Click to view sales trends & graphs"
                        >
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=150&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0 group-hover:scale-105 group-hover:border-amber-400 transition"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-stone-900 group-hover:text-amber-600 transition flex items-center gap-1">
                                <span>{p.name}</span>
                                <TrendingUp className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
                              </p>
                              {p.isAgeRestricted && (
                                <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-sm">
                                  18+
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500">{p.brand || 'Jay Mataji'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-stone-600 font-medium">
                        {p.category?.name || 'Chai'}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                        <div>{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-stone-400">{p.barcode}</div>}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-stone-600">
                        ₹{p.purchasePrice}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                        ₹{p.sellingPrice}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-stone-600">
                        {p.taxRate}%
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setAnalyticsProductId(p.id)}
                            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="View Individual Product Sales Graph & Analytics (High Sell / Low Sell)"
                          >
                            <BarChart2 className="w-4 h-4 text-emerald-600" />
                          </button>

                          <NavLink
                            to={`/products/${p.id}`}
                            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-4 h-4" />
                          </NavLink>

                          {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-stone-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {hasRole(['ADMIN']) && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-base font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Rajwadi Chai"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="Cup">Cup</option>
                    <option value="Glass">Glass</option>
                    <option value="Pcs">Pcs (Piece)</option>
                    <option value="Pkt">Pkt (Packet)</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Plate">Plate</option>
                    <option value="Stick">Stick</option>
                    <option value="Box">Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Purchase / Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Opening Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.openingStock}
                      onChange={(e) => setFormData({ ...formData, openingStock: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Minimum Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 1 })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Standard Tea/Food)</option>
                    <option value={12}>12% (Packaged snacks)</option>
                    <option value={18}>18% (Cold drinks)</option>
                    <option value={28}>28% (Tobacco/Cigarettes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Default Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="">None / Direct Procurement</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Photo Upload & Camera Capture */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Photo (Camera or File)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-11 h-11 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Image URL, upload file or take live camera photo"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 w-full text-xs px-3 py-2 border rounded-xl"
                  />
                  <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs px-3 py-2 rounded-xl shadow-xs transition"
                      title="Take Photo with Device Camera"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>
                    <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Age Restriction Checkbox (Requirement 7 & 11) */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAgeRestricted}
                    onChange={(e) => setFormData({ ...formData, isAgeRestricted: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-900">
                    Mark as Age-Restricted Statutory Product (18+ Tobacco / Cigarettes)
                  </span>
                </label>
                {formData.isAgeRestricted && (
                  <input
                    type="text"
                    placeholder="Statutory compliance notice / warning (e.g. COTPA compliance)"
                    value={formData.complianceNotes}
                    onChange={(e) => setFormData({ ...formData, complianceNotes: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-lg text-rose-900"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(url) => {
          setFormData((prev) => ({ ...prev, imageUrl: url }));
        }}
        productName={formData.name}
      />

      {/* Product Analytics & Sales Graph Modal */}
      <ProductAnalyticsModal
        productId={analyticsProductId || ''}
        isOpen={!!analyticsProductId}
        onClose={() => setAnalyticsProductId(null)}
      />
    </div>
  );
};
