import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  Truck,
  IndianRupee,
} from 'lucide-react';
import { Supplier } from '../types';
import { api } from '../api/client';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected for ledger
  const [selectedSupp, setSelectedSupp] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingSupp, setPayingSupp] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');

  // Add Supplier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [suppForm, setSuppForm] = useState({
    name: '',
    company: '',
    mobile: '',
    email: '',
    address: '',
    gstNumber: '',
    openingBalance: 0,
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; suppliers: Supplier[]; totalPayable: number }>('/suppliers');
      if (res.success) {
        setSuppliers(res.suppliers);
        setTotalPayable(res.totalPayable);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openProfile = async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; supplier: any }>(`/suppliers/${id}`);
      if (res.success) {
        setSelectedSupp(res.supplier);
        setIsProfileOpen(true);
      }
    } catch (err) {
      alert('Failed to load supplier details.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupp || !payAmount) return;

    try {
      await api.post(`/suppliers/${payingSupp.id}/payment`, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        reference: payRef,
      });

      setIsPayModalOpen(false);
      fetchSuppliers();
      if (selectedSupp && selectedSupp.id === payingSupp.id) {
        openProfile(payingSupp.id);
      }
    } catch (err: any) {
      alert(err.message || 'Payment could not be recorded.');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppForm.name.trim()) return;

    try {
      await api.post('/suppliers', suppForm);
      setIsAddModalOpen(false);
      setSuppForm({ name: '', company: '', mobile: '', email: '', address: '', gstNumber: '', openingBalance: 0 });
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier.');
    }
  };

  const filtered = suppliers.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.company && s.company.toLowerCase().includes(q)) ||
        (s.mobile && s.mobile.includes(q))
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
            <Building2 className="w-5 h-5 text-orange-600" />
            <h1 className="text-xl font-bold text-stone-900">Suppliers & Payables</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage tea leaf merchants, milk dairies, bakeries and wholesale vendor accounts
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Payables Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl text-orange-950 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
              Total Supplier Payables (Debt)
            </p>
            <p className="text-2xl font-black text-orange-900 mt-1 font-mono">
              ₹{totalPayable.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-orange-700 mt-0.5 font-medium">Pending procurement dues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-stone-950 flex items-center justify-center font-bold text-xl shadow-xs">
            ₹
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Registered Suppliers</p>
            <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{suppliers.length}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Tea, dairy, snacks & general</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Vendors with Pending Dues</p>
            <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
              {suppliers.filter((s) => s.currentBalance > 0).length}
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">Payables due settlement</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supplier or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Supplier / Contact</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">GSTIN</th>
                <th className="py-3 px-4 text-right">Payable Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-bold text-stone-900">{s.name}</td>
                    <td className="py-3 px-3 text-stone-600">{s.company || 'Distributor'}</td>
                    <td className="py-3 px-3 font-mono text-stone-700">{s.mobile || '-'}</td>
                    <td className="py-3 px-3 font-mono text-stone-500">{s.gstNumber || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.currentBalance > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ₹{s.currentBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-normal">₹0.00 (Clear)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openProfile(s.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        >
                          View Ledger
                        </button>
                        {s.currentBalance > 0 && (
                          <button
                            onClick={() => {
                              setPayingSupp(s);
                              setPayAmount(s.currentBalance);
                              setIsPayModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-2xs"
                          >
                            Pay Vendor
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

      {/* Supplier Profile Modal */}
      {isProfileOpen && selectedSupp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="text-base font-bold text-stone-900">{selectedSupp.name}</h2>
                <p className="text-xs text-stone-500">
                  {selectedSupp.company} • Mobile: {selectedSupp.mobile || 'N/A'} • GST: {selectedSupp.gstNumber || 'N/A'}
                </p>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Payable */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-800 font-bold uppercase tracking-wider">Current Amount Payable</p>
                <p className="text-xl font-black text-orange-900 font-mono">
                  ₹{selectedSupp.currentBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Supplier Ledger Table (Requirement 17) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Supplier Statement Ledger
              </h3>
              <div className="border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b text-stone-600 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Paid)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Purchased)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedSupp.ledger?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-stone-400">
                          No ledger records.
                        </td>
                      </tr>
                    ) : (
                      selectedSupp.ledger.map((row: any) => (
                        <tr key={row.id}>
                          <td className="py-2 px-3 text-stone-500 font-mono text-[11px]">
                            {new Date(row.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2 px-3 font-medium text-stone-800">{row.description}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">
                            {row.type === 'DEBIT' ? `₹${row.amount}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600">
                            {row.type === 'CREDIT' ? `₹${row.amount}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                            ₹{row.balanceAfter}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {isPayModalOpen && payingSupp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Disburse Supplier Payment</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Vendor: <span className="font-bold text-stone-900">{payingSupp.name}</span> • Payable Balance: <span className="font-bold text-amber-700 font-mono">₹{payingSupp.currentBalance}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Disbursed Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || '')}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reference #</label>
                <input
                  type="text"
                  placeholder="Txn ID or cheque number"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Add Wholesale Supplier</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nilesh Patel"
                  value={suppForm.name}
                  onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat Tea Packers Ltd"
                  value={suppForm.company}
                  onChange={(e) => setSuppForm({ ...suppForm, company: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile</label>
                <input
                  type="text"
                  placeholder="10-digit mobile"
                  value={suppForm.mobile}
                  onChange={(e) => setSuppForm({ ...suppForm, mobile: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">GST Number</label>
                <input
                  type="text"
                  placeholder="GSTIN (Optional)"
                  value={suppForm.gstNumber}
                  onChange={(e) => setSuppForm({ ...suppForm, gstNumber: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Market or warehouse location"
                  value={suppForm.address}
                  onChange={(e) => setSuppForm({ ...suppForm, address: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
