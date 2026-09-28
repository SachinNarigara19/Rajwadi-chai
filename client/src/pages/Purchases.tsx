import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  X,
  Trash2,
  Download,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Purchase, Supplier, Product } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Purchases: React.FC = () => {
  const { hasRole } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; purchaseRate: number; tax: number }[]>([]);
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Purchase Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnPurchase, setReturnPurchase] = useState<Purchase | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, suppRes, prodRes] = await Promise.all([
        api.get<{ success: boolean; purchases: Purchase[] }>('/purchases'),
        api.get<{ success: boolean; suppliers: Supplier[] }>('/suppliers'),
        api.get<{ success: boolean; products: Product[] }>('/products'),
      ]);

      if (poRes.success) setPurchases(poRes.purchases);
      if (suppRes.success) setSuppliers(suppRes.suppliers);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewPurchase = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setSupplierBillNo('');
    setOrderItems([
      {
        productId: products[0]?.id || '',
        quantity: 50,
        purchaseRate: products[0]?.purchasePrice || 10,
        tax: 0,
      },
    ]);
    setPaymentStatus('PAID');
    setPaidAmount('');
    setPaymentMethod('CASH');
    setNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    setOrderItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        quantity: 10,
        purchaseRate: products[0].purchasePrice,
        tax: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, val: any) => {
    setOrderItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        if (field === 'productId') {
          const prod = products.find((p) => p.id === val);
          return {
            ...it,
            productId: val,
            purchaseRate: prod ? prod.purchasePrice : it.purchaseRate,
          };
        }
        return { ...it, [field]: val };
      })
    );
  };

  const totalAmount = orderItems.reduce((sum, it) => sum + (it.quantity * it.purchaseRate) + it.tax, 0);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || orderItems.length === 0) {
      setModalError('Please select a supplier and add at least one item.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      await api.post('/purchases', {
        supplierId: selectedSupplierId,
        supplierBillNo,
        items: orderItems,
        paymentStatus,
        paidAmount: paidAmount !== '' ? Number(paidAmount) : undefined,
        paymentMethod,
        notes,
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = (p: Purchase) => {
    setReturnPurchase(p);
    const initialQtys: Record<string, number> = {};
    p.items.forEach((it) => {
      initialQtys[it.productId] = 0;
    });
    setReturnQtys(initialQtys);
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnPurchase) return;

    const returnedItems = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const item = returnPurchase.items.find((i) => i.productId === productId);
        return {
          productId,
          quantity,
          purchaseRate: item?.purchaseRate || 0,
        };
      });

    if (returnedItems.length === 0) {
      alert('Please select at least 1 item to return.');
      return;
    }

    setReturnLoading(true);

    try {
      await api.post('/purchases/returns', {
        purchaseId: returnPurchase.id,
        returnedItems,
        reason: returnReason,
      });

      setIsReturnModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to process purchase return.');
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-stone-900">Purchase Management (PO)</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Record tea shop procurement, automatically replenish stock and maintain supplier ledger
          </p>
        </div>

        {hasRole(['ADMIN', 'INVENTORY_MANAGER']) && (
          <button
            onClick={openNewPurchase}
            className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-3">Supplier Bill #</th>
                <th className="py-3 px-3 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{p.purchaseNumber}</td>
                    <td className="py-3 px-3 text-stone-600 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">{p.supplier?.name}</td>
                    <td className="py-3 px-3 font-mono text-stone-500">{p.supplierBillNo || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{p.items?.length || 0}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                      ₹{p.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openReturnModal(p)}
                        className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Purchase Return"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-base font-bold text-stone-900">Record Inward Stock Purchase</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company || 'Distributor'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Supplier Bill / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. WB-99201"
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Purchased Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-purple-700 font-bold hover:underline flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-stone-50/50">
                      <div className="sm:col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border rounded-lg bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.currentStock} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full text-xs px-2 py-1.5 border rounded-lg text-center font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Rate ₹"
                          value={item.purchaseRate}
                          onChange={(e) => updateItemRow(idx, 'purchaseRate', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs px-2 py-1.5 border rounded-lg text-right font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right font-mono font-bold text-xs text-stone-900 pr-2">
                        ₹{(item.quantity * item.purchaseRate).toFixed(2)}
                      </div>

                      <div className="sm:col-span-1 text-center">
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="PAID">Paid in Full</option>
                    <option value="PENDING">Credit / Pending (Payable)</option>
                    <option value="PARTIAL">Partial Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                {paymentStatus === 'PARTIAL' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Paid Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || '')}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                <div className="text-sm font-bold text-stone-700">
                  Total Order Value: <span className="text-purple-700 font-mono text-base font-black">₹{totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    {submitting ? 'Updating Stock...' : 'Save & Receive Stock'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Return Modal */}
      {isReturnModalOpen && returnPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">Purchase Return to Supplier</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <p className="text-xs text-stone-600">
                Returning stock to <span className="font-bold">{returnPurchase.supplier?.name}</span> will decrease inventory and reduce supplier payables.
              </p>

              <div className="divide-y divide-stone-100 border rounded-xl p-2 max-h-48 overflow-y-auto">
                {returnPurchase.items.map((it) => (
                  <div key={it.productId} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">{it.product?.name || 'Item'}</p>
                      <p className="text-[10px] text-stone-500">Purchased: {it.quantity} @ ₹{it.purchaseRate}</p>
                    </div>
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
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reason for Return</label>
                <input
                  type="text"
                  placeholder="e.g. Expired / damaged by supplier"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  {returnLoading ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
