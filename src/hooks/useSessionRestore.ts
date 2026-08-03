import { useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../types';

/**
 * Rétablit la session au chargement de l'application.
 *
 * Le jeton résidant dans un cookie httpOnly, l'interface ne peut plus en
 * déduire qui est connecté : elle doit le demander au serveur. `/auth/me`
 * répond à cette question et, au passage, rafraîchit les rôles — un employé
 * dont la direction vient de changer les droits n'a plus à se reconnecter pour
 * que la navigation s'ajuste.
 *
 * Le profil mis en cache dans le magasin permet d'afficher l'application sans
 * attendre cette réponse. S'il s'avère périmé, l'utilisateur est renvoyé vers
 * la page de connexion.
 */
export function useSessionRestore(): void {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await apiClient.get<User>('/auth/me');
        if (!cancelled) useAuthStore.getState().setUser(data);
      } catch {
        // 401 : cookie absent, expiré ou révoqué. Toute autre erreur (API
        // injoignable) aboutit au même résultat — sans session confirmée, on
        // ne laisse pas l'interface prétendre le contraire.
        if (!cancelled) useAuthStore.getState().clearSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
