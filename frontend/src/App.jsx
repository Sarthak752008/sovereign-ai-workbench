import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import WorkbenchApp from './pages/WorkbenchApp.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/workbench" element={<WorkbenchApp />} />
      {/* Fallback: redirect any unknown path to landing */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
