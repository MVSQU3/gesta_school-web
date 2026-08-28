import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { queryClient } from '../api/queryClient';
import { Role } from '../types';

const user = (roles: Role[]) =>
  ({ id: 'u-1', email: 'a@b.ci', roles, slug: 'CLN', isActive: true }) as never;

/**
 * Le magasin de session commande l'affichage de toute la navigation. Une
 * erreur ici ne se voit pas : elle donne accès à un onglet, ou le retire.
 */
describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isSessionChecked: false });
  });

  describe('hasRole / hasAnyRole', () => {
    it('refuse tout à une session absente', () => {
      const { hasRole, hasAnyRole } = useAuthStore.getState();
      expect(hasRole(Role.DIRECTOR)).toBe(false);
      expect(hasAnyRole([Role.DIRECTOR, Role.SECRETARY])).toBe(false);
    });

    it('reconnaît le rôle porté par le profil', () => {
      useAuthStore.getState().setUser(user([Role.SECRETARY]));
      expect(useAuthStore.getState().hasRole(Role.SECRETARY)).toBe(true);
      expect(useAuthStore.getState().hasRole(Role.DIRECTOR)).toBe(false);
    });

    it('ouvre tout au SUPER_ADMIN, quel que soit le rôle demandé', () => {
      useAuthStore.getState().setUser(user([Role.SUPER_ADMIN]));
      expect(useAuthStore.getState().hasRole(Role.TEACHER)).toBe(true);
      expect(useAuthStore.getState().hasAnyRole([Role.PARENT])).toBe(true);
    });

    it('ne confond pas PARENT et personnel', () => {
      useAuthStore.getState().setUser(user([Role.PARENT]));
      const { hasAnyRole } = useAuthStore.getState();
      expect(
        hasAnyRole([Role.DIRECTOR, Role.SECRETARY, Role.ACCOUNTANT]),
      ).toBe(false);
      expect(hasAnyRole([Role.PARENT])).toBe(true);
    });
  });

  describe('clearSession', () => {
    it('vide le cache des requêtes en même temps que le profil', () => {
      const clear = vi.spyOn(queryClient, 'clear');
      useAuthStore.getState().setUser(user([Role.SECRETARY]));

      useAuthStore.getState().clearSession();

      // Un guichet de secrétariat est partagé : sans ce vidage, l'utilisateur
      // suivant verrait un instant les dossiers et les montants du précédent.
      expect(useAuthStore.getState().user).toBeNull();
      expect(clear).toHaveBeenCalled();
      clear.mockRestore();
    });

    it('marque la session comme vérifiée, pour ne pas boucler sur /auth/me', () => {
      useAuthStore.getState().clearSession();
      expect(useAuthStore.getState().isSessionChecked).toBe(true);
    });
  });
});
