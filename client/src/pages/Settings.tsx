import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Receipt,
  Boxes,
  Printer,
  ShieldCheck,
  Save,
  Download,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { api } from '../api/client';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; settings: BusinessSettings }>('/settings');
      if (res.success) setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await api.put<{ success: boolean; settings: BusinessSettings; message: string }>(
        '/settings',
        settings
      );
      if (res.success) {
        setSettings(res.settings);
        setSuccessMsg('Business settings successfully updated.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/backup/export-json', '_blank');
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-xs text-stone-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900">System & Shop Settings</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure Jay Mataji Rajwadi Chai business details, thermal printer format, taxes and backups
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold transition shadow-xs"
        >
          <Database className="w-4 h-4" />
          <span>Full JSON DB Backup</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information (Requirement 36) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Store & Brand Identity</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Official Logo Active
            </span>
          </div>

          {/* Logo Showcase Card */}
          <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl border border-amber-600/30 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 shadow-sm">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-amber-500 opacity-30 blur-xs"></div>
              <img
                src="/logo.png"
                alt="Jay Mataji Rajwadi Chai"
                className="relative w-16 h-16 rounded-full object-cover ring-2 ring-amber-500/80 shadow-md"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-white font-extrabold text-sm">Jay Mataji Rajwadi Official Emblem</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Royal 3D Gold
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Emblem is synced across POS receipts, thermal printer, top navigation bar, dashboard, and login portal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Shop / Business Name *</label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Shop Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={settings.gstNumber || ''}
                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Shop Owner</label>
              <input
                type="text"
                readOnly
                value="PRINCE DUMARALIYA"
                className="w-full text-xs px-3 py-2 border rounded-xl bg-stone-50 font-bold text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Official Instagram Profile</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value="https://www.instagram.com/jaymataji_rajwadichai01?stkn=MW9taWtvZmlid3RoaA=="
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-stone-50 text-stone-600 font-mono text-[11px] truncate"
                />
                <a
                  href="https://www.instagram.com/jaymataji_rajwadichai01?stkn=MW9taWtvZmlid3RoaA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1.5 shadow-xs transition"
                  title="Open Instagram Profile in new tab"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* POS Billing & Invoicing (Requirement 36) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm border-b pb-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>POS Invoicing & Thermal Printing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={settings.defaultTaxRate}
                onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Thermal Receipt Width</label>
              <select
                value={settings.defaultReceiptWidth}
                onChange={(e) => setSettings({ ...settings, defaultReceiptWidth: e.target.value })}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-white"
              >
                <option value="80mm">80mm Thermal (Standard)</option>
                <option value="58mm">58mm Thermal (Compact)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Policies & Age Checks (Requirement 36) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900 font-bold text-sm border-b pb-2">
            <Boxes className="w-4 h-4 text-purple-600" />
            <span>Inventory Stock Policies & Statutory Checks</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNegativeStock}
                onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600"
              />
              <div>
                <p className="text-xs font-bold text-stone-800">Allow Negative Stock Billing</p>
                <p className="text-[11px] text-stone-500">
                  When enabled, cashiers can bill items even if current registered stock reaches 0.
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAgeVerification}
                onChange={(e) => setSettings({ ...settings, enableAgeVerification: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600"
              />
              <div>
                <p className="text-xs font-bold text-stone-800">Mandatory Age Verification Check at POS</p>
                <p className="text-[11px] text-stone-500">
                  Enforces statutory 18+ check prompt before billing tobacco or cigarette variants.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
