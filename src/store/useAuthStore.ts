import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, Role } from '../types';
import { queryClient } from '../api/queryClient';

/**
 * État d'authentification.
 *
 * Le jeton n'apparaît plus ici : il vit dans un cookie httpOnly, invisible du
 * JavaScript. Ne subsiste que le profil — email, rôles, école — qui sert à
 * afficher la bonne navigation. Ce sont des informations que l'utilisateur a
 * de toute façon sous les yeux ; leur présence en localStorage ne donne aucun
 * pouvoir à un attaquant, contrairement au jeton qu'elles remplacent.
 *
 * Ce profil n'est qu'un cache d'affichage : c'est le cookie, revérifié par le
 * serveur à chaque requête, qui fait autorité.
 */
interface AuthState {
  user: User | null;
  /** Faux tant que la session n'a pas été confrontée au serveur. */
  isSessionChecked: boolean;
  setUser: (user: User) => void;
  markSessionChecked: () => void;
  /** Déconnexion locale, sans appel réseau : la session est déjà invalide. */
  clearSession: () => void;
  /** Déconnexion demandée par l'utilisateur : efface aussi le cookie serveur. */
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isSessionChecked: false,

      setUser: (user) => set({ user, isSessionChecked: true }),
      markSessionChecked: () => set({ isSessionChecked: true }),

      /**
       * Le cache React Query est vidé au passage : sans cela, l'utilisateur
       * suivant sur le même poste — un guichet de secrétariat est partagé —
       * verrait un instant les dossiers et les montants chargés par le
       * précédent, avant que ses propres requêtes n'aboutissent.
       */
      clearSession: () => {
        set({ user: null, isSessionChecked: true });
        queryClient.clear();
      },

      /**
       * Un cookie httpOnly ne peut pas être supprimé par le JavaScript de la
       * page — c'est précisément sa raison d'être. Seul le serveur peut le
       * faire, d'où cet appel préalable.
       *
       * Son échec ne bloque pas la déconnexion locale : mieux vaut un écran
       * déconnecté avec un cookie résiduel qu'un utilisateur prisonnier d'une
       * session dont il veut sortir.
       */
      logout: async () => {
        try {
          const { apiClient } = await import('../api/client');
          await apiClient.post('/auth/logout');
        } catch {
          // Réseau indisponible ou session déjà expirée : sans conséquence ici
        } finally {
          get().clearSession();
        }
      },

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes(Role.SUPER_ADMIN)) return true;
        return user.roles.includes(role);
      },
      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes(Role.SUPER_ADMIN)) return true;
        return roles.some((role) => user.roles.includes(role));
      },
    }),
    {
      name: 'gesta-school-auth',
      // `isSessionChecked` ne survit pas au rechargement : la session doit être
      // revérifiée auprès du serveur à chaque ouverture de l'application.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
