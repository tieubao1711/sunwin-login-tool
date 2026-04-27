import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RunsPage from './pages/RunsPage';
import RunDetailPage from './pages/RunDetailPage';
import RunStatsPage from './pages/RunStatsPage';
import AccountsPage from './pages/AccountsPage';
import ProtectedRoute from './components/ProtectedRoute';
import CentralMonitorPage from './pages/CentralMonitorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/runs"
        element={
          <ProtectedRoute>
            <RunsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/runs/:runId"
        element={
          <ProtectedRoute>
            <RunDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/runs/:runId/stats"
        element={
          <ProtectedRoute>
            <RunStatsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AccountsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/central-monitor" element={<CentralMonitorPage />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}