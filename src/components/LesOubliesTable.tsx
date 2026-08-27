import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Ghost, AlertTriangle, Sparkles } from 'lucide-react';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAcademicYears } from '../hooks/useClasses';
import { useExpiredEnrollments, useRenewEnrollment } from '../hooks/useEnrollments';
import { QueryPanel } from './QueryPanel';

export const LesOubliesTable: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data: years = [] } = useAcademicYears();
  /**
   * Année consultée. Vide = l'année en cours, ce que le serveur applique par
   * défaut : l'écran s'ouvre sur les dossiers rattrapables, sans mêler ceux
   * des rentrées passées.
   *
   * Le sélecteur reste là pour les consulter : un dossier expiré d'une année
   * antérieure garde sa valeur de preuve, et le secrétariat doit pouvoir le
   * retrouver.
   */
  const [academicYearId, setAcademicYearId] = useState('');
  const expired = useExpiredEnrollments(currentSchool?.id, academicYearId || undefined);
  const {
    data: expiredEnrollments = [],
    isLoading,
    refetch,
  } = expired;

  const renewMutation = useRenewEnrollment();

  /**
   * DÉCLENCHEMENT DU CLONAGE FANTÔME 👻
   */
  const handleRenew = (id: string, oldRef: string) => {
    renewMutation.mutate(id, {
      onSuccess: (renewed) => {
        toast(
          () => (
            <div className="flex items-start space-x-3 p-1">
              <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Clonage Fantôme Réussi 👻 !</p>
                <p className="text-xs text-slate-600 mt-1">
                  L'ancienne référence <span className="line-through text-red-500 font-mono">{oldRef}</span> a été remplacée par :
                </p>
                <p className="text-base font-extrabold text-indigo-600 font-mono mt-1 bg-indigo-50 px-2 py-1 rounded-md inline-block border border-indigo-200">
                  {renewed.reference}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Nouveau délai de 72h activé. Transmettez cette référence au parent.</p>
              </div>
            </div>
          ),
          { duration: 7000 },
        );
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message;
        toast.error(msg || 'Erreur lors du renouvellement');
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Ghost className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Onglet "Les Oubliés"</h2>
            <p className="text-sm text-slate-500">
              Dossiers ayant dépassé le délai de 72h (Clonage Fantôme disponible)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {years.length > 1 && (
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="">Année en cours</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {!y.isActive ? ' (clôturée)' : ''}
                </option>
              ))}
            </select>
          )}

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
        </div>
      </div>

      {/*
        L'échec passe avant le message d'absence : « Aucun Dossier Expiré ! »
        est une bonne nouvelle, et l'annoncer alors que la requête a échoué
        rassure à tort un secrétariat qui a précisément ouvert cet écran pour
        rattraper des dossiers.
      */}
      {expired.error ? (
        <QueryPanel
          query={expired}
          fallback="La liste des dossiers expirés est momentanément indisponible."
        >
          {null}
        </QueryPanel>
      ) : expiredEnrollments.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun Dossier Expiré !</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Aucun ticket d'inscription expiré.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Ancienne Référence</th>
                <th className="py-3 px-4">Date Expiration</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {expiredEnrollments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {item.student?.firstName} {item.student?.lastName}
                    <div className="text-xs text-slate-400 font-mono font-normal">
                      {item.student?.parentPhone}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {item.classRoom?.name || 'N/A'}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 bg-red-50 text-red-600 font-mono font-bold text-xs rounded-md border border-red-200">
                      {item.reference}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-xs font-mono">
                    {new Date(item.expiresAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleRenew(item.id, item.reference)}
                      disabled={renewMutation.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 ml-auto disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${renewMutation.isPending ? 'animate-spin' : ''}`} />
                      <span>Renouveler</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
