import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  School as SchoolIcon,
  UserCheck,
  CreditCard,
  Building2,
  ShieldCheck,
  Users,
  GraduationCap,
  CalendarCheck,
  HeartHandshake,
  Award,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useSchoolStore } from "../store/useSchoolStore";
import { useSchools } from "../hooks/useSchools";
import { useAuthStore } from "../store/useAuthStore";
import { useSidebarStore } from "../store/useSidebarStore";
import { Role } from "../types";
import { ChangePasswordModal } from "./ChangePasswordModal";

/**
 * Une entrée de navigation et les rôles qui y donnent accès.
 *
 * Les liens étaient auparavant sept blocs JSX quasi identiques, ne différant
 * que par leur icône et leur couleur active. Les décrire en données évite
 * qu'une correction de style n'en oublie un au passage.
 */
interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  /** Classes appliquées quand la route est active. */
  active: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Secrétariat",
    icon: UserCheck,
    roles: [Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY],
    active: "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
  },
  {
    to: "/caisse",
    label: "Caisse",
    icon: CreditCard,
    roles: [Role.SUPER_ADMIN, Role.DIRECTOR, Role.ACCOUNTANT],
    active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
  },
  {
    to: "/direction",
    label: "Direction",
    icon: Users,
    roles: [Role.DIRECTOR],
    active: "bg-blue-600 text-white shadow-md shadow-blue-600/20",
  },
  {
    to: "/bulletins",
    label: "Bulletins",
    icon: Award,
    roles: [Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY],
    active: "bg-emerald-700 text-white shadow-md shadow-emerald-700/20",
  },
  {
    to: "/absences",
    label: "Absences",
    icon: CalendarCheck,
    roles: [Role.DIRECTOR, Role.SECRETARY, Role.TEACHER],
    active: "bg-amber-600 text-white shadow-md shadow-amber-600/20",
  },
  {
    to: "/enseignant",
    label: "Enseignant",
    icon: GraduationCap,
    roles: [Role.TEACHER],
    active: "bg-violet-600 text-white shadow-md shadow-violet-600/20",
  },
  {
    to: "/mon-espace",
    label: "Mes enfants",
    icon: HeartHandshake,
    roles: [Role.PARENT],
    active: "bg-rose-600 text-white shadow-md shadow-rose-600/20",
  },
  {
    to: "/admin",
    label: "Super-Admin",
    icon: ShieldCheck,
    roles: [Role.SUPER_ADMIN],
    active:
      "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20",
  },
];

export const Sidebar: React.FC = () => {
  const { currentSchool, setCurrentSchool } = useSchoolStore();
  const { data: schools = [], isLoading } = useSchools();
  const { user, hasRole, hasAnyRole, logout } = useAuthStore();
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } =
    useSidebarStore();
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const location = useLocation();

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

  /**
   * Le tiroir mobile se referme dès que la route change. Sans cela, il
   * resterait ouvert par-dessus l'écran que l'utilisateur vient de demander.
   */
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  /** Échap referme le tiroir, comme tout calque modal. */
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileOpen, closeMobile]);

  const visibleItems = NAV_ITEMS.filter((item) => hasAnyRole(item.roles));

  return (
    <>
      {/*
        Calque d'assombrissement, sous `lg` uniquement : il capte le clic hors
        du tiroir, geste attendu pour le refermer sur mobile.
      */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900 text-white
          transition-[width,transform] duration-300 ease-in-out
          ${isCollapsed ? "w-[4.5rem]" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* En-tête : logo, et fermeture du tiroir sur mobile */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-800 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-600/30">
              <SchoolIcon className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight tracking-wide">
                  Gesta School
                </h1>
                <p className="truncate text-xs font-medium text-indigo-400">
                  Enrôlement Éclair &amp; Caisse
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={closeMobile}
              title="Fermer le menu"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/*
          Sélecteur d'établissement — réservé au Super-Admin, seul à naviguer
          entre plusieurs écoles. Masqué en mode réduit : un `select` n'a pas
          de forme lisible en 72 pixels.
        */}
        {hasRole(Role.SUPER_ADMIN) && !isCollapsed && (
          <div className="border-b border-slate-800 px-4 py-3">
            <label className="mb-1.5 flex items-center space-x-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Building2 className="h-3 w-3 text-indigo-400" />
              <span>Établissement</span>
            </label>
            <select
              className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={currentSchool?.id || ""}
              onChange={(e) => {
                const selected = schools.find((s) => s.id === e.target.value);
                if (selected) setCurrentSchool(selected);
              }}
            >
              {isLoading ? (
                <option value="" disabled className="bg-slate-900">
                  Chargement...
                </option>
              ) : schools.length === 0 ? (
                <option value="" disabled className="bg-slate-900">
                  Aucune école disponible
                </option>
              ) : (
                schools.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-slate-900 text-white"
                  >
                    {s.name} ({s.slug})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/*
          Liens de navigation. `overflow-y-auto` : sur un écran bas, sept
          entrées plus le pied de barre dépassent — la liste défile, le pied
          reste ancré.
        */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {visibleItems.map(({ to, label, icon: Icon, active }) => (
            <NavLink
              key={to}
              to={to}
              // `end` sur la racine : sans cela, "/" resterait actif sur toutes
              // les autres routes, qui commencent toutes par "/".
              end={to === "/"}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg py-2.5 text-sm font-medium transition-all ${
                  isCollapsed ? "justify-center px-2" : "space-x-3 px-3.5"
                } ${
                  isActive
                    ? active
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Pied de barre : identité, mot de passe, déconnexion */}
        <div className="shrink-0 border-t border-slate-800 p-2">
          {!isCollapsed && (
            <div className="px-2 pb-2 pt-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                {user?.email}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {user?.roles.join(", ")}
              </p>
            </div>
          )}

          <div
            className={`flex gap-1 ${
              isCollapsed ? "flex-col items-center" : "items-center"
            }`}
          >
            <button
              onClick={() => setShowPasswordModal(true)}
              title="Changer mon mot de passe"
              className="rounded-lg bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              onClick={logout}
              title="Déconnexion"
              className={`flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-red-600 hover:text-white ${
                isCollapsed ? "p-2" : "flex-1 space-x-2 px-3 py-2 text-xs"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Déconnexion</span>}
            </button>
          </div>

          {/*
            Réduction/déploiement : sans objet sous `lg`, où la barre est un
            tiroir qu'on ouvre ou ferme entièrement.
          */}
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? "Déployer le menu" : "Réduire le menu"}
            className={`mt-1 hidden w-full items-center rounded-lg py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex ${
              isCollapsed ? "justify-center px-2" : "space-x-2 px-3"
            }`}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
};
