import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle,
  Info,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react';
import { EnrollmentStatus, type Enrollment } from '../types';
import { useBulkEnroll, useEnrollmentsList } from '../hooks/useEnrollments';
import type { BulkEnrollResult } from '../hooks/useEnrollments';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useSchoolStore } from '../store/useSchoolStore';
import { errorMessage } from '../api/errorMessage';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

/**
 * Réinscription en masse : faire monter une classe entière d'une année sur
 * l'autre.
 *
 * L'écran ne devine pas la progression des niveaux — il n'a aucun moyen fiable
 * de savoir qu'une 6ème A devient une 5ème A dans cet établissement. Le
 * secrétariat désigne la classe de départ et la classe d'accueil, et décoche
 * ceux qui ne montent pas : redoublants, départs, dossiers à traiter à part.
 */
export const BulkReenrollment: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data: classRooms = [] } = useClassRooms();
  const { data: academicYears = [] } = useAcademicYears();

  const activeYear = useMemo(
    () => academicYears.find((y) => y.isActive),
    [academicYears],
  );
  const previousYears = useMemo(
    () => academicYears.filter((y) => !y.isActive),
    [academicYears],
  );

  const [sourceYearId, setSourceYearId] = useState('');
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [report, setReport] = useState<BulkEnrollResult | null>(null);

  const bulkEnroll = useBulkEnroll();

  const ready = !!sourceYearId && !!sourceClassId;
  const source = useEnrollmentsList(
    {
      academicYearId: sourceYearId,
      classRoomId: sourceClassId,
      limit: 200,
      schoolId: currentSchool?.id,
    },
    { enabled: ready },
  );
  const { data, isFetching } = source;

  // Un dossier expiré n'a jamais donné lieu au moindre versement : l'élève
  // n'a pas réellement fait l'année, il n'a pas à être promu par défaut.
  const candidates: Enrollment[] = useMemo(
    () =>
      (data?.items ?? []).filter((e) => e.status !== EnrollmentStatus.EXPIRED),
    [data],
  );

  // La sélection est remontée à chaque changement de classe source, en
  // cochant tout : le cas courant est « toute la classe monte ».
  const [loadedFor, setLoadedFor] = useState('');
  const signature = `${sourceYearId}|${sourceClassId}|${candidates.length}`;
  if (ready && !isFetching && loadedFor !== signature) {
    setLoadedFor(signature);
    setSelected(new Set(candidates.map((e) => e.studentId)));
    setReport(null);
  }

  const toggle = (studentId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });

  const targetClass = classRooms.find((c) => c.id === targetClassId);

  const handleSubmit = async () => {
    if (!activeYear || !targetClassId || selected.size === 0) return;

    try {
      const result = await bulkEnroll.mutateAsync({
        classRoomId: targetClassId,
        academicYearId: activeYear.id,
        studentIds: [...selected],
        schoolId: currentSchool?.id,
      });
      setReport(result);
      toast.success(
        `${result.created.length} dossier(s) ouvert(s)` +
          (result.skipped.length > 0 ? `, ${result.skipped.length} écarté(s)` : ''),
      );
    } catch (err) {
      toast.error(errorMessage(err, 'La réinscription en masse a échoué.'));
    }
  };

  if (!activeYear) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-lg mx-auto">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">
          Aucune année scolaire active
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          La direction doit ouvrir et activer l'année d'accueil avant de pouvoir
          réinscrire une classe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Réinscription en masse
            </h2>
            <p className="text-sm text-slate-500">
              Ouvrir les dossiers {activeYear.label} pour toute une classe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Année de départ
            </label>
            <select
              value={sourceYearId}
              onChange={(e) => setSourceYearId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Choisir…</option>
              {previousYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Classe de départ
            </label>
            <select
              value={sourceClassId}
              onChange={(e) => setSourceClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Choisir…</option>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Classe d'accueil ({activeYear.label})
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Choisir…</option>
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {formatFcfa(Number(c.tuitionFee) || 0)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {targetClass && (
          <div className="mt-4 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2 text-slate-600">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Chaque élève sélectionné reçoit un dossier neuf avec sa propre
              référence et son jeton de 72 h, au tarif de{' '}
              <strong>{formatFcfa(Number(targetClass.tuitionFee) || 0)}</strong>.
              Les élèves déjà inscrits sur {activeYear.label} sont écartés
              automatiquement.
            </span>
          </div>
        )}
      </div>

      {/* Liste des élèves */}
      {ready && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {source.error ? (
            /* « Aucun élève à réinscrire » ferait croire la classe déjà traitée. */
            <p className="text-sm text-red-600 py-8 text-center">
              {errorMessage(source.error, 'Liste des candidats indisponible.')}
            </p>
          ) : isFetching ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Chargement de la classe...
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Aucun élève à réinscrire dans cette classe pour l'année choisie.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  {selected.size} élève(s) sélectionné(s) sur {candidates.length}
                </h3>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() =>
                      setSelected(new Set(candidates.map((e) => e.studentId)))
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-600"
                  >
                    Tout cocher
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-600"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {candidates.map((e) => {
                  const checked = selected.has(e.studentId);
                  const unpaid = (e.balanceInfo?.balance ?? 0) > 0;
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-indigo-50/60 border-indigo-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(e.studentId)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="flex-1 text-sm font-semibold text-slate-800 min-w-0 truncate">
                        {e.student?.lastName} {e.student?.firstName}
                      </span>
                      {unpaid && (
                        <span className="text-[11px] font-semibold text-red-600 whitespace-nowrap">
                          doit encore {formatFcfa(e.balanceInfo?.balance ?? 0)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <p className="flex-1 text-xs text-slate-400 min-w-[12rem]">
                  Un reliquat de l'année précédente n'empêche pas la
                  réinscription : les deux dossiers restent distincts, chacun
                  avec son solde.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={
                    bulkEnroll.isPending || !targetClassId || selected.size === 0
                  }
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 text-sm flex items-center gap-2 disabled:opacity-40"
                >
                  {bulkEnroll.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ouverture des dossiers...
                    </>
                  ) : (
                    <>
                      Réinscrire {selected.size} élève(s)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compte rendu */}
      {report && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5">
          <h3 className="font-bold text-slate-900">Compte rendu</h3>

          {report.created.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
                <CheckCircle className="w-3.5 h-3.5" />
                {report.created.length} dossier(s) ouvert(s)
              </h4>
              <ul className="text-xs text-slate-600 space-y-0.5">
                {report.created.map((c) => (
                  <li key={c.studentId} className="flex gap-3">
                    <span className="font-mono text-slate-400">{c.reference}</span>
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.skipped.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                {report.skipped.length} élève(s) écarté(s)
              </h4>
              <ul className="text-xs text-slate-600 space-y-0.5">
                {report.skipped.map((s) => (
                  <li key={s.studentId}>
                    <span className="font-semibold">{s.name}</span> — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
