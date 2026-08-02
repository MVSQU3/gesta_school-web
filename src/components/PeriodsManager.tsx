import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, Check, Lock, LockOpen, Pencil, X } from 'lucide-react';
import type { GradingPeriod } from '../types';
import { useAcademicYears } from '../hooks/useClasses';
import { useGradingPeriods, useUpdateGradingPeriod } from '../hooks/useGrading';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

export const PeriodsManager: React.FC = () => {
  const { data: years = [] } = useAcademicYears();
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => {
    if (years.length > 0 && !academicYearId) {
      setAcademicYearId((years.find((y) => y.isActive) ?? years[0]).id);
    }
  }, [years, academicYearId]);

  const { data: periods = [], isLoading } = useGradingPeriods(academicYearId);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
        <CalendarRange className="w-5 h-5 mr-2 text-emerald-500" />
        Périodes de notation
      </h2>

      <select
        value={academicYearId}
        onChange={(e) => setAcademicYearId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white mb-5"
      >
        {years.length === 0 ? (
          <option value="">Aucune année scolaire créée</option>
        ) : (
          years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
              {y.isActive ? ' (active)' : ''}
            </option>
          ))
        )}
      </select>

      {isLoading ? (
        <p className="text-sm text-slate-400">Chargement...</p>
      ) : periods.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <CalendarRange className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune période sur cette année.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {periods.map((p) => (
            <PeriodRow key={p.id} period={p} />
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
        Les périodes sont créées automatiquement à l'ouverture d'une année,
        selon le découpage de l'établissement — trimestre ou semestre. Les dates
        servent à rattacher les absences à la bonne période. Clôturer une
        période gèle les notes : plus aucune saisie ni nouvelle évaluation,
        mais les bulletins restent consultables.
      </p>
    </div>
  );
};

const PeriodRow: React.FC<{ period: GradingPeriod }> = ({ period }) => {
  const updateMutation = useUpdateGradingPeriod();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(period.label);
  const [startDate, setStartDate] = useState(period.startDate?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(period.endDate?.slice(0, 10) ?? '');

  const save = () => {
    if (startDate && endDate && endDate < startDate) {
      toast.error('La date de fin doit être postérieure à la date de début.');
      return;
    }
    updateMutation.mutate(
      {
        id: period.id,
        label: label.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Période mise à jour.');
          setEditing(false);
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la modification')),
      },
    );
  };

  const toggleLock = () => {
    const closing = !period.isClosed;
    if (
      closing &&
      !window.confirm(
        `Clôturer ${period.label} ?\n\nLes enseignants ne pourront plus saisir ni corriger de notes sur cette période.`,
      )
    ) {
      return;
    }
    updateMutation.mutate(
      { id: period.id, isClosed: closing },
      {
        onSuccess: () =>
          toast.success(closing ? `${period.label} clôturée.` : `${period.label} rouverte.`),
        onError: (err) => toast.error(errorMessage(err, 'Erreur')),
      },
    );
  };

  return (
    <li
      className={`p-3 rounded-xl border ${
        period.isClosed ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200'
      }`}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={50}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-xs text-slate-400">au</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
            <button onClick={save} title="Enregistrer"
              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setLabel(period.label);
                setStartDate(period.startDate?.slice(0, 10) ?? '');
                setEndDate(period.endDate?.slice(0, 10) ?? '');
              }}
              title="Annuler"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm">{period.label}</span>
            {period.isClosed && (
              <span className="ml-2 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                CLÔTURÉE
              </span>
            )}
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {period.startDate && period.endDate ? (
                `${new Date(period.startDate).toLocaleDateString('fr-FR')} → ${new Date(period.endDate).toLocaleDateString('fr-FR')}`
              ) : (
                <span className="text-amber-600">
                  Dates non renseignées — les absences ne seront pas rattachées
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setEditing(true)} title="Modifier"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLock}
              title={period.isClosed ? 'Rouvrir la période' : 'Clôturer la période'}
              className={`p-1.5 rounded-lg ${
                period.isClosed
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
              }`}
            >
              {period.isClosed ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </li>
  );
};
