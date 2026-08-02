import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Save, UserX, X } from 'lucide-react';
import { EVALUATION_TYPE_LABELS, type GradeSheetRow } from '../types';
import { useGradeSheet, useSaveGrades } from '../hooks/useGrading';

interface Props {
  evaluationId: string;
  onClose: () => void;
}

interface RowState {
  enrollmentId: string;
  firstName: string;
  lastName: string;
  /** Saisie brute : une chaîne, pour distinguer « vide » de « 0 ». */
  score: string;
  isAbsent: boolean;
  comment: string;
}

export const GradeSheetEditor: React.FC<Props> = ({ evaluationId, onClose }) => {
  const { data, isLoading } = useGradeSheet(evaluationId);
  const saveMutation = useSaveGrades();
  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    if (!data) return;
    setRows(
      data.students.map((s: GradeSheetRow) => ({
        enrollmentId: s.enrollmentId,
        firstName: s.firstName,
        lastName: s.lastName,
        score: s.score !== null && s.score !== undefined ? String(s.score) : '',
        isAbsent: s.isAbsent,
        comment: s.comment ?? '',
      })),
    );
  }, [data]);

  const evaluation = data?.evaluation;
  const maxScore = evaluation?.maxScore ?? 20;
  const isClosed = evaluation?.gradingPeriod?.isClosed ?? false;

  const patch = (enrollmentId: string, changes: Partial<RowState>) =>
    setRows((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, ...changes } : r)),
    );

  /** Récapitulatif : notes saisies, absents, moyenne de la classe. */
  const summary = useMemo(() => {
    const scored = rows.filter((r) => !r.isAbsent && r.score.trim() !== '');
    const values = scored
      .map((r) => Number(r.score))
      .filter((v) => !Number.isNaN(v));
    const absent = rows.filter((r) => r.isAbsent).length;
    return {
      entered: scored.length,
      absent,
      missing: rows.length - scored.length - absent,
      average: values.length
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : null,
    };
  }, [rows]);

  /** Notes hors barème : bloquent l'enregistrement avant l'aller-retour serveur. */
  const invalid = rows.filter((r) => {
    if (r.isAbsent || r.score.trim() === '') return false;
    const v = Number(r.score);
    return Number.isNaN(v) || v < 0 || v > maxScore;
  });

  const handleSave = () => {
    if (invalid.length > 0) {
      toast.error(
        `${invalid.length} note(s) hors barème : la note doit être comprise entre 0 et ${maxScore}.`,
      );
      return;
    }

    // Les élèves sans note ni absence ne sont pas envoyés : leur note reste
    // simplement à saisir, plutôt que d'être enregistrée vide.
    const grades = rows
      .filter((r) => r.isAbsent || r.score.trim() !== '')
      .map((r) => ({
        enrollmentId: r.enrollmentId,
        score: r.isAbsent ? null : Number(r.score),
        isAbsent: r.isAbsent,
        comment: r.comment.trim() || undefined,
      }));

    saveMutation.mutate(
      { evaluationId, grades },
      {
        onSuccess: (res) => toast.success(`${res.saved} note(s) enregistrée(s).`),
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement";
          toast.error(Array.isArray(msg) ? msg[0] : msg);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8 border border-slate-100">
        {/* En-tête */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {evaluation?.title ?? 'Feuille de notes'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {evaluation && (
                <>
                  {EVALUATION_TYPE_LABELS[evaluation.type]} · noté sur{' '}
                  <strong>{maxScore}</strong> · {evaluation.classRoom?.name} ·{' '}
                  {evaluation.subject?.name}
                </>
              )}
            </p>
            {maxScore !== 20 && (
              <p className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 mt-2 inline-block">
                Saisissez sur {maxScore}. La note sera ramenée sur 20 dans les moyennes.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isClosed && (
          <div className="mx-6 sm:mx-8 mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            La période <strong>{evaluation?.gradingPeriod?.label}</strong> est clôturée :
            les notes ne sont plus modifiables.
          </div>
        )}

        {/* Récapitulatif */}
        <div className="px-6 sm:px-8 pt-5">
          <div className="grid grid-cols-4 gap-2 text-center rounded-2xl border border-slate-200 overflow-hidden">
            <div className="py-2.5 bg-slate-50">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Saisies
              </span>
              <span className="font-mono font-bold text-slate-800">
                {summary.entered}/{rows.length}
              </span>
            </div>
            <div className="py-2.5 bg-slate-50 border-l border-slate-200">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Absents
              </span>
              <span className="font-mono font-bold text-amber-700">{summary.absent}</span>
            </div>
            <div className="py-2.5 bg-slate-50 border-l border-slate-200">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Manquantes
              </span>
              <span className="font-mono font-bold text-slate-500">{summary.missing}</span>
            </div>
            <div className="py-2.5 bg-slate-50 border-l border-slate-200">
              <span className="block text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Moyenne
              </span>
              <span className="font-mono font-bold text-indigo-700">
                {summary.average !== null ? `${summary.average}/${maxScore}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des élèves */}
        <div className="p-6 sm:p-8 pt-5">
          {isLoading ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Chargement de la classe...
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Aucun élève inscrit dans cette classe pour cette année scolaire.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => {
                const outOfRange =
                  !row.isAbsent &&
                  row.score.trim() !== '' &&
                  (Number.isNaN(Number(row.score)) ||
                    Number(row.score) < 0 ||
                    Number(row.score) > maxScore);

                return (
                  <div
                    key={row.enrollmentId}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                      row.isAbsent
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="w-6 text-xs text-slate-400 font-mono text-right">
                      {index + 1}
                    </span>

                    <span className="flex-1 text-sm font-semibold text-slate-800 min-w-0 truncate">
                      {row.lastName} {row.firstName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.25"
                        min={0}
                        max={maxScore}
                        disabled={row.isAbsent || isClosed}
                        value={row.score}
                        onChange={(e) =>
                          patch(row.enrollmentId, { score: e.target.value })
                        }
                        placeholder="—"
                        className={`w-20 px-2 py-2 rounded-lg border text-center font-mono font-bold text-sm focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-300 ${
                          outOfRange
                            ? 'border-red-400 text-red-600 focus:ring-red-400'
                            : 'border-slate-200 text-indigo-700 focus:ring-indigo-500'
                        }`}
                      />
                      <span className="text-xs text-slate-400 font-mono w-6">
                        /{maxScore}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isClosed}
                      onClick={() =>
                        patch(row.enrollmentId, {
                          isAbsent: !row.isAbsent,
                          score: !row.isAbsent ? '' : row.score,
                        })
                      }
                      title={
                        row.isAbsent
                          ? 'Marquer présent'
                          : "Absent à l'évaluation — la note ne comptera pas dans la moyenne"
                      }
                      className={`p-2 rounded-lg transition-all disabled:opacity-40 ${
                        row.isAbsent
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                      }`}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || isClosed || rows.length === 0}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer les notes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
