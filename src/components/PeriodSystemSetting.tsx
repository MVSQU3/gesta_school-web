import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, RefreshCw } from 'lucide-react';
import {
  useMySchool,
  useRegeneratePeriods,
  useUpdatePeriodSystem,
} from '../hooks/useSchools';
import { useAcademicYears } from '../hooks/useClasses';
import { errorMessage } from '../api/errorMessage';
import { PeriodSystem, PERIOD_SYSTEM_LABELS } from '../types';

/**
 * Découpage de l'année scolaire : trimestres ou semestres.
 *
 * Réglage d'établissement, mais appliqué à l'ouverture d'une année : le
 * changer ne touche pas aux années déjà créées. D'où le second bouton, qui
 * régénère les périodes d'une année — et que le serveur refuse dès qu'une note
 * ou une absence s'y rattache.
 */
export const PeriodSystemSetting: React.FC = () => {
  const school = useMySchool();
  const { data: years = [] } = useAcademicYears();
  const updateSystem = useUpdatePeriodSystem();
  const regenerate = useRegeneratePeriods();

  const current = school.data?.periodSystem ?? PeriodSystem.TRIMESTER;
  const activeYear = years.find((y) => y.isActive);
  const [pending, setPending] = useState<PeriodSystem | null>(null);

  const apply = (next: PeriodSystem) => {
    if (next === current) return;
    updateSystem.mutate(next, {
      onSuccess: () => {
        toast.success(`Découpage : ${PERIOD_SYSTEM_LABELS[next]}.`);
        setPending(next);
      },
      onError: (err) =>
        toast.error(errorMessage(err, 'Changement impossible.')),
    });
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-800">
          Découpage de l'année
        </h2>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Détermine les périodes de notation créées à l'ouverture d'une année
        scolaire. Les années déjà ouvertes conservent le leur.
      </p>

      <div className="flex flex-wrap gap-2">
        {[PeriodSystem.TRIMESTER, PeriodSystem.SEMESTER].map((system) => (
          <button
            key={system}
            onClick={() => apply(system)}
            disabled={updateSystem.isPending || school.isLoading}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
              system === current
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {PERIOD_SYSTEM_LABELS[system]}
          </button>
        ))}
      </div>

      {/*
        Proposé seulement après un changement effectif, et sur l'année en
        cours : c'est le seul moment où la question se pose, et l'afficher en
        permanence inviterait à écraser des périodes sans raison.
      */}
      {pending && activeYear && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            L'année <strong>{activeYear.label}</strong> garde son découpage
            actuel. Vous pouvez le mettre à jour tant qu'aucune note ni absence
            n'y a été saisie.
          </p>
          <button
            onClick={() =>
              regenerate.mutate(activeYear.id, {
                onSuccess: (periods) => {
                  toast.success(
                    `${periods.length} période(s) recréée(s) pour ${activeYear.label}.`,
                  );
                  setPending(null);
                },
                onError: (err) =>
                  toast.error(
                    errorMessage(err, 'Régénération impossible.'),
                    { duration: 8000 },
                  ),
              })
            }
            disabled={regenerate.isPending}
            className="mt-3 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
            />
            Régénérer les périodes de {activeYear.label}
          </button>
        </div>
      )}
    </div>
  );
};
