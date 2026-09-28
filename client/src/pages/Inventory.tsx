import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Download,
  Plus,
  Search,
  ShoppingCart,
  History,
  CheckCircle2,
  Sparkles,
  Minus,
  Equal,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';

export const Inventory: React.FC = () => {
  const [valuationData, setValuationData] = useState<any>(null);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW' | 'OUT' | 'SOLD'>('ALL');
  const [showDeductionFormula, setShowDeductionFormula] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [valRes, lowRes] = await Promise.all([
        api.get('/inventory/valuation'),
        api.get('/inventory/low-stock'),
      ]);

      if (valRes.success) setValuationData(valRes);
      if (lowRes.success) setLowStockData(lowRes.products);
    } catch (err) {
      console.error('Failed to load inventory valuation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/backup/export-csv/inventory', '_blank');
  };

  const items = valuationData?.items || [];
  const grandValue = valuationData?.grandStockValue || 0;
  const totalInitialStockSum = valuationData?.totalInitialStockSum || 0;
  const totalSoldStockSum = valuationData?.totalSoldStockSum || 0;
  const totalRemainingStockSum = valuationData?.totalRemainingStockSum || 0;

  const filteredItems = items.filter((item: any) => {
    if (activeTab === 'LOW' && !item.isLowStock) return false;
    if (activeTab === 'OUT' && !item.isOutOfStock) return false;
    if (activeTab === 'SOLD' && (!item.soldStock || item.soldStock <= 0)) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-stone-900">Inventory & Stock Valuation</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Live automated deduction: Total Stock − Customer Purchases = Remaining Stock in Hand
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <NavLink
            to="/purchases"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </NavLink>
        </div>
      </div>

      {/* Customer Sales Stock Deduction Banner (Requirement: Total Stock - Customer Purchases = Remaining Stock) */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 p-5 rounded-2xl border border-amber-600/30 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Customer Stock Deduction Tracker</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              Total Stock − Customer Buy = Remaining Stock in Hand
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 max-w-xl">
              When a customer buys items at the counter, stock is automatically subtracted from Total Stock. 
              The live remaining stock is instantly updated on your dashboard.
            </p>
          </div>

          {/* Interactive Live Formula Calculator Display */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-stone-950/80 p-3 rounded-2xl border border-stone-800 shadow-inner">
            {/* Total Stock */}
            <div className="text-center px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Stock</p>
              <p className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                {totalInitialStockSum.toLocaleString('en-IN')}
              </p>
              <span className="text-[9px] text-stone-500 font-medium">Inward Procured</span>
            </div>

            <div className="text-xl font-black text-rose-500 px-1">−</div>

            {/* Customer Purchases (Sold) */}
            <div className="text-center px-3 py-1.5 bg-rose-950/30 rounded-xl border border-rose-900/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Customer Buy</p>
              <p className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-0.5">
                {totalSoldStockSum.toLocaleString('en-IN')}
              </p>
              <span className="text-[9px] text-rose-300/80 font-medium">Units Sold</span>
            </div>

            <div className="text-xl font-black text-emerald-400 px-1">=</div>

            {/* Remaining Available Stock */}
            <div className="text-center px-3.5 py-1.5 bg-emerald-950/40 rounded-xl border border-emerald-500/40 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Remaining Stock</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                {totalRemainingStockSum.toLocaleString('en-IN')}
              </p>
              <span className="text-[9px] text-emerald-300 font-medium">Available in Shop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Metrics Bar (Requirement 30) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs font-semibold text-stone-500">Total Inventory Valuation</p>
          <p className="text-2xl font-black text-stone-900 mt-1 font-mono text-emerald-700">
            ₹{grandValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">Formula: ∑(Remaining Qty × Cost Price)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <p className="text-xs font-semibold text-stone-500">Total Tracked SKUs</p>
          <p className="text-2xl font-black text-stone-900 mt-1 font-mono">
            {items.length}
          </p>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">Active shop catalogue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <p className="text-xs font-semibold text-amber-800">Low Stock Threshold Alerts</p>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">
            {items.filter((i: any) => i.isLowStock).length}
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">Reorder recommended</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <p className="text-xs font-semibold text-rose-800">Out of Stock</p>
          <p className="text-2xl font-black text-rose-700 mt-1 font-mono">
            {items.filter((i: any) => i.isOutOfStock).length}
          </p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">POS Billing blocked</p>
        </div>
      </div>

      {/* Low Stock Warning Banner if any items low (Requirement 28) */}
      {lowStockData.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Low Stock Action List (Requires Replenishment)
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-700">{lowStockData.length} items below minimum</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lowStockData.slice(0, 6).map((prod) => (
              <div
                key={prod.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">{prod.name}</p>
                  <p className="text-[11px] text-stone-500">
                    Remaining Stock:{' '}
                    <span className="font-bold text-rose-600">{prod.currentStock}</span> / Min: {prod.minStockLevel} {prod.unit}
                  </p>
                </div>
                <NavLink
                  to="/purchases"
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition flex items-center space-x-1"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>Procure</span>
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Valuation & Deduction Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('SOLD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'SOLD' ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Customer Purchases ({items.filter((i: any) => i.soldStock > 0).length})
            </button>
            <button
              onClick={() => setActiveTab('LOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'LOW' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Low Stock ({items.filter((i: any) => i.isLowStock).length})
            </button>
            <button
              onClick={() => setActiveTab('OUT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'OUT' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Out of Stock ({items.filter((i: any) => i.isOutOfStock).length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Toggle Deduction Formula Option */}
            <label className="inline-flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition select-none">
              <input
                type="checkbox"
                checked={showDeductionFormula}
                onChange={(e) => setShowDeductionFormula(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer accent-amber-600"
              />
              <span className="text-[11px]">Show Deduction Formula (Total − Sold = Remaining)</span>
            </label>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center bg-amber-50/40">Total Stock</th>
                <th className="py-3 px-3 text-center bg-rose-50/40">Customer Buy</th>
                <th className="py-3 px-3 text-center bg-emerald-50/40">Remaining Stock</th>
                {showDeductionFormula && (
                  <th className="py-3 px-3 text-center bg-stone-100">Live Deduction Formula</th>
                )}
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Stock Valuation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={showDeductionFormula ? 12 : 11} className="text-center py-8 text-stone-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div>{item.name}</div>
                      <span className="text-[10px] text-stone-400 font-normal">Unit: {item.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">{item.category}</td>
                    <td className="py-3 px-3 font-mono text-stone-500">{item.sku}</td>

                    {/* Total Sourced / Inward Stock */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-stone-800 bg-amber-50/20">
                      {item.totalStock} {item.unit}
                    </td>

                    {/* Minus Customer Bought Stock */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-rose-600 bg-rose-50/20">
                      {item.soldStock > 0 ? (
                        <span className="inline-flex items-center space-x-0.5">
                          <span>−{item.soldStock}</span>
                          <span className="text-[10px] font-normal text-rose-400">{item.unit}</span>
                        </span>
                      ) : (
                        <span className="text-stone-400">0</span>
                      )}
                    </td>

                    {/* Remaining Available Stock */}
                    <td className="py-3 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                        = {item.currentStock} {item.unit}
                      </span>
                    </td>

                    {/* Live Deduction Formula Display */}
                    {showDeductionFormula && (
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-100 text-[11px] font-mono border border-stone-200">
                          <span className="text-amber-800 font-bold">{item.totalStock}</span>
                          <span className="text-stone-400">−</span>
                          <span className="text-rose-600 font-bold">{item.soldStock}</span>
                          <span className="text-stone-400">=</span>
                          <span className="text-emerald-700 font-black">{item.currentStock}</span>
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-3 text-right font-mono text-stone-600">₹{item.purchasePrice}</td>
                    <td className="py-3 px-3 text-right font-mono text-stone-900">₹{item.sellingPrice}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{item.stockValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Out of Stock
                        </span>
                      ) : item.isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <NavLink
                        to={`/products/${item.id}`}
                        className="text-amber-700 hover:text-amber-900 p-1.5 inline-flex rounded-lg hover:bg-amber-50"
                        title="View Movement Ledger"
                      >
                        <History className="w-4 h-4" />
                      </NavLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
