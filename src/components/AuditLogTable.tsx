import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { AUDIT_ACTION_LABELS, type AuditLog } from '../types';
import { useAuditLog } from '../hooks/useAudit';
import { downloadCsv } from '../api/downloadPdf';
import { useSchoolStore } from '../store/useSchoolStore';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Couleur par famille d'opération, pour repérer une catégorie d'un coup d'œil. */
const toneFor = (action: string): string => {
  if (action.startsWith('USER_')) return 'bg-indigo-100 text-indigo-700';
  if (action.startsWith('CLASSROOM_')) return 'bg-violet-100 text-violet-700';
  if (action.startsWith('ENROLLMENT_')) return 'bg-sky-100 text-sky-700';
  if (action.startsWith('STUDENT_')) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-600';
};

/**
 * Journal d'audit des opérations administratives.
 *
 * Les encaissements n'y figurent pas : ils ont leur propre journal de caisse,
 * qui porte déjà le caissier, la date et le motif d'annulation. Celui-ci
 * couvre les décisions — tarifs, comptes, dossiers, clôtures de période.
 */
export const AuditLogTable: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useAuditLog({
    action,
    from,
    to,
    page,
    limit: 30,
    schoolId: currentSchool?.id,
  });

  const items: AuditLog[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (currentSchool?.id) params.append('schoolId', currentSchool.id);
      await downloadCsv(`/audit/export?${params.toString()}`, 'journal-audit.csv');
    } catch {
      toast.error("L'export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-800 text-white rounded-xl">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Journal d'audit</h2>
            <p className="text-sm text-slate-500">
              {data?.total ?? 0} opération(s) administrative(s) tracée(s)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Export...' : 'Exporter (CSV)'}</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
        <span>
          Journal en ajout seul : aucune ligne ne peut être modifiée ni
          supprimée depuis l'application. Les encaissements ne figurent pas ici
          — ils sont tracés dans le journal de caisse, avec leur motif
          d'annulation.
        </span>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm bg-white"
        >
          <option value="">Toutes les opérations</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 py-10 text-center">
          Chargement du journal...
        </p>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            Aucune opération enregistrée
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Le journal se remplit dès qu'un tarif, un compte ou un dossier est
            modifié.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((entry) => (
            <div
              key={entry.id}
              className="border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
                  {formatDateTime(entry.createdAt)}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${toneFor(entry.action)}`}
                >
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="text-sm text-slate-800 flex-1 min-w-[12rem]">
                  {entry.summary}
                </span>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {entry.actorEmail?.split('@')[0] ?? 'compte supprimé'}
                </span>
                {entry.changes && (
                  <button
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                  >
                    {expanded === entry.id ? 'masquer' : 'détail'}
                  </button>
                )}
              </div>

              {expanded === entry.id && entry.changes && (
                <table className="mt-3 w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(entry.changes).map(([field, change]) => (
                      <tr key={field}>
                        <td className="py-1 pr-3 text-slate-500 w-32">{field}</td>
                        <td className="py-1 pr-3 text-slate-400 line-through">
                          {JSON.stringify(change.before)}
                        </td>
                        <td className="py-1 font-semibold text-slate-800">
                          {JSON.stringify(change.after)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Page {page} sur {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
