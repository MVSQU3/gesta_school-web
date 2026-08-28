import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarCheck, Clock, Save, UserX } from 'lucide-react';
import {
  useMySessions,
  useRecordAbsences,
  useRollCall,
  type AbsenceEntryInput,
} from '../hooks/useAbsences';
import { QueryPanel } from '../components/QueryPanel';
import { errorMessage } from '../api/errorMessage';
import { AbsenceStatus, ABSENCE_STATUS_LABELS } from '../types';

/** Date du jour au format attendu par l'API. */
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

/** Ce que l'écran retient pour un élève, avant envoi. */
interface RowState {
  enrollmentId: string;
  firstName: string;
  lastName: string;
  /** `null` = présent. C'est l'état par défaut, et le plus fréquent. */
  status: AbsenceStatus | null;
  isJustified: boolean;
  reason: string;
}

/**
 * Appel d'une séance de cours.
 *
 * L'assiduité se relève par cours et non plus par demi-journée : un
 * enseignant choisit une date, on lui propose ses séances de ce jour-là, et
 * il n'appelle que celles-là. Un cours du lundi ne s'appelle que pour un
 * lundi — la saisie peut être différée, la séance visée reste la bonne.
 */
export const AbsencesPage: React.FC = () => {
  const [date, setDate] = useState(todayIso());
  const [sessionId, setSessionId] = useState('');

  const sessionsQuery = useMySessions(date);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  // Sélection dérivée : à défaut de choix, la première séance du jour.
  const selectedId =
    sessions.find((s) => s.scheduleEntryId === sessionId)?.scheduleEntryId ??
    sessions[0]?.scheduleEntryId ??
    '';

  const rollCall = useRollCall(selectedId || undefined, date);
  const recordMutation = useRecordAbsences();

  /**
   * L'état de la feuille est dérivé de la réponse serveur, sans effet ni
   * copie : un `useState` synchronisé par `useEffect` afficherait un instant
   * la feuille de la séance précédente.
   */
  const [edits, setEdits] = useState<Record<string, Partial<RowState>>>({});
  const [editedFor, setEditedFor] = useState('');

  const key = `${selectedId}|${date}`;
  const rows: RowState[] = useMemo(() => {
    const students = rollCall.data?.students ?? [];
    return students.map((s) => {
      const base: RowState = {
        enrollmentId: s.enrollmentId,
        firstName: s.firstName,
        lastName: s.lastName,
        status: s.mark?.status ?? null,
        isJustified: s.mark?.isJustified ?? false,
        reason: s.mark?.reason ?? '',
      };
      return editedFor === key
        ? { ...base, ...(edits[s.enrollmentId] ?? {}) }
        : base;
    });
  }, [rollCall.data, edits, editedFor, key]);

  const patch = (enrollmentId: string, changes: Partial<RowState>) => {
    setEdits((prev) =>
      editedFor === key
        ? { ...prev, [enrollmentId]: { ...(prev[enrollmentId] ?? {}), ...changes } }
        : { [enrollmentId]: changes },
    );
    setEditedFor(key);
  };

  const submit = () => {
    const entries: AbsenceEntryInput[] = rows
      .filter((r) => r.status !== null)
      .map((r) => ({
        enrollmentId: r.enrollmentId,
        status: r.status as AbsenceStatus,
        isJustified: r.isJustified,
        reason: r.reason.trim() || undefined,
      }));

    recordMutation.mutate(
      { scheduleEntryId: selectedId, date, entries },
      {
        onSuccess: (result) => {
          toast.success(
            `Appel enregistré : ${result.recorded} écart(s)` +
              (result.cleared > 0 ? `, ${result.cleared} levé(s)` : ''),
          );
          setEdits({});
          setEditedFor('');
        },
        onError: (err) =>
          toast.error(errorMessage(err, 'Enregistrement impossible.'), {
            duration: 8000,
          }),
      },
    );
  };

  const absentCount = rows.filter(
    (r) => r.status === AbsenceStatus.ABSENT,
  ).length;
  const lateCount = rows.filter((r) => r.status === AbsenceStatus.LATE).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Appel</h1>
        <p className="text-sm text-slate-500">
          L'assiduité se relève cours par cours. Vous n'appelez que vos propres
          séances, à la date où elles ont lieu.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Date
          </span>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => {
              setDate(e.target.value);
              setSessionId('');
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="min-w-[16rem] flex-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Séance
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSessionId(e.target.value)}
            disabled={sessions.length === 0}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          >
            {sessions.map((s) => (
              <option key={s.scheduleEntryId} value={s.scheduleEntryId}>
                {/* La coche distingue une séance déjà appelée d'une séance
                    sans absent : sans elle, les deux se ressemblent. */}
                {s.taken ? '✓ ' : '• '}
                {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)} · {s.subjectName}{' '}
                · {s.classRoomName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/*
        Aucune séance ce jour-là n'est un état normal — un professeur n'a pas
        cours tous les jours. Le message doit le dire, pas laisser un écran vide.
      */}
      <QueryPanel
        query={sessionsQuery}
        isEmpty={sessions.length === 0}
        loading="Chargement de vos séances…"
        empty="Vous n'avez aucun cours ce jour-là."
        fallback="Vos séances sont momentanément indisponibles."
      >
        <QueryPanel
          query={rollCall}
          isEmpty={rows.length === 0}
          loading="Chargement de la feuille d'appel…"
          empty="Aucun élève inscrit dans cette classe."
          fallback="La feuille d'appel est momentanément indisponible."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <CalendarCheck className="h-4 w-4 text-slate-400" />
                  {rollCall.data?.session.subjectName} —{' '}
                  {rollCall.data?.session.classRoomName}
                </span>
                <span className="text-slate-500">
                  {rollCall.data?.session.timeSlotLabel}
                </span>
                {sessions.find((s) => s.scheduleEntryId === selectedId)?.taken && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    Appel déjà fait
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-red-700">
                  <UserX className="h-4 w-4" /> {absentCount} absent(s)
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="h-4 w-4" /> {lateCount} retard(s)
                </span>
              </div>

              <button
                onClick={submit}
                disabled={recordMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {recordMutation.isPending ? 'Enregistrement…' : "Enregistrer l'appel"}
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Élève</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-center">Justifiée</th>
                    <th className="px-6 py-3">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={row.enrollmentId}
                      className={row.status ? 'bg-slate-50/60' : ''}
                    >
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {row.lastName} {row.firstName}
                      </td>

                      <td className="px-6 py-3">
                        <div className="flex justify-center gap-1">
                          <StatusButton
                            label="Présent"
                            active={row.status === null}
                            tone="bg-emerald-600"
                            onClick={() =>
                              patch(row.enrollmentId, {
                                status: null,
                                isJustified: false,
                                reason: '',
                              })
                            }
                          />
                          <StatusButton
                            label={ABSENCE_STATUS_LABELS[AbsenceStatus.ABSENT]}
                            active={row.status === AbsenceStatus.ABSENT}
                            tone="bg-red-600"
                            onClick={() =>
                              patch(row.enrollmentId, {
                                status: AbsenceStatus.ABSENT,
                              })
                            }
                          />
                          <StatusButton
                            label={ABSENCE_STATUS_LABELS[AbsenceStatus.LATE]}
                            active={row.status === AbsenceStatus.LATE}
                            tone="bg-amber-600"
                            onClick={() =>
                              patch(row.enrollmentId, {
                                status: AbsenceStatus.LATE,
                              })
                            }
                          />
                        </div>
                      </td>

                      <td className="px-6 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.isJustified}
                          disabled={row.status === null}
                          onChange={(e) =>
                            patch(row.enrollmentId, {
                              isJustified: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-emerald-600 disabled:opacity-30"
                        />
                      </td>

                      <td className="px-6 py-3">
                        <input
                          value={row.reason}
                          disabled={row.status === null}
                          placeholder={row.status ? 'Motif…' : ''}
                          onChange={(e) =>
                            patch(row.enrollmentId, { reason: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:bg-slate-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </QueryPanel>
      </QueryPanel>
    </div>
  );
};

const StatusButton: React.FC<{
  label: string;
  active: boolean;
  tone: string;
  onClick: () => void;
}> = ({ label, active, tone, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
      active ? `${tone} text-white shadow-sm` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {label}
  </button>
);
