import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import RunsPage from './pages/RunsPage';
import RunDetailPage from './pages/RunDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/runs" element={<RunsPage />} />
      <Route path="/runs/:runId" element={<RunDetailPage />} />
    </Routes>
  );
}