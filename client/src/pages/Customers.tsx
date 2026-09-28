import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  History,
  X,
  CheckCircle,
  Receipt,
  Download,
  IndianRupee,
} from 'lucide-react';
import { Customer } from '../types';
import { api } from '../api/client';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected customer for Ledger Profile
  const [selectedCust, setSelectedCust] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Payment Settlement Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingCust, setPayingCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payingLoading, setPayingLoading] = useState(false);

  // Add / Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [custForm, setCustForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    openingBalance: 0,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; customers: Customer[]; totalOutstanding: number }>('/customers');
      if (res.success) {
        setCustomers(res.customers);
        setTotalOutstanding(res.totalOutstanding);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openProfile = async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; customer: any }>(`/customers/${id}`);
      if (res.success) {
        setSelectedCust(res.customer);
        setIsProfileOpen(true);
      }
    } catch (err) {
      alert('Failed to load customer profile.');
    }
  };

  const openPaymentModal = (c: Customer) => {
    setPayingCust(c);
    setPayAmount(c.currentBalance > 0 ? c.currentBalance : '');
    setPayMethod('CASH');
    setPayRef('');
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCust || !payAmount) return;

    setPayingLoading(true);
    try {
      await api.post(`/customers/${payingCust.id}/payment`, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        reference: payRef,
        notes: payNotes,
      });

      setIsPaymentModalOpen(false);
      fetchCustomers();
      if (selectedCust && selectedCust.id === payingCust.id) {
        openProfile(payingCust.id);
      }
    } catch (err: any) {
      alert(err.message || 'Payment could not be recorded.');
    } finally {
      setPayingLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) return;

    try {
      await api.post('/customers', custForm);
      setIsAddModalOpen(false);
      setCustForm({ name: '', mobile: '', email: '', address: '', openingBalance: 0 });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer.');
    }
  };

  const filtered = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
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
            <Users className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-bold text-stone-900">Customer & Khata Credit Ledger</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage chai accounts, record credit payments, view customer transaction ledgers
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Outstanding Total Banner (Requirement 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl text-amber-950 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Total Outstanding Customer Khata
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1 font-mono">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">Pending credit collections</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xl shadow-xs">
            ₹
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Registered Customers</p>
            <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{customers.length}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Regulars & Khata accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Active Credit Accounts</p>
            <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {customers.filter((c) => c.currentBalance > 0).length}
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5">Customers with pending dues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border rounded-xl"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-4 text-right">Lifetime Purchases</th>
                <th className="py-3 px-4 text-right">Khata Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900">{c.name}</p>
                      {c.email && <p className="text-[11px] text-stone-400">{c.email}</p>}
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-700">
                      {c.mobile || '-'}
                    </td>

                    <td className="py-3 px-3 text-stone-500 text-[11px] max-w-[200px] truncate">
                      {c.address || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-800">
                      ₹{c.totalPurchases.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {c.currentBalance > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          ₹{c.currentBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-normal">₹0.00 (Clear)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openProfile(c.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        >
                          View Ledger
                        </button>
                        {c.currentBalance > 0 && (
                          <button
                            onClick={() => openPaymentModal(c)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                          >
                            Receive Payment
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

      {/* Customer Profile & Khata Ledger Modal (Requirement 15) */}
      {isProfileOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-base font-bold text-stone-900">{selectedCust.name}</h2>
                <p className="text-xs text-stone-500">
                  Mobile: {selectedCust.mobile || 'N/A'} • Total Purchases: ₹{selectedCust.totalPurchases}
                </p>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Due Alert */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Current Khata Due</p>
                <p className="text-xl font-black text-amber-900 font-mono">
                  ₹{selectedCust.currentBalance.toLocaleString('en-IN')}
                </p>
              </div>
              {selectedCust.currentBalance > 0 && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    openPaymentModal(selectedCust);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Record Settle Payment
                </button>
              )}
            </div>

            {/* Ledger Transactions Table (Requirement 15) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Customer Khata Ledger History
              </h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b text-stone-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Added)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedCust.ledger?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-stone-400">
                          No ledger transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      selectedCust.ledger.map((row: any) => (
                        <tr key={row.id}>
                          <td className="py-2 px-3 text-stone-500 font-mono text-[11px]">
                            {new Date(row.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2 px-3 font-medium text-stone-800">{row.description}</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600">
                            {row.type === 'DEBIT' ? `₹${row.amount}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">
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

      {/* Record Payment Settlement Modal (Requirement 16) */}
      {isPaymentModalOpen && payingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Record Customer Khata Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Customer: <span className="font-bold text-stone-900">{payingCust.name}</span> • Current Due: <span className="font-bold text-rose-600 font-mono">₹{payingCust.currentBalance}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Enter amount collected"
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
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Reference # (Optional)</label>
                <input
                  type="text"
                  placeholder="UPI transaction ref or cheque #"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payingLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {payingLoading ? 'Recording...' : 'Save Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Add Customer Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="10-digit mobile"
                  value={custForm.mobile}
                  onChange={(e) => setCustForm({ ...custForm, mobile: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Opening Credit / Khata (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={custForm.openingBalance || ''}
                  onChange={(e) => setCustForm({ ...custForm, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Shop or residential address"
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
