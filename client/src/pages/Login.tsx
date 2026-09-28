import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, User, KeyRound, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { Footer } from '../components/Footer';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ success: boolean; token: string; user: any }>('/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 w-full relative z-10 my-4 sm:my-8">
        <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 opacity-70 blur-md animate-pulse"></div>
            <img
              src="/logo.png"
              alt="Jay Mataji Rajwadi Chai"
              className="relative w-28 h-28 rounded-full object-cover ring-4 ring-amber-500/80 shadow-2xl mx-auto transform hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-300 tracking-wide uppercase">
              Jay Mataji Rajwadi Chai
            </h1>
            <p className="text-xs text-amber-400/90 font-medium mt-1">
              POS, Billing & Inventory Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-800 p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-amber-600/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to POS Counter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="pt-4 border-t border-stone-800">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Switcher (Pre-configured Demo Accounts)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin', 'admin123')}
                className={`p-2 rounded-xl border text-center transition ${
                  username === 'admin'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <p className="text-[11px] font-bold">👑 Admin</p>
                <p className="text-[9px] text-stone-500">Owner Access</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('cashier', 'cashier123')}
                className={`p-2 rounded-xl border text-center transition ${
                  username === 'cashier'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <p className="text-[11px] font-bold">💳 Cashier</p>
                <p className="text-[9px] text-stone-500">POS & Billing</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('manager', 'manager123')}
                className={`p-2 rounded-xl border text-center transition ${
                  username === 'manager'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <p className="text-[11px] font-bold">📦 Manager</p>
                <p className="text-[9px] text-stone-500">Stock & Purchases</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-stone-500">
          Jay Mataji Rajwadi Chai • Secure JWT Database Authentication
        </p>
        </div>
      </div>

      {/* Global Bottom Shop Details & Instagram */}
      <Footer />
    </div>
  );
};
