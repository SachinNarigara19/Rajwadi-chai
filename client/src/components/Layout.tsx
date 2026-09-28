import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Receipt,
  Users,
  Building2,
  Wallet,
  BarChart3,
  UserCheck,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';
import { Footer } from './Footer';
import { api } from '../api/client';

export const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch live notifications count
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await api.get<{ success: boolean; notifications: any[] }>('/notifications');
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
      }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K and F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20 translate-x-1'
        : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
    }`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium transition ${
      isActive ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
    }`;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-stone-950 text-white border-b border-amber-600/30 shadow-md">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Left Brand Area */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <NavLink to="/" className="flex items-center space-x-2.5 group">
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 opacity-50 blur-xs group-hover:opacity-80 transition duration-300"></div>
                <img
                  src="/logo.png"
                  alt="Jay Mataji Rajwadi Chai"
                  className="relative w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/70 shadow-md group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                    JAY MATAJI
                  </span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] border border-amber-500/30">
                    RAJWADI CHAI
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium tracking-wide">
                  POS & Inventory Management System
                </p>
              </div>
            </NavLink>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick POS New Bill Button */}
            <NavLink
              to="/pos"
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-amber-500/20 transition transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">POS Billing (F2)</span>
              <span className="sm:hidden">POS</span>
            </NavLink>

            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center space-x-2 bg-stone-900 hover:bg-stone-800 text-stone-300 px-3 py-1.5 rounded-xl border border-stone-800 text-xs transition"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] bg-stone-800 rounded-md text-stone-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* User Profile & Role */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-stone-800">
              <div className="w-8 h-8 rounded-full bg-stone-800 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs uppercase shadow-inner">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-stone-200 leading-tight">{user?.name}</p>
                <span className="inline-block text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  {user?.role === 'ADMIN' ? '👑 Owner Admin' : user?.role === 'CASHIER' ? '💳 Cashier' : '📦 Stock Manager'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-stone-900 text-stone-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col justify-between border-r border-stone-800 shadow-xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Nav */}
          <div className="p-3.5 space-y-1 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800 lg:hidden">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Logo" className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500/60" />
                <span className="text-xs font-bold text-amber-400">NAVIGATION MENU</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <NavLink to="/" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 text-amber-500" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/pos" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>POS Billing</span>
            </NavLink>

            <NavLink to="/products" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Package className="w-4 h-4 text-sky-400" />
              <span>Products & Items</span>
            </NavLink>

            <NavLink to="/inventory" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>Stock & Valuation</span>
            </NavLink>

            <NavLink to="/sales" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Sales & Invoices</span>
            </NavLink>

            <NavLink to="/purchases" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Truck className="w-4 h-4 text-purple-400" />
              <span>Purchases (PO)</span>
            </NavLink>

            <NavLink to="/customers" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Customers & Khata</span>
            </NavLink>

            <NavLink to="/suppliers" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Suppliers & Payables</span>
            </NavLink>

            <NavLink to="/expenses" onClick={() => setSidebarOpen(false)} className={navItemClass}>
              <Wallet className="w-4 h-4 text-rose-400" />
              <span>Expenses</span>
            </NavLink>

            {/* Reports Dropdown Group (Requirement 46) */}
            <div>
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Reports</span>
                </div>
                {reportsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {reportsOpen && (
                <div className="py-1 space-y-0.5 bg-stone-950/40 rounded-xl my-1 border border-stone-800/50">
                  <NavLink to="/reports/daily" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Daily Report</span>
                  </NavLink>
                  <NavLink to="/reports/monthly" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Monthly Report</span>
                  </NavLink>
                  <NavLink to="/reports/sales" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Sales Report</span>
                  </NavLink>
                  <NavLink to="/reports/purchases" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Purchase Report</span>
                  </NavLink>
                  <NavLink to="/reports/profit" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Profit Report (COGS)</span>
                  </NavLink>
                  <NavLink to="/reports/inventory" onClick={() => setSidebarOpen(false)} className={subNavItemClass}>
                    <span>• Inventory Valuation</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Admin Only Items */}
            {hasRole(['ADMIN']) && (
              <>
                <NavLink to="/staff" onClick={() => setSidebarOpen(false)} className={navItemClass}>
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <span>Staff & Roles</span>
                </NavLink>

                <NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={navItemClass}>
                  <Settings className="w-4 h-4 text-stone-400" />
                  <span>Settings & Shop Info</span>
                </NavLink>

                <NavLink to="/audit-logs" onClick={() => setSidebarOpen(false)} className={navItemClass}>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Security Audit Logs</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400">
            <div className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/50 shadow-sm shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-200 truncate text-xs">Jay Mataji Rajwadi Chai</span>
                  <span className="text-amber-500 font-bold font-mono text-[10px]">v1.0.0</span>
                </div>
                <p className="text-[10px] text-stone-500">Commercial Shop POS</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-2xs lg:hidden"
          ></div>
        )}

        {/* Content Outlet & Global Footer */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
      />
    </div>
  );
};
