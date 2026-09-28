import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Users, Truck, Receipt, ShoppingCart, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: any[];
    customers: any[];
    suppliers: any[];
    sales: any[];
    purchases: any[];
  }>({
    products: [],
    customers: [],
    suppliers: [],
    sales: [],
    purchases: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], customers: [], suppliers: [], sales: [], purchases: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; results: any }>(`/search?q=${encodeURIComponent(query)}`);
        if (res.success && res.results) {
          setResults(res.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const totalHits =
    results.products.length +
    results.customers.length +
    results.suppliers.length +
    results.sales.length +
    results.purchases.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-stone-200">
          <Search className="w-5 h-5 text-amber-600 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search products, customers, invoices, suppliers, POs... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium bg-transparent focus:outline-hidden text-stone-900 placeholder:text-stone-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-300 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-stone-500 font-medium animate-pulse">
              Searching Jay Mataji Rajwadi Chai database...
            </div>
          )}

          {!loading && query && totalHits === 0 && (
            <div className="text-center py-8 text-xs text-stone-500">
              No matching records found for "{query}".
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5" />
                <span>Products ({results.products.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(`/products/${p.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{p.name}</p>
                      <p className="text-[11px] text-stone-500">
                        SKU: {p.sku} • Stock: {p.currentStock} {p.unit}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 font-mono">₹{p.sellingPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(`/customers`)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{c.name}</p>
                      <p className="text-[11px] text-stone-500">Mobile: {c.mobile || 'N/A'}</p>
                    </div>
                    {c.currentBalance > 0 && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Khata: ₹{c.currentBalance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.sales.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>Sales Invoices ({results.sales.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.sales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/sales`)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{s.invoiceNumber}</p>
                      <p className="text-[11px] text-stone-500">
                        Customer: {s.customer?.name || 'Walk-in'} • {new Date(s.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-900 font-mono">₹{s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {results.suppliers.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                <Truck className="w-3.5 h-3.5" />
                <span>Suppliers ({results.suppliers.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.suppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/suppliers`)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{s.name}</p>
                      <p className="text-[11px] text-stone-500">{s.company || 'Distributor'}</p>
                    </div>
                    {s.currentBalance > 0 && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Payable: ₹{s.currentBalance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-4 py-2 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-500">
          <span>Tip: Press <kbd className="px-1 py-0.5 bg-stone-200 rounded">Ctrl+K</kbd> anytime</span>
          <span>Jay Mataji Rajwadi Chai POS</span>
        </div>
      </div>
    </div>
  );
};
