import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { School as SchoolIcon, UserCheck, CreditCard, Building2, ShieldCheck, Users, GraduationCap, CalendarCheck, Award, KeyRound } from 'lucide-react';
import { useSchoolStore } from '../store/useSchoolStore';
import { useSchools } from '../hooks/useSchools';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Navbar: React.FC = () => {
  const { currentSchool, setCurrentSchool } = useSchoolStore();
  const { data: schools = [], isLoading } = useSchools();
  const { user, hasRole, hasAnyRole, logout } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (schools.length > 0) {
      // Si l'utilisateur est rattaché à une école spécifique (et n'est pas SUPER_ADMIN naviguant partout)
      if (user && user.schoolId && !hasRole(Role.SUPER_ADMIN)) {
        const userSchool = schools.find((s) => s.id === user.schoolId);
        if (userSchool && currentSchool?.id !== userSchool.id) {
          setCurrentSchool(userSchool);
        }
      } 
      // Sinon, on initialise avec la première école par défaut s'il n'y en a pas encore
      else if (!currentSchool) {
        setCurrentSchool(schools[0]);
      }
    }
  }, [schools, currentSchool, setCurrentSchool, user, hasRole]);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Titre App */}
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <SchoolIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">Gesta_School</h1>
            <p className="text-xs text-indigo-400 font-medium">Enrôlement Éclair & Caisse MVP</p>
          </div>
        </div>

        {/* Sélecteur d'établissement Multi-Tenant (Visible uniquement si Super Admin ou Directeur, sinon on affiche l'école de l'utilisateur) */}
        {hasAnyRole([Role.SUPER_ADMIN]) && (
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Établissement:</span>
          <select
            className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
            value={currentSchool?.id || ''}
            onChange={(e) => {
              const selected = schools.find((s) => s.id === e.target.value);
              if (selected) setCurrentSchool(selected);
            }}
          >
            {isLoading ? (
              <option value="" disabled className="bg-slate-900">Chargement...</option>
            ) : schools.length === 0 ? (
              <option value="" disabled className="bg-slate-900">Aucune école disponible</option>
            ) : (
              schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.slug})
                </option>
              ))
            )}
          </select>
        </div>
        )}

        {/* Liens de Navigation Rôles */}
        <nav className="flex items-center space-x-2">
          {hasAnyRole([Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY]) && (
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <UserCheck className="w-4 h-4" />
              <span>Secrétariat</span>
            </NavLink>
          )}

          {hasAnyRole([Role.SUPER_ADMIN, Role.DIRECTOR, Role.ACCOUNTANT]) && (
            <NavLink
              to="/caisse"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>Caisse</span>
            </NavLink>
          )}

          {hasAnyRole([Role.DIRECTOR]) && (
            <NavLink
              to="/direction"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Users className="w-4 h-4" />
              <span>Direction</span>
            </NavLink>
          )}

          {hasAnyRole([Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY]) && (
            <NavLink
              to="/bulletins"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Award className="w-4 h-4" />
              <span>Bulletins</span>
            </NavLink>
          )}

          {hasAnyRole([Role.SECRETARY, Role.TEACHER]) && (
            <NavLink
              to="/absences"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Absences</span>
            </NavLink>
          )}

          {hasAnyRole([Role.TEACHER]) && (
            <NavLink
              to="/enseignant"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <GraduationCap className="w-4 h-4" />
              <span>Enseignant</span>
            </NavLink>
          )}

          {hasRole(Role.SUPER_ADMIN) && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Super-Admin</span>
            </NavLink>
          )}
          
          <div className="ml-4 pl-4 border-l border-slate-700 flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-200">{user?.email}</p>
              <p className="text-[10px] text-slate-400">{user?.roles.join(', ')}</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              title="Changer mon mot de passe"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="text-xs bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </nav>
      </div>
    {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </header>
  );
};
