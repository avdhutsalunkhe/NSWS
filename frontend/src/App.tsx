import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProductionPage } from './pages/ProductionPage';
import { DispatchesPage } from './pages/DispatchesPage';
import { ImportsExportsPage } from './pages/ImportsExportsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PackagingPage } from './pages/PackagingPage';
import { CaneDuesPage } from './pages/CaneDuesPage';
import { P2ReportsPage } from './pages/P2ReportsPage';
import { PlantsMaster } from './pages/PlantsMaster';
import { SeasonsMaster } from './pages/SeasonsMaster';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { IntegrationSettingsPage } from './pages/IntegrationSettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Protected Route Component
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Authenticating Directorate Portal...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen w-full bg-white text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Login Route Guard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard (Clerks are strictly blocked from master tables and admin tools)
const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProtectedLayout>{children}</ProtectedLayout>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Clerk & Admin Shared Operational Routes */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/production"
        element={
          <ProtectedLayout>
            <ProductionPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/dispatches"
        element={
          <ProtectedLayout>
            <DispatchesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/imports-exports"
        element={
          <ProtectedLayout>
            <ImportsExportsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedLayout>
            <InventoryPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/packaging"
        element={
          <ProtectedLayout>
            <PackagingPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/cane-dues"
        element={
          <ProtectedLayout>
            <CaneDuesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/regulatory/p2-reports"
        element={
          <ProtectedLayout>
            <P2ReportsPage />
          </ProtectedLayout>
        }
      />

      {/* Admin-Only Master Tables & System Settings (Clerk is blocked) */}
      <Route
        path="/masters/plants"
        element={
          <AdminOnlyRoute>
            <PlantsMaster />
          </AdminOnlyRoute>
        }
      />
      <Route
        path="/sugar-seasons"
        element={
          <AdminOnlyRoute>
            <SeasonsMaster />
          </AdminOnlyRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <AdminOnlyRoute>
            <ReportsAnalyticsPage />
          </AdminOnlyRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminOnlyRoute>
            <UsersManagementPage />
          </AdminOnlyRoute>
        }
      />
      <Route
        path="/admin/integrations"
        element={
          <AdminOnlyRoute>
            <IntegrationSettingsPage />
          </AdminOnlyRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminOnlyRoute>
            <AuditLogsPage />
          </AdminOnlyRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <AppContent />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
