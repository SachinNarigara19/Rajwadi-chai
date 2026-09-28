import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  Calendar,
  X,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Sale, BusinessSettings } from '../types';
import { api } from '../api/client';
import { InvoiceModal } from '../components/InvoiceModal';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const [salesRes, settRes] = await Promise.all([
        api.get<{ success: boolean; sales: Sale[] }>('/sales'),
        api.get<{ success: boolean; settings: BusinessSettings }>('/settings'),
      ]);

      if (salesRes.success) setSales(salesRes.sales);
      if (settRes.success) setSettings(settRes.settings);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openInvoiceModal = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceModalOpen(true);
  };

  const openReturnModal = (sale: Sale) => {
    setReturnSale(sale);
    const initialQtys: Record<string, number> = {};
    sale.items.forEach((item) => {
      initialQtys[item.productId] = 0;
    });
    setReturnQtys(initialQtys);
    setReturnReason('');
    setReturnError(null);
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSale) return;

    const returnedItems = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const item = returnSale.items.find((i) => i.productId === productId);
        return {
          productId,
          quantity,
          refundRate: item?.unitPrice || 0,
        };
      });

    if (returnedItems.length === 0) {
      setReturnError('Please select at least 1 item and quantity to return.');
      return;
    }

    setReturnLoading(true);
    setReturnError(null);

    try {
      await api.post('/sales/returns', {
        saleId: returnSale.id,
        returnedItems,
        reason: returnReason,
      });

      setIsReturnModalOpen(false);
      fetchSales();
    } catch (err: any) {
      setReturnError(err.message || 'Failed to process return.');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/backup/export-csv/sales', '_blank');
  };

  const filteredSales = sales.filter((s) => {
    if (paymentFilter !== 'ALL' && s.paymentMethod !== paymentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customer?.name && s.customer.name.toLowerCase().includes(q))
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
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-stone-900">Sales & Invoices</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Complete transaction history, reprints, thermal receipts, and sales return ledger
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border rounded-xl"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs py-2 px-3 border rounded-xl bg-stone-50 font-medium"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Khata / Credit</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-stone-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {s.invoiceNumber}
                    </td>

                    <td className="py-3 px-3 text-stone-600 text-[11px]">
                      {new Date(s.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {s.customer?.name || 'Walk-in Customer'}
                    </td>

                    <td className="py-3 px-3 text-stone-600">
                      {s.cashier?.name || 'Counter'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-stone-700">
                      {s.items?.length || 0}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-stone-800">{s.paymentMethod}</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{s.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'RETURNED'
                            ? 'bg-rose-100 text-rose-700'
                            : s.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status === 'RETURNED' ? 'Returned' : s.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openInvoiceModal(s)}
                          className="p-1.5 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Print Thermal Receipt / Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {s.status !== 'RETURNED' && (
                          <button
                            onClick={() => openReturnModal(s)}
                            className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Process Sales Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        sale={selectedSale}
        settings={settings}
      />

      {/* Sales Return Modal (Requirement 20) */}
      {isReturnModalOpen && returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Process Sales Return</h3>
                <p className="text-xs text-stone-500">Invoice: {returnSale.invoiceNumber}</p>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {returnError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {returnError}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <p className="text-xs text-stone-600">
                Select quantities to return. Stock will automatically increase and customer ledger will update.
              </p>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 max-h-48 overflow-y-auto">
                {returnSale.items.map((it) => (
                  <div key={it.productId} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-stone-900">{it.productName}</p>
                      <p className="text-[10px] text-stone-500">
                        Purchased: {it.quantity} @ ₹{it.unitPrice}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-stone-500">Return Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={it.quantity}
                        value={returnQtys[it.productId] || 0}
                        onChange={(e) =>
                          setReturnQtys({
                            ...returnQtys,
                            [it.productId]: Math.min(it.quantity, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })
                        }
                        className="w-16 px-2 py-1 border rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Return Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Defective item, customer changed order"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {returnLoading ? 'Processing...' : 'Confirm Return & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
