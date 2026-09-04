import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import DemoSimulationBar from './components/common/DemoSimulationBar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HotelDashboard from './pages/hotel/HotelDashboard';
import DonateFoodPage from './pages/hotel/DonateFoodPage';
import NgoDashboard from './pages/ngo/NgoDashboard';
import RequestFoodPage from './pages/ngo/RequestFoodPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import MatchingConsole from './pages/admin/MatchingConsole';
import DeliveriesPage from './pages/admin/DeliveriesPage';
import ConfigPage from './pages/admin/ConfigPage';
import ReportsPage from './pages/admin/ReportsPage';
import MapOverviewPage from './pages/admin/MapOverviewPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user.role !== 'ADMIN' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Demo Scenario Testbench Bar */}
      <DemoSimulationBar />

      {/* Main Top Navigation */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/map" element={<MapOverviewPage />} />

          {/* Hotel Routes */}
          <Route
            path="/hotel/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HOTEL']}>
                <HotelDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donate"
            element={
              <ProtectedRoute allowedRoles={['HOTEL']}>
                <DonateFoodPage />
              </ProtectedRoute>
            }
          />

          {/* NGO Routes */}
          <Route
            path="/ngo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['NGO']}>
                <NgoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-food"
            element={
              <ProtectedRoute allowedRoles={['NGO']}>
                <RequestFoodPage />
              </ProtectedRoute>
            }
          />

          {/* Admin & System Matching Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HOTEL']}>
                <MatchingConsole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HOTEL', 'NGO']}>
                <DeliveriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
