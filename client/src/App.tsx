import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PosBilling } from './pages/PosBilling';
import { Products } from './pages/Products';
import { ProductStockHistory } from './pages/ProductStockHistory';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Staff } from './pages/Staff';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-amber-400">Loading Jay Mataji Rajwadi Chai...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<PosBilling />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductStockHistory />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/:id" element={<Sales />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/:id" element={<Suppliers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports/*" element={<Reports />} />

            {/* Admin Only Routes */}
            <Route
              path="staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
