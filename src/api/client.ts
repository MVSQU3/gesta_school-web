import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Adresse de l'API, fixée à la compilation par VITE_API_URL.
 *
 * Vite remplace `import.meta.env.*` par sa valeur littérale au build : la
 * variable doit donc être présente au moment du `npm run build`, pas au
 * démarrage du serveur web. Sans elle, on retombe sur l'API locale, ce qui
 * convient au développement et casse bruyamment en production plutôt que de
 * laisser croire à un fonctionnement normal.
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error(
    "VITE_API_URL n'était pas définie au build : l'application interroge " +
      'http://localhost:3000, elle ne fonctionnera pas en dehors du poste du ' +
      'développeur.',
  );
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /**
   * Le jeton voyage dans un cookie httpOnly que le navigateur joint lui-même.
   * Sans cette option, il ne l'émet pas vers une autre origine — l'API étant
   * sur un port ou un sous-domaine distinct — et chaque requête repartirait
   * non authentifiée.
   *
   * Il n'y a plus d'intercepteur de requête : l'application n'a jamais accès
   * au jeton, et n'a donc rien à poser dans les en-têtes.
   */
  withCredentials: true,
});

/**
 * Routes qui répondent 401 pour une raison qui n'est pas une session expirée.
 *
 *  - `/auth/login` : mot de passe erroné à la connexion ;
 *  - `/auth/password` : mot de passe actuel erroné lors d'un changement.
 *
 * Sans cette exception, un utilisateur qui se trompe en saisissant son ancien
 * mot de passe serait déconnecté au lieu de voir « mot de passe actuel
 * incorrect » — et à l'écran de connexion, une faute de frappe afficherait
 * « session expirée », message incompréhensible pour quelqu'un qui n'est pas
 * encore connecté.
 */
const AUTH_ROUTES = ['/auth/login', '/auth/password'];

/**
 * Empêche la rafale de messages quand plusieurs requêtes parallèles échouent
 * ensemble : au chargement d'un écran, cinq requêtes partent en même temps et
 * reçoivent toutes le même 401. Un seul message, une seule déconnexion.
 */
let sessionExpiryHandled = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthRoute = AUTH_ROUTES.some((route) => url.includes(route));

    if (status === 401 && !isAuthRoute) {
      // Sans profil en mémoire, il n'y a pas de session à expirer : c'est un
      // appel parti trop tôt ou après une déconnexion déjà traitée.
      const hadSession = !!useAuthStore.getState().user;

      if (hadSession && !sessionExpiryHandled) {
        sessionExpiryHandled = true;
        toast.error('Session expirée. Veuillez vous reconnecter.');

        // Vider le magasin suffit à provoquer la redirection : ProtectedRoute
        // renvoie vers /login dès que le profil disparaît, en mémorisant la
        // page en cours. Pas de `window.location`, qui rechargerait toute
        // l'application et perdrait cette mémoire.
        //
        // Nettoyage local uniquement : le serveur vient de refuser la session,
        // inutile de lui demander d'effacer un cookie déjà sans valeur.
        useAuthStore.getState().clearSession();

        // Le verrou est relâché une fois la vague de requêtes retombée, pour
        // que la prochaine expiration soit de nouveau signalée.
        setTimeout(() => {
          sessionExpiryHandled = false;
        }, 3000);
      }
    }

    return Promise.reject(error);
  },
);
