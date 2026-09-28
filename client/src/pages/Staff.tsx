import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, User, Shield, KeyRound, X, Check, AlertCircle } from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Staff: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // New Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'CASHIER' as UserRole,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; users: UserType[] }>('/auth/users');
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.password) {
      setErrorMsg('Username, name and password are required.');
      return;
    }

    try {
      await api.post('/auth/users', formData);
      setIsAddModalOpen(false);
      setFormData({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
      setErrorMsg(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create staff account.');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | undefined) => {
    try {
      await api.put(`/auth/users/${id}`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-stone-900">Staff & Role Permissions</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage owner admin, cashier and inventory manager access permissions
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Role Explainer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
            <span className="text-base">👑</span>
            <span>Admin / Owner</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Full system control: billing, expenses, financial settings, profit reports, staff management, backup exports.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
            <span className="text-base">💳</span>
            <span>Cashier</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Fast billing counter, product catalog search, customer khata credit tracking, invoice reprints. Financial deletion blocked.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
            <span className="text-base">📦</span>
            <span>Inventory Manager</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Product catalog management, stock inward purchases, supplier payables, inventory adjustments and low-stock alerts.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">System Role</th>
                <th className="py-3 px-3 text-center">Account Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-bold text-stone-900">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-stone-600">{u.username}</td>
                  <td className="py-3 px-3 text-stone-500">{u.email || '-'}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'CASHIER'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {u.role === 'ADMIN' ? '👑 Owner Admin' : u.role === 'CASHIER' ? '💳 Cashier' : '📦 Stock Manager'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${
                          u.isActive !== false
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive !== false ? 'Disable' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-stone-900">Add Staff User</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Bhai"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh_counter"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Temporary password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Role Permission *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="CASHIER">Cashier (POS Billing & Khata)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Stock & Procurement)</option>
                  <option value="ADMIN">Admin / Owner (Full Shop Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="staff@jaymatajichai.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
