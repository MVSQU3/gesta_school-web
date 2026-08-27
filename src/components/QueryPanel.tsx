import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { errorMessage } from '../api/errorMessage';

/** Ce qu'une requête React Query expose et dont ce composant a besoin. */
interface QueryLike {
  isLoading: boolean;
  error?: unknown;
}

interface QueryPanelProps {
  /** La requête à surveiller, ou plusieurs — la première qui échoue l'emporte. */
  query: QueryLike | QueryLike[];
  /** Vrai quand la requête a abouti mais ne ramène rien. */
  isEmpty?: boolean;
  loading?: string;
  empty?: string;
  /** Message affiché si le serveur n'en a fourni aucun. */
  fallback?: string;
  children: React.ReactNode;
}

/**
 * Trois états d'une lecture, au même endroit : chargement, échec, vide.
 *
 * Sans ce composant, chaque écran retombait sur un `data ?? []` qui rendait
 * une liste vide — et l'écran annonçait « aucune donnée » alors que le serveur
 * avait répondu 403 ou 500. Ce défaut a produit deux faux bugs sur le seul
 * module parents : « Aucune période de notation ouverte » quand l'accès était
 * refusé, puis un bulletin absent sans motif.
 *
 * Le principe : ne jamais affirmer une absence de données qu'on n'a pas
 * constatée. Une erreur se dit, elle ne se déguise pas en liste vide.
 */
export const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  isEmpty = false,
  loading = 'Chargement…',
  empty = 'Aucune donnée à afficher.',
  fallback = 'Ces informations sont momentanément indisponibles.',
  children,
}) => {
  const queries = Array.isArray(query) ? query : [query];
  const failed = queries.find((q) => q.error);

  // L'échec prime sur le chargement : une requête en erreur et une autre
  // encore en vol ne doivent pas afficher « Chargement… » indéfiniment.
  if (failed) {
    return (
      <Shell tone="error">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-800">
          {errorMessage(failed.error, fallback)}
        </p>
      </Shell>
    );
  }

  if (queries.some((q) => q.isLoading)) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{loading}</p>
      </Shell>
    );
  }

  if (isEmpty) {
    return (
      <Shell>
        <Inbox className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{empty}</p>
      </Shell>
    );
  }

  return <>{children}</>;
};

const Shell: React.FC<{ tone?: 'error'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <div
    className={`rounded-3xl border p-8 text-center shadow-xl ${
      tone === 'error'
        ? 'border-red-200 bg-red-50'
        : 'border-slate-100 bg-white'
    }`}
  >
    {children}
  </div>
);
