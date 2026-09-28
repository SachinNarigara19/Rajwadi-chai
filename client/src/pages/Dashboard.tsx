import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Boxes,
  PlusCircle,
  FileText,
  Users,
  CreditCard,
  ArrowUpRight,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../api/client';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const COLORS = ['#d97706', '#ea580c', '#ca8a04', '#0284c7', '#10b981', '#8b5cf6', '#f43f5e'];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-stone-500">Loading Jay Mataji Rajwadi Chai statistics...</p>
        </div>
      </div>
    );
  }

  const today = stats?.todaySummary || {};
  const inventory = stats?.inventory || {};
  const analytics = stats?.analytics || {};

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-amber-600/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative shrink-0 hidden sm:block">
              <div className="absolute -inset-1 rounded-full bg-amber-500 opacity-40 blur-xs"></div>
              <img
                src="/logo.png"
                alt="Jay Mataji Rajwadi Chai"
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-amber-500/70 shadow-lg"
              />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>Authentic Royal Brew • Jay Mataji</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Jay Mataji Rajwadi Chai Counter
              </h1>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Live shop overview, sales velocity, and inventory movement for{' '}
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <NavLink
              to="/pos"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/30 transition transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Open POS Billing (F2)</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <NavLink
          to="/pos"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">New Bill</span>
          <span className="text-[10px] text-amber-800">Quick POS</span>
        </NavLink>

        <NavLink
          to="/products"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">Add Product</span>
          <span className="text-[10px] text-sky-800">Catalogue</span>
        </NavLink>

        <NavLink
          to="/purchases"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">Add Purchase</span>
          <span className="text-[10px] text-purple-800">Procure Stock</span>
        </NavLink>

        <NavLink
          to="/customers"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">Add Customer</span>
          <span className="text-[10px] text-cyan-800">Credit / Khata</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">View Stock</span>
          <span className="text-[10px] text-emerald-800">Valuation</span>
        </NavLink>

        <NavLink
          to="/reports/sales"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition text-stone-900 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">Sales Report</span>
          <span className="text-[10px] text-rose-800">Analytics</span>
        </NavLink>
      </div>

      {/* Today's Summary & Financial Cards (Requirement 4) */}
      <div>
        <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">
          Today's Live Performance Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Sales */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[11px] font-semibold text-stone-500">Today's Sales</p>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1 font-mono">
              ₹{today.todaySales?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-0.5" /> {today.billsCount || 0} Bills
            </span>
          </div>

          {/* Purchases */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[11px] font-semibold text-stone-500">Today's Purchases</p>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1 font-mono">
              ₹{today.todayPurchases?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[10px] text-purple-600 font-semibold mt-1 inline-block">
              Stock Inward
            </span>
          </div>

          {/* Expenses */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[11px] font-semibold text-stone-500">Today's Expenses</p>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1 font-mono">
              ₹{today.todayExpenses?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[10px] text-rose-600 font-semibold mt-1 inline-block">
              Shop Outflow
            </span>
          </div>

          {/* Profit */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <p className="text-[11px] font-semibold text-emerald-800">Today's Net Profit</p>
            <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1 font-mono">
              ₹{today.todayProfit?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
              Real Margin (COGS)
            </span>
          </div>

          {/* Bills */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[11px] font-semibold text-stone-500">Number of Bills</p>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1 font-mono">
              {today.billsCount || 0}
            </p>
            <span className="text-[10px] text-stone-500 mt-1 inline-block">Invoices today</span>
          </div>

          {/* Items Sold */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[11px] font-semibold text-stone-500">Items Sold</p>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1 font-mono">
              {today.itemsSold || 0}
            </p>
            <span className="text-[10px] text-stone-500 mt-1 inline-block">Cups & packets</span>
          </div>

          {/* Outstanding Khata */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
            <p className="text-[11px] font-semibold text-amber-800">Total Khata Credit</p>
            <p className="text-lg sm:text-xl font-black text-amber-800 mt-1 font-mono">
              ₹{today.outstandingCredit?.toLocaleString('en-IN') || 0}
            </p>
            <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">
              Outstanding Receivable
            </span>
          </div>
        </div>
      </div>

      {/* Inventory & Stock Deduction Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Inventory & Warehouse Status
            </h2>
            <p className="text-[11px] text-stone-500">
              Live Stock Deduction: Total Stock − Customer Purchases = Remaining Stock in Hand
            </p>
          </div>
          <NavLink
            to="/inventory"
            className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition"
          >
            <span>Open Stock Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* Live Customer Stock Deduction Formula Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl border border-amber-600/30 p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Customer Buy Stock Deduction Tracker</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white">
              Total Stock <span className="text-stone-400 font-normal">minus</span> Customer Purchases <span className="text-stone-400 font-normal">equals</span> Remaining Stock
            </p>
            <p className="text-[11px] text-stone-400 max-w-xl">
              When a customer buys items at the counter, stock is automatically subtracted from Total Stock. 
              The live remaining stock is instantly updated on your dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800 shadow-inner">
            {/* Total Stock */}
            <div className="text-center px-3 py-1 bg-stone-900 rounded-lg border border-stone-800">
              <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Total Stock</p>
              <p className="text-base sm:text-lg font-black text-amber-400 font-mono mt-0.5">
                {((inventory.totalInitialStock ?? ((inventory.totalStockQuantity || 0) + (inventory.totalSoldQuantity || 0))) || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[8px] text-stone-500 font-medium">Inward</span>
            </div>

            <div className="text-lg font-black text-rose-500 px-0.5">−</div>

            {/* Customer Purchases */}
            <div className="text-center px-3 py-1 bg-rose-950/30 rounded-lg border border-rose-900/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400">Customer Buy</p>
              <p className="text-base sm:text-lg font-black text-rose-400 font-mono mt-0.5">
                {(inventory.totalSoldQuantity || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[8px] text-rose-300 font-medium">Units Sold</span>
            </div>

            <div className="text-lg font-black text-emerald-400 px-0.5">=</div>

            {/* Remaining Stock */}
            <div className="text-center px-3 py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Remaining</p>
              <p className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
                {(inventory.totalStockQuantity || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[8px] text-emerald-300 font-medium">In Hand</span>
            </div>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">Total Products</p>
              <p className="text-xl font-black text-stone-900 mt-0.5">{inventory.totalProducts || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between bg-amber-50/10">
            <div>
              <p className="text-[11px] font-semibold text-amber-900">Total Stock (Inward)</p>
              <p className="text-xl font-black text-amber-700 mt-0.5 font-mono">
                {((inventory.totalInitialStock ?? ((inventory.totalStockQuantity || 0) + (inventory.totalSoldQuantity || 0))) || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between bg-rose-50/10">
            <div>
              <p className="text-[11px] font-semibold text-rose-900">Customer Buy (Sold)</p>
              <p className="text-xl font-black text-rose-700 mt-0.5 font-mono">
                {(inventory.totalSoldQuantity || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between bg-emerald-50/20">
            <div>
              <p className="text-[11px] font-semibold text-emerald-900">Remaining Stock</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                {(inventory.totalStockQuantity || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/30">
            <div>
              <p className="text-[11px] font-semibold text-amber-800">Low Stock Alert</p>
              <p className="text-xl font-black text-amber-700 mt-0.5">{inventory.lowStockProducts || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500">Stock Valuation</p>
              <p className="text-lg font-black text-stone-900 mt-0.5 font-mono">
                ₹{inventory.inventoryValue?.toLocaleString('en-IN') || 0}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts (Requirement 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Last 7 Days Sales Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">7-Day Sales Trend & Revenue</h3>
              <p className="text-xs text-stone-500">Daily billing totals</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Live Tracker
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.last7DaysSales || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Sales by Category</h3>
            <p className="text-xs text-stone-500">Distribution across product lines</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {analytics.salesByCategory && analytics.salesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {analytics.salesByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Sales']}
                    contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">No category sales recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Today's Hourly Sales & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Today's Hourly Sales Velocity</h3>
              <p className="text-xs text-stone-500">Peak tea stall hours tracker</p>
            </div>
            <Clock className="w-4 h-4 text-stone-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.todayHourlySales || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Top-Selling Products</h3>
              <p className="text-xs text-stone-500">Highest volume items</p>
            </div>
            <span className="text-xs text-amber-700 font-semibold">Favorites</span>
          </div>

          <div className="divide-y divide-stone-100">
            {analytics.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
              analytics.topSellingProducts.map((p: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-stone-900">{p.name}</p>
                      <p className="text-[11px] text-stone-500">{p.quantity} units sold</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-stone-900 font-mono">₹{p.revenue}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-6 text-center">No sales registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
