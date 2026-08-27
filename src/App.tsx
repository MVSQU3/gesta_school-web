import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { MobileTopBar } from './components/MobileTopBar';
import { SecretariatPage } from './pages/SecretariatPage';
import { CaissePage } from './pages/CaissePage';
import { AdminSchoolsPage } from './pages/AdminSchoolsPage';
import { DirectionPage } from './pages/DirectionPage';
import { TeacherPage } from './pages/TeacherPage';
import { ParentPage } from './pages/ParentPage';
import { AbsencesPage } from './pages/AbsencesPage';
import { BulletinsPage } from './pages/BulletinsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { useAuthStore } from './store/useAuthStore';
import { useSessionRestore } from './hooks/useSessionRestore';
import { useSidebarStore } from './store/useSidebarStore';
import { Role } from './types';
import { queryClient } from './api/queryClient';


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
  const user = useAuthStore((s) => s.user);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  // Interroge /auth/me au demarrage : le jeton etant invisible, seul le
  // serveur peut confirmer qui est connecte.
  useSessionRestore();

  // Mot de passe provisoire : l'application entière est remplacée par l'écran
  // de changement. Le serveur refuse de toute façon toute autre route.
  if (user?.mustChangePassword) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <ForcePasswordChange />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {user && <Sidebar />}

      {/*
        Le contenu se décale de la largeur de la barre, et suit son animation :
        la même durée et la même courbe que l'`aside`, sans quoi la grille
        rattraperait la barre par à-coups. Sous `lg` le décalage est nul — la
        barre y est un tiroir qui passe par-dessus le contenu.
      */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out ${
          user ? (isCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64') : ''
        }`}
      >
        {user && <MobileTopBar />}

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
              <ProtectedRoute allowedRoles={[Role.DIRECTOR]}>
                <DirectionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bulletins"
            element={
              <ProtectedRoute
                allowedRoles={[Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY]}
              >
                <BulletinsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/absences"
            element={
              <ProtectedRoute
                allowedRoles={[
                  Role.SUPER_ADMIN,
                  Role.DIRECTOR,
                  Role.SECRETARY,
                  Role.TEACHER,
                ]}
              >
                <AbsencesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mon-espace"
            element={
              <ProtectedRoute allowedRoles={[Role.PARENT]}>
                <ParentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/enseignant"
            element={
              <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.DIRECTOR, Role.TEACHER]}>
                <TeacherPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 font-mono">
          Gesta School MVP v1.1 - Caisse & Administration
        </footer>
      </div>
    </div>
  );
};

export default App;
