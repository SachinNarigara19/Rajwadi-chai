import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  X,
  CreditCard,
  Banknote,
  DollarSign,
  Download,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Expenses: React.FC = () => {
  const { hasRole } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    amount: '' as number | '',
    paymentMethod: 'CASH',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        api.get<{ success: boolean; expenses: Expense[]; totalExpense: number }>('/expenses'),
        api.get<{ success: boolean; categories: ExpenseCategory[] }>('/expenses/categories'),
      ]);

      if (expRes.success) {
        setExpenses(expRes.expenses);
        setTotalExpense(expRes.totalExpense);
      }
      if (catRes.success) setCategories(catRes.categories);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openAddModal = () => {
    setFormData({
      title: '',
      categoryId: categories[0]?.id || '',
      amount: '',
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId || !formData.amount) return;

    try {
      await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
      });
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete expense "${title}"?`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/backup/export-csv/expenses', '_blank');
  };

  const filtered = expenses.filter((e) => {
    if (selectedCat !== 'ALL' && e.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return e.title.toLowerCase().includes(q) || (e.notes && e.notes.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-bold text-stone-900">Expense Management</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Track daily shop overheads: milk, commercial gas, staff salary, rent and maintenance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl text-rose-950 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Total Recorded Expenses
            </p>
            <p className="text-2xl font-black text-rose-900 mt-1 font-mono">
              ₹{totalExpense.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5 font-medium">Overhead outflow</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            ₹
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Expense Categories</p>
            <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{categories.length}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Rent, milk, gas, staff, etc.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Total Entries</p>
            <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{expenses.length}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Recorded shop vouchers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border rounded-xl"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">{e.title}</td>
                    <td className="py-3 px-3">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        {e.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-700">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px] max-w-[200px] truncate">
                      {e.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasRole(['ADMIN']) && (
                        <button
                          onClick={() => handleDelete(e.id, e.title)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Record Shop Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Gas Cylinder (19kg)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Supplier details or bill memo"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
