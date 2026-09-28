import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../api/client';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; logs: AuditLog[] }>('/audit-logs');
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h1 className="text-xl font-bold text-stone-900">Security Audit Logs</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tamper-evident activity trail tracking logins, stock overrides, billing, customer settlements and settings
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs py-2 px-3 border rounded-xl bg-stone-50 font-medium"
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">User Logins</option>
          <option value="SALE_CREATE">Sales Checkout</option>
          <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
          <option value="PURCHASE_CREATE">Stock Procurement</option>
          <option value="CUSTOMER_PAYMENT">Khata Payments</option>
          <option value="SETTINGS_UPDATE">Settings Changes</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-stone-400">
                    No audit records match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900">{log.userName || 'System'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-stone-100 text-stone-800 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-600">{log.entity}</td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-[11px] max-w-md truncate">
                      {log.details || '-'}
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
