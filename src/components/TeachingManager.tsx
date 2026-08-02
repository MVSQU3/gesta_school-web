import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, Loader2, PlusCircle, Trash2, UserPlus } from 'lucide-react';
import { Role } from '../types';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useStaff } from '../hooks/useUsers';
import {
  useAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useSubjects,
} from '../hooks/useGrading';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

export const TeachingManager: React.FC = () => {
  const { data: years = [] } = useAcademicYears();
  const { data: classRooms = [] } = useClassRooms();
  const { data: subjects = [] } = useSubjects();
  const { data: staff = [] } = useStaff();

  const [academicYearId, setAcademicYearId] = useState('');
  useEffect(() => {
    if (years.length > 0 && !academicYearId) {
      setAcademicYearId((years.find((y) => y.isActive) ?? years[0]).id);
    }
  }, [years, academicYearId]);

  const { data: assignments = [], isLoading } = useAssignments(academicYearId);
  const createMutation = useCreateAssignment();
  const deleteMutation = useDeleteAssignment();

  // Seuls les comptes actifs portant le rôle Enseignant sont affectables
  const teachers = useMemo(
    () => staff.filter((u) => u.roles.includes(Role.TEACHER) && u.isActive),
    [staff],
  );

  const [teacherId, setTeacherId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { teacherId, classRoomId, subjectId, academicYearId },
      {
        onSuccess: (data) => {
          toast.success(
            `${data.teacher?.email} enseigne ${data.subject?.name} en ${data.classRoom?.name}.`,
          );
          setSubjectId('');
        },
        onError: (err) => toast.error(errorMessage(err, "Erreur lors de l'affectation")),
      },
    );
  };

  /** Affectations regroupées par enseignant, plus lisible qu'une liste à plat. */
  const grouped = useMemo(() => {
    const map = new Map<string, { email: string; rows: typeof assignments }>();
    for (const a of assignments) {
      const key = a.teacherId;
      const entry = map.get(key) ?? { email: a.teacher?.email ?? '—', rows: [] };
      entry.rows.push(a);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-indigo-500" />
          Affecter un enseignant
        </h2>

        {teachers.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            Aucun compte avec le rôle <strong>Enseignant</strong> dans
            l'établissement. Créez-en un depuis l'onglet « Personnel », ou
            attribuez le rôle Enseignant à un compte existant.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Année scolaire *
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                      {y.isActive ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Enseignant *
                </label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {teachers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Classe *
                </label>
                <select
                  required
                  value={classRoomId}
                  onChange={(e) => setClassRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {classRooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Matière *
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Affectation...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Affecter</span>
                </>
              )}
            </button>

            <p className="text-xs text-slate-400">
              L'affectation vaut pour une année scolaire. Sans elle, l'enseignant
              ne peut ni créer d'évaluation ni saisir de note dans cette matière.
            </p>
          </form>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-violet-500" />
          Affectations en cours
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({assignments.length})
          </span>
        </h2>

        {isLoading ? (
          <p className="text-sm text-slate-400">Chargement...</p>
        ) : grouped.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune affectation sur cette année scolaire.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.email}>
                <p className="text-sm font-bold text-slate-800 mb-2">{group.email}</p>
                <ul className="space-y-2">
                  {group.rows.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="text-sm text-slate-700">
                        <strong>{a.classRoom?.name}</strong> — {a.subject?.name}
                      </span>
                      <button
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Retirer ${a.subject?.name} en ${a.classRoom?.name} à ${group.email} ?\n\nLes évaluations et notes déjà saisies sont conservées.`,
                            )
                          )
                            return;
                          deleteMutation.mutate(a.id, {
                            onSuccess: (res) => toast.success(res.message),
                            onError: (err) =>
                              toast.error(errorMessage(err, 'Retrait impossible')),
                          });
                        }}
                        title="Retirer l'affectation"
                        className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
