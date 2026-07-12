import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';

// Route protection wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-label-caps text-label-caps uppercase animate-pulse">
        Securing terminal node connection...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <span className="material-symbols-outlined text-error text-5xl">gpp_bad</span>
        <h2 className="font-headline-md text-headline-md text-error uppercase font-bold">Access Denied</h2>
        <p className="text-on-surface-variant max-w-md font-body-sm">
          Your current operator credentials ({user.role}) are unauthorized to inspect this ledger node.
        </p>
      </div>
    );
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* Secure control room routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="trips" element={<Trips />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="expenses" element={<Expenses />} />
            <Route
              path="analytics"
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
