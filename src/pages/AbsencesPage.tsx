import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarCheck,
  Loader2,
  Save,
  Sun,
  Sunset,
  UserX,
} from 'lucide-react';
import { HalfDay, Role, type RollCallRow } from '../types';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useMyAssignments } from '../hooks/useGrading';
import { useRecordAbsences, useRollCall } from '../hooks/useAbsences';
import { useAuthStore } from '../store/useAuthStore';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** État local d'une demi-journée pendant la saisie. */
interface HalfDayState {
  absent: boolean;
  isJustified: boolean;
  reason: string;
}

interface RowState {
  enrollmentId: string;
  firstName: string;
  lastName: string;
  morning: HalfDayState;
  afternoon: HalfDayState;
}

const emptyHalfDay = (): HalfDayState => ({
  absent: false,
  isJustified: false,
  reason: '',
});

export const AbsencesPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isTeacherOnly =
    !!user &&
    user.roles.includes(Role.TEACHER) &&
    !user.roles.some((r) =>
      [Role.SUPER_ADMIN, Role.DIRECTOR, Role.SECRETARY].includes(r),
    );

  const { data: years = [] } = useAcademicYears();
  const activeYear = useMemo(
    () => years.find((y) => y.isActive) ?? years[0],
    [years],
  );

  // Un enseignant ne fait l'appel que dans ses classes : la liste vient de ses
  // affectations, pas du catalogue complet des classes de l'établissement.
  const { data: allClassRooms = [] } = useClassRooms();
  const { data: assignments = [] } = useMyAssignments(
    isTeacherOnly ? activeYear?.id : undefined,
  );

  const classRooms = useMemo(() => {
    if (!isTeacherOnly) return allClassRooms.map((c) => ({ id: c.id, name: c.name }));
    const seen = new Map<string, { id: string; name: string }>();
    for (const a of assignments) {
      if (a.classRoom && !seen.has(a.classRoom.id)) {
        seen.set(a.classRoom.id, { id: a.classRoom.id, name: a.classRoom.name });
      }
    }
    return Array.from(seen.values());
  }, [isTeacherOnly, allClassRooms, assignments]);

  const [classRoomId, setClassRoomId] = useState('');
  const [date, setDate] = useState(todayIso());

  useEffect(() => {
    if (classRooms.length > 0 && !classRoomId) setClassRoomId(classRooms[0].id);
  }, [classRooms, classRoomId]);

  const { data, isLoading, isFetching } = useRollCall(
    classRoomId,
    activeYear?.id,
    date,
  );
  const recordMutation = useRecordAbsences();

  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    if (!data) return;
    setRows(
      data.students.map((s: RollCallRow) => ({
        enrollmentId: s.enrollmentId,
        firstName: s.firstName,
        lastName: s.lastName,
        morning: s.morning
          ? {
              absent: true,
              isJustified: s.morning.isJustified,
              reason: s.morning.reason ?? '',
            }
          : emptyHalfDay(),
        afternoon: s.afternoon
          ? {
              absent: true,
              isJustified: s.afternoon.isJustified,
              reason: s.afternoon.reason ?? '',
            }
          : emptyHalfDay(),
      })),
    );
  }, [data]);

  const patch = (
    enrollmentId: string,
    half: 'morning' | 'afternoon',
    changes: Partial<HalfDayState>,
  ) =>
    setRows((prev) =>
      prev.map((r) =>
        r.enrollmentId === enrollmentId
          ? { ...r, [half]: { ...r[half], ...changes } }
          : r,
      ),
    );

  const summary = useMemo(() => {
    const morning = rows.filter((r) => r.morning.absent).length;
    const afternoon = rows.filter((r) => r.afternoon.absent).length;
    const justified = rows.reduce(
      (n, r) =>
        n +
        (r.morning.absent && r.morning.isJustified ? 1 : 0) +
        (r.afternoon.absent && r.afternoon.isJustified ? 1 : 0),
      0,
    );
    return { morning, afternoon, total: morning + afternoon, justified };
  }, [rows]);

  const handleSave = () => {
    if (!classRoomId || !activeYear) return;

    const absences = rows.flatMap((r) => {
      const entries = [];
      if (r.morning.absent) {
        entries.push({
          enrollmentId: r.enrollmentId,
          halfDay: HalfDay.MORNING,
          isJustified: r.morning.isJustified,
          reason: r.morning.reason.trim() || undefined,
        });
      }
      if (r.afternoon.absent) {
        entries.push({
          enrollmentId: r.enrollmentId,
          halfDay: HalfDay.AFTERNOON,
          isJustified: r.afternoon.isJustified,
          reason: r.afternoon.reason.trim() || undefined,
        });
      }
      return entries;
    });

    recordMutation.mutate(
      { classRoomId, academicYearId: activeYear.id, date, absences },
      {
        onSuccess: (res) => {
          toast.success(
            res.cleared > 0
              ? `Appel enregistré : ${res.recorded} absence(s), ${res.cleared} élève(s) repassé(s) présent(s).`
              : `Appel enregistré : ${res.recorded} absence(s).`,
          );
        },
        onError: (err) =>
          toast.error(errorMessage(err, "Erreur lors de l'enregistrement")),
      },
    );
  };

  if (!activeYear) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-lg mx-auto">
        <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">
          Aucune année scolaire active
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          La direction doit ouvrir et activer une année scolaire avant que
          l'appel puisse être fait.
        </p>
      </div>
    );
  }

  if (classRooms.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-lg mx-auto">
        <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Aucune classe</h2>
        <p className="text-xs text-slate-500 mt-2">
          {isTeacherOnly
            ? "Aucune classe ne vous est affectée pour cette année scolaire."
            : "Aucune classe n'a encore été créée dans l'établissement."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex items-center space-x-6">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appel des absences</h1>
          <p className="text-slate-500 mt-1">
            Par demi-journée — année {activeYear.label}.
          </p>
        </div>
      </div>

      {/* Sélection */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Classe
          </label>
          <select
            value={classRoomId}
            onChange={(e) => setClassRoomId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
          >
            {classRooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>
      </div>

      {/* Feuille d'appel */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {new Date(date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              {summary.morning} matin
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Sunset className="w-3.5 h-3.5 text-indigo-500" />
              {summary.afternoon} après-midi
            </span>
            <span className="text-slate-400">
              dont {summary.justified} justifiée{summary.justified > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Chargement de la classe...
          </p>
        ) : rows.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">
              Aucun élève dans cette classe
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aucune inscription active pour cette classe sur l'année {activeYear.label}.
            </p>
          </div>
        ) : (
          <>
            {/* En-tête des colonnes */}
            <div className="hidden sm:flex items-center gap-3 px-3 pb-2 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
              <span className="w-6" />
              <span className="flex-1">Élève</span>
              <span className="w-24 text-center">Matin</span>
              <span className="w-24 text-center">Après-midi</span>
              <span className="w-40">Motif</span>
            </div>

            <div className="space-y-2">
              {rows.map((row, index) => {
                const anyAbsent = row.morning.absent || row.afternoon.absent;
                return (
                  <div
                    key={row.enrollmentId}
                    className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-2.5 rounded-xl border ${
                      anyAbsent
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

                    <HalfDayToggle
                      label="Matin"
                      icon={<Sun className="w-4 h-4" />}
                      state={row.morning}
                      onToggle={() =>
                        patch(row.enrollmentId, 'morning', {
                          absent: !row.morning.absent,
                        })
                      }
                      onJustify={() =>
                        patch(row.enrollmentId, 'morning', {
                          isJustified: !row.morning.isJustified,
                        })
                      }
                    />

                    <HalfDayToggle
                      label="Après-midi"
                      icon={<Sunset className="w-4 h-4" />}
                      state={row.afternoon}
                      onToggle={() =>
                        patch(row.enrollmentId, 'afternoon', {
                          absent: !row.afternoon.absent,
                        })
                      }
                      onJustify={() =>
                        patch(row.enrollmentId, 'afternoon', {
                          isJustified: !row.afternoon.isJustified,
                        })
                      }
                    />

                    {/* Un seul motif par élève et par jour : il est recopié sur
                        les deux demi-journées déclarées. */}
                    <input
                      type="text"
                      maxLength={255}
                      disabled={!anyAbsent}
                      value={row.morning.reason || row.afternoon.reason}
                      onChange={(e) => {
                        const value = e.target.value;
                        patch(row.enrollmentId, 'morning', { reason: value });
                        patch(row.enrollmentId, 'afternoon', { reason: value });
                      }}
                      placeholder={anyAbsent ? 'Motif (optionnel)' : ''}
                      className="w-full sm:w-40 px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:border-slate-100"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 text-xs text-slate-400">
                Un élève décoché est repassé présent : son absence sera effacée à
                l'enregistrement.
              </div>
              <button
                onClick={handleSave}
                disabled={recordMutation.isPending || isFetching}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/30 text-sm flex items-center gap-2 disabled:opacity-40"
              >
                {recordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer l'appel</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Bouton d'une demi-journée : présent / absent / justifié ────── */
const HalfDayToggle: React.FC<{
  label: string;
  icon: React.ReactNode;
  state: HalfDayState;
  onToggle: () => void;
  onJustify: () => void;
}> = ({ label, icon, state, onToggle, onJustify }) => (
  <div className="flex items-center gap-1 w-24">
    <button
      type="button"
      onClick={onToggle}
      title={`${label} — ${state.absent ? 'absent' : 'présent'}`}
      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
        state.absent
          ? 'bg-red-500 text-white'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
      }`}
    >
      {icon}
      <span className="sm:hidden">{label}</span>
    </button>
    {state.absent && (
      <button
        type="button"
        onClick={onJustify}
        title={state.isJustified ? 'Justifiée' : 'Non justifiée'}
        className={`px-1.5 py-2 rounded-lg text-[10px] font-black transition-all ${
          state.isJustified
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-200 hover:bg-slate-300 text-slate-500'
        }`}
      >
        J
      </button>
    )}
  </div>
);
