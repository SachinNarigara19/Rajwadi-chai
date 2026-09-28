import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  Receipt,
  Download,
  Printer,
  TrendingUp,
  Percent,
  Wallet,
  Truck,
  Boxes,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';

export const Reports: React.FC = () => {
  const location = useLocation();

  // Determine active tab from URL path (e.g. /reports/daily, /reports/monthly, /reports/profit)
  const pathPart = location.pathname.split('/')[2];
  const initialTab = ['daily', 'monthly', 'sales', 'purchases', 'profit', 'inventory'].includes(pathPart)
    ? pathPart
    : 'daily';

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Daily Report State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Monthly Report State
  const now = new Date();
  const [monthlyMonth, setMonthlyMonth] = useState(now.getMonth());
  const [monthlyYear, setMonthlyYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Profit Report State
  const [profitData, setProfitData] = useState<any>(null);
  const [profitLoading, setProfitLoading] = useState(false);

  // Sales Report State
  const [salesPeriod, setSalesPeriod] = useState('month');
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  // Purchase Report State
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // 1. Fetch Daily Report
  const fetchDaily = async () => {
    try {
      setDailyLoading(true);
      const res = await api.get(`/reports/daily?date=${dailyDate}`);
      if (res.success) setDailyData(res);
    } catch (err) {
      console.error('Daily report error:', err);
    } finally {
      setDailyLoading(false);
    }
  };

  // 2. Fetch Monthly Report
  const fetchMonthly = async () => {
    try {
      setMonthlyLoading(true);
      const res = await api.get(`/reports/monthly?month=${monthlyMonth}&year=${monthlyYear}`);
      if (res.success) setMonthlyData(res);
    } catch (err) {
      console.error('Monthly report error:', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // 3. Fetch Profit Report
  const fetchProfit = async () => {
    try {
      setProfitLoading(true);
      const res = await api.get('/reports/profit');
      if (res.success) setProfitData(res);
    } catch (err) {
      console.error('Profit report error:', err);
    } finally {
      setProfitLoading(false);
    }
  };

  // 4. Fetch Sales Report
  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      const res = await api.get(`/reports/sales?period=${salesPeriod}`);
      if (res.success) setSalesData(res);
    } catch (err) {
      console.error('Sales report error:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  // 5. Fetch Purchases Report
  const fetchPurchases = async () => {
    try {
      setPurchaseLoading(true);
      const res = await api.get('/reports/purchases');
      if (res.success) setPurchaseData(res);
    } catch (err) {
      console.error('Purchases report error:', err);
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') fetchDaily();
    else if (activeTab === 'monthly') fetchMonthly();
    else if (activeTab === 'profit') fetchProfit();
    else if (activeTab === 'sales') fetchSales();
    else if (activeTab === 'purchases') fetchPurchases();
  }, [activeTab, dailyDate, monthlyMonth, monthlyYear, salesPeriod]);

  const handlePrintDaily = () => {
    window.print();
  };

  const handleExportCsv = (type: string) => {
    window.open(`/api/backup/export-csv/${type}`, '_blank');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-900">Reports & Business Analytics</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Financial auditing, profit calculations, daily sales, and stock movement reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCsv(activeTab === 'purchases' ? 'purchases' : 'sales')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Requirement 46) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
            activeTab === 'daily'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Daily Report
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
            activeTab === 'monthly'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Monthly Report
        </button>

        <button
          onClick={() => setActiveTab('profit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
            activeTab === 'profit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Profit Report (COGS)
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
            activeTab === 'sales'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Sales Report
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
            activeTab === 'purchases'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Purchase Report
        </button>
      </div>

      {/* 1. DAILY REPORT TAB (Requirement 24) */}
      {activeTab === 'daily' && (
        <div className="space-y-5">
          {/* Date Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-stone-700">Select Date:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="text-xs py-1.5 px-3 border rounded-xl font-medium"
              />
            </div>

            <button
              onClick={handlePrintDaily}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Day Sheet</span>
            </button>
          </div>

          {dailyLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading daily metrics...</div>
          ) : dailyData ? (
            <div className="space-y-5">
              {/* Daily KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Total Sales</p>
                  <p className="text-xl font-black text-stone-900 mt-1 font-mono">
                    ₹{dailyData.totalSales?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 inline-block">
                    {dailyData.totalBills} bills • {dailyData.totalItems} items
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Total Expenses</p>
                  <p className="text-xl font-black text-rose-600 mt-1 font-mono">
                    ₹{dailyData.totalExpenses?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-rose-500 mt-0.5 inline-block">Daily overhead</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
                  <p className="text-[11px] font-semibold text-emerald-800">Net Amount</p>
                  <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
                    ₹{dailyData.netAmount?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 inline-block">
                    Sales minus Expenses
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Khata Credit Sales</p>
                  <p className="text-xl font-black text-amber-700 mt-1 font-mono">
                    ₹{dailyData.paymentBreakdown?.credit?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-amber-600 mt-0.5 inline-block">Pending collection</span>
                </div>
              </div>

              {/* Payment Mode Distribution Bar */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Payment Collection Breakdown ({dailyDate})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border">
                    <p className="text-stone-500 font-medium">Cash Collected</p>
                    <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                      ₹{dailyData.paymentBreakdown?.cash || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border">
                    <p className="text-stone-500 font-medium">UPI QR Received</p>
                    <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                      ₹{dailyData.paymentBreakdown?.upi || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border">
                    <p className="text-stone-500 font-medium">Card Swipe</p>
                    <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                      ₹{dailyData.paymentBreakdown?.card || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border">
                    <p className="text-stone-500 font-medium">Khata Credit Issued</p>
                    <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                      ₹{dailyData.paymentBreakdown?.credit || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. MONTHLY REPORT TAB (Requirement 23) */}
      {activeTab === 'monthly' && (
        <div className="space-y-5">
          {/* Month & Year Selectors */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-stone-700">Period:</span>
            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(parseInt(e.target.value, 10))}
              className="text-xs py-1.5 px-3 border rounded-xl bg-white font-medium"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(parseInt(e.target.value, 10))}
              className="text-xs py-1.5 px-3 border rounded-xl bg-white font-medium"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {monthlyLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading monthly financial summary...</div>
          ) : monthlyData ? (
            <div className="space-y-5">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Gross Sales</p>
                  <p className="text-xl font-black text-stone-900 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.totalSales?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 inline-block">
                    {monthlyData.salesBreakdown?.numberOfInvoices} invoices
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Cost of Goods Sold (COGS)</p>
                  <p className="text-xl font-black text-stone-700 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.cogs?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 inline-block">Direct material cost</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Gross Profit</p>
                  <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.grossProfit?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 inline-block">Sales minus COGS</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-xs bg-emerald-50/30">
                  <p className="text-[11px] font-semibold text-emerald-800">Net Profit</p>
                  <p className="text-xl font-black text-emerald-800 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.netProfit?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-emerald-800 font-bold mt-0.5 inline-block">After all expenses</span>
                </div>
              </div>

              {/* Second row: Purchases, Expenses, Khata, Payables */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Purchases</p>
                  <p className="text-lg font-bold text-stone-900 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.totalPurchases?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Expenses</p>
                  <p className="text-lg font-bold text-rose-600 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.totalExpenses?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Customer Credit Outstanding</p>
                  <p className="text-lg font-bold text-amber-700 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.customerCredit?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Supplier Payables</p>
                  <p className="text-lg font-bold text-orange-700 mt-1 font-mono">
                    ₹{monthlyData.financialSummary?.supplierPayables?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 3. PROFIT REPORT TAB (Requirement 27) */}
      {activeTab === 'profit' && (
        <div className="space-y-5">
          {profitLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Calculating profit & loss...</div>
          ) : profitData ? (
            <div className="space-y-5">
              {/* Formula Explainer Banner */}
              <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Accurate Business Profit Formula</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 font-mono text-xs text-stone-200 border border-stone-800 space-y-1">
                  <p className="text-emerald-400 font-bold">Gross Revenue: ₹{profitData.grossRevenue}</p>
                  <p className="text-rose-400">- Cost of Goods Sold (COGS): ₹{profitData.cogs}</p>
                  <p className="text-amber-400">= Gross Profit: ₹{profitData.grossProfit} ({profitData.grossMarginPercent}%)</p>
                  <p className="text-rose-400">- Operating Expenses: ₹{profitData.totalExpenses}</p>
                  <p className="text-emerald-400 text-sm font-black border-t border-stone-800 pt-1">
                    = Net Profit: ₹{profitData.netProfit} ({profitData.netMarginPercent}%)
                  </p>
                </div>
                <p className="text-[11px] text-stone-400">
                  Note: Profit is accurately computed on items sold, rather than raw procurement purchases, preserving inventory value.
                </p>
              </div>

              {/* Expense Category Breakdown Table */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Operating Overhead Breakdown
                </h3>
                <div className="divide-y divide-stone-100">
                  {profitData.expenseBreakdown?.map((ex: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700">{ex.category}</span>
                      <span className="font-mono font-bold text-stone-900">₹{ex.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 4. SALES REPORT TAB (Requirement 25) */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center space-x-2">
            <span className="text-xs font-bold text-stone-700">Period:</span>
            <select
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
              className="text-xs py-1.5 px-3 border rounded-xl bg-white font-medium"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {salesLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading sales analytics...</div>
          ) : salesData ? (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900">Sales Trend Over Time</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData.salesTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} />
                      <Area type="monotone" dataKey="amount" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Top-Selling Menu Items
                </h3>
                <div className="divide-y divide-stone-100">
                  {salesData.topProducts?.map((p: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-900">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 mr-3">{p.quantity} units</span>
                        <span className="font-mono font-bold text-amber-700">₹{p.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 5. PURCHASES REPORT TAB (Requirement 26) */}
      {activeTab === 'purchases' && (
        <div className="space-y-5">
          {purchaseLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading purchase reports...</div>
          ) : purchaseData ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Total Purchase Orders</p>
                  <p className="text-xl font-black text-stone-900 mt-1 font-mono">
                    {purchaseData.purchaseCount || 0}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Total Procured Outflow</p>
                  <p className="text-xl font-black text-purple-700 mt-1 font-mono">
                    ₹{purchaseData.totalPurchaseAmount?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <p className="text-[11px] font-semibold text-stone-500">Outstanding Supplier Payables</p>
                  <p className="text-xl font-black text-orange-700 mt-1 font-mono">
                    ₹{purchaseData.outstandingSupplierBalance?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Supplier Wise Table */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Supplier-wise Procurement Share
                </h3>
                <div className="divide-y divide-stone-100">
                  {purchaseData.supplierPurchases?.map((s: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">{s.name} ({s.count} orders)</span>
                      <span className="font-mono font-bold text-purple-700">₹{s.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
