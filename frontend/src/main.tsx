import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import LoginPage from './pages/LoginPage';
import PasswordResetRequest from './pages/PasswordResetRequest';
import PasswordResetConfirm from './pages/PasswordResetConfirm';
import Dashboard from './pages/Dashboard';

import './global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<PasswordResetRequest />} />
            <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
            <Route path="/*" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
