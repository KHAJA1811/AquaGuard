import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Monitoring from "@/pages/Monitoring";
import Analysis from "@/pages/Analysis";
import Prediction from "@/pages/Prediction";
import Anomalies from "@/pages/Anomalies";
import Alerts from "@/pages/Alerts";
import History from "@/pages/History";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Monitoring />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Analysis />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prediction"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Prediction />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/anomalies"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Anomalies />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Alerts />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <History />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </AppProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
