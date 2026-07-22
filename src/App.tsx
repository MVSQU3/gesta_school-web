import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { SecretariatPage } from './pages/SecretariatPage';
import { CaissePage } from './pages/CaissePage';
import { AdminSchoolsPage } from './pages/AdminSchoolsPage';
import { DirectionPage } from './pages/DirectionPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { Role } from './types';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
};

const AppContent: React.FC = () => {
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {token && <Navbar />}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route 
            path="/"
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY]}>
                <SecretariatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/caisse" 
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.DIRECTOR, Role.ACCOUNTANT]}>
                <CaissePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                <AdminSchoolsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/direction" 
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.DIRECTOR]}>
                <DirectionPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 font-mono">
        Gesta School MVP v1.1 - Enrôlement Éclair (72h), Caisse & Administration
      </footer>
    </div>
  );
};

export default App;
