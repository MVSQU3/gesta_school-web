import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

/**
 * Page d'accueil correspondant au rôle de l'utilisateur.
 *
 * Sans cette résolution, un profil qui n'a pas accès à « / » — un enseignant,
 * un comptable — serait redirigé vers « / », page elle-même interdite, donc
 * redirigé indéfiniment.
 */
export function homeRouteForRoles(roles: Role[]): string {
  if (roles.includes(Role.SUPER_ADMIN)) return '/admin';
  if (roles.includes(Role.DIRECTOR)) return '/direction';
  if (roles.includes(Role.SECRETARY)) return '/';
  if (roles.includes(Role.ACCOUNTANT)) return '/caisse';
  if (roles.includes(Role.TEACHER)) return '/enseignant';
  return '/login';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, hasAnyRole } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    const home = homeRouteForRoles(user.roles);

    // Si l'accueil du rôle est lui-même refusé, on affiche un message plutôt
    // que de renvoyer vers une page qui redirigerait à son tour.
    if (home === location.pathname) {
      return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-lg mx-auto mt-10">
          <h2 className="text-lg font-bold text-slate-900">Accès non autorisé</h2>
          <p className="text-sm text-slate-500 mt-2">
            Votre compte ne dispose pas des droits nécessaires pour cette page.
            Rapprochez-vous de la direction de l'établissement.
          </p>
        </div>
      );
    }

    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};
