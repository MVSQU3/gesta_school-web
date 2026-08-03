import { QueryClient } from '@tanstack/react-query';

/**
 * Client React Query de l'application.
 *
 * Isolé dans son propre module — et non créé dans `App.tsx` — pour être
 * accessible en dehors de l'arbre React : la déconnexion doit pouvoir vider le
 * cache, y compris lorsqu'elle est déclenchée par un intercepteur HTTP.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Ne pas réessayer une requête refusée par le serveur.
       *
       * Un 401, un 403 ou un 404 ne s'arrangent pas en insistant : les trois
       * tentatives par défaut ne font que retarder de plusieurs secondes la
       * redirection vers l'écran de connexion, pendant lesquelles l'écran
       * reste figé sur un chargement. Les erreurs réseau et les 5xx, elles,
       * gardent deux nouvelles tentatives : celles-là sont souvent passagères.
       */
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
