import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  History,
  Building2,
  Calendar,
  User,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  BarChart2,
} from 'lucide-react';
import { Product, StockTransaction } from '../types';
import { api } from '../api/client';
import { ProductAnalyticsContent } from '../components/ProductAnalyticsModal';

export const ProductStockHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'ledger'>('analytics');

  // Quick Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'DAMAGED' | 'WASTAGE'>('ADJUSTMENT');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prodRes, histRes] = await Promise.all([
        api.get<{ success: boolean; product: any }>(`/products/${id}`),
        api.get<{ success: boolean; transactions: StockTransaction[] }>(`/products/${id}/stock-history`),
      ]);

      if (prodRes.success) setProduct(prodRes.product);
      if (histRes.success) setTransactions(histRes.transactions);
    } catch (err) {
      console.error('Failed to load stock history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [id]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustQty) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }

    setAdjustLoading(true);
    setErrorMsg(null);

    try {
      await api.post('/inventory/adjust', {
        productId: id,
        type: adjustType,
        quantity: adjustQty,
        notes: adjustNotes,
      });

      setIsAdjustModalOpen(false);
      setAdjustQty(0);
      setAdjustNotes('');
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust stock.');
    } finally {
      setAdjustLoading(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">Loading stock movement history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <NavLink
            to="/products"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </NavLink>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-stone-900">{product.name}</h1>
              {product.isAgeRestricted && (
                <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                  18+ Statutory
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              SKU: {product.sku} • Barcode: {product.barcode || 'N/A'} • Category: {product.category?.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <History className="w-4 h-4" />
          <span>Record Stock Adjustment</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'analytics'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Individual Sales Trends & Graphs</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ledger'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Ledger</span>
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <ProductAnalyticsContent productId={id!} isModal={false} />
        </div>
      )}

      {activeTab === 'ledger' && (
        <>
          {/* Metrics Row (Requirement 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Current Stock</p>
          <p className="text-xl font-black text-amber-700 mt-1 font-mono">
            {product.currentStock} {product.unit}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5 inline-block">
            Min threshold: {product.minStockLevel}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Purchase / Cost Rate</p>
          <p className="text-xl font-black text-stone-900 mt-1 font-mono">
            ₹{product.purchasePrice}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5 inline-block">Per {product.unit}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Selling Price</p>
          <p className="text-xl font-black text-stone-900 mt-1 font-mono">
            ₹{product.sellingPrice}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 inline-block">
            Margin: ₹{product.sellingPrice - product.purchasePrice}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Total Stock Value</p>
          <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
            ₹{(product.totalStockValue || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5 inline-block">Qty × Cost Rate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Units Sold</p>
          <p className="text-xl font-black text-stone-900 mt-1 font-mono">
            {product.unitsSold || 0} {product.unit}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5 inline-block">Lifetime sales</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500">Units Purchased</p>
          <p className="text-xl font-black text-stone-900 mt-1 font-mono">
            {product.unitsPurchased || 0} {product.unit}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5 inline-block">Lifetime inward</span>
        </div>
      </div>

      {/* Stock Movement History Table (Requirement 6 & 48) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-stone-900">Stock Movement Ledger History</h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Strict Non-Silent Inventory Trail ({transactions.length} Records)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Transaction Type</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3 text-right">Rate</th>
                <th className="py-3 px-4">Reference / Invoice</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4">User & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.quantity > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                        {new Date(tx.date).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                            tx.type === 'SALE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'PURCHASE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : tx.type === 'OPENING_STOCK'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : tx.type === 'SALE_RETURN'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : tx.type === 'PURCHASE_RETURN'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : tx.type === 'DAMAGED' || tx.type === 'WASTAGE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-stone-600">
                        ₹{tx.rate}
                      </td>

                      <td className="py-3 px-4 font-medium text-stone-800">
                        {tx.reference || 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {tx.balanceAfter} {product.unit}
                      </td>

                      <td className="py-3 px-4 text-stone-500">
                        <div className="text-[11px]">{tx.notes || '-'}</div>
                        <div className="text-[10px] text-stone-400 flex items-center mt-0.5">
                          <User className="w-3 h-3 mr-0.5" />
                          <span>{tx.createdBy?.name || 'System'}</span>
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
      </>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">Record Stock Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                ×
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="ADJUSTMENT">Inventory Adjustment (Physical count correction)</option>
                  <option value="DAMAGED">Damaged Stock</option>
                  <option value="WASTAGE">Wastage / Spoilage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Quantity (+ for addition, - for reduction)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. -5 for damaged cups, +10 for found stock"
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reason / Notes *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mandatory reason for audit record (e.g. milk spilt, damaged packaging)"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {adjustLoading ? 'Recording...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
