import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';
import {
  EvaluationType,
  EVALUATION_TYPE_LABELS,
  type Evaluation,
  type TeachingAssignment,
} from '../types';
import { useAcademicYears } from '../hooks/useClasses';
import {
  useCreateEvaluation,
  useDeleteEvaluation,
  useEvaluations,
  useGradingPeriods,
  useMyAssignments,
} from '../hooks/useGrading';
import { GradeSheetEditor } from '../components/GradeSheetEditor';
import { MyScheduleCard } from '../components/MyScheduleCard';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TeacherPage: React.FC = () => {
  const { data: years = [] } = useAcademicYears();
  const activeYear = useMemo(
    () => years.find((y) => y.isActive) ?? years[0],
    [years],
  );

  const { data: assignments = [], isLoading: loadingAssignments } =
    useMyAssignments(activeYear?.id);
  const { data: periods = [] } = useGradingPeriods(activeYear?.id);

  const [assignmentId, setAssignmentId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [openSheetId, setOpenSheetId] = useState<string | null>(null);

  // Première affectation et première période sélectionnées d'office
  useEffect(() => {
    if (assignments.length > 0 && !assignmentId) {
      setAssignmentId(assignments[0].id);
    }
  }, [assignments, assignmentId]);

  useEffect(() => {
    if (periods.length > 0 && !periodId) {
      const open = periods.find((p) => !p.isClosed) ?? periods[0];
      setPeriodId(open.id);
    }
  }, [periods, periodId]);

  const assignment: TeachingAssignment | undefined = assignments.find(
    (a) => a.id === assignmentId,
  );
  const period = periods.find((p) => p.id === periodId);

  const { data: evaluations = [], isLoading: loadingEvaluations } = useEvaluations({
    classRoomId: assignment?.classRoomId,
    subjectId: assignment?.subjectId,
    gradingPeriodId: periodId,
  });

  const deleteMutation = useDeleteEvaluation();

  const handleDelete = (evaluation: Evaluation) => {
    if (
      !window.confirm(
        `Supprimer « ${evaluation.title} » ?\n\nLes notes déjà saisies pour cette évaluation seront également supprimées.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(evaluation.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err, 'Suppression impossible')),
    });
  };

  if (loadingAssignments) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
        <p className="text-sm text-slate-400">Chargement de vos classes...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-lg mx-auto">
        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">
          Aucune classe ne vous est affectée
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          {activeYear
            ? `Aucune matière ne vous est attribuée pour l'année ${activeYear.label}. La direction doit vous affecter à une classe et une matière avant que vous puissiez saisir des notes.`
            : "Aucune année scolaire active n'est configurée dans l'établissement."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex items-center space-x-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Enseignant</h1>
          <p className="text-slate-500 mt-1">
            Vos évaluations et la saisie des notes
            {activeYear ? ` — année ${activeYear.label}` : ''}.
          </p>
        </div>
      </div>

      <MyScheduleCard />

      {/* Sélection classe/matière et période */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Classe et matière
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.classRoom?.name} — {a.subject?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Période
          </label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.isClosed ? ' (clôturée)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Évaluations */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Évaluations</h2>
              <p className="text-sm text-slate-500">
                {assignment?.classRoom?.name} · {assignment?.subject?.name} ·{' '}
                {period?.label}
              </p>
            </div>
          </div>

          {period?.isClosed ? (
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              Période clôturée
            </span>
          ) : (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{showForm ? 'Annuler' : 'Nouvelle évaluation'}</span>
            </button>
          )}
        </div>

        {showForm && assignment && (
          <NewEvaluationForm
            classRoomId={assignment.classRoomId}
            subjectId={assignment.subjectId}
            gradingPeriodId={periodId}
            onDone={() => setShowForm(false)}
          />
        )}

        {loadingEvaluations ? (
          <p className="text-sm text-slate-400 py-8 text-center">Chargement...</p>
        ) : evaluations.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">
              Aucune évaluation sur cette période
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Créez un devoir ou une interrogation pour commencer à saisir des notes.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {evaluation.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                        evaluation.type === EvaluationType.DEVOIR
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {EVALUATION_TYPE_LABELS[evaluation.type]}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      /{evaluation.maxScore}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(evaluation.date).toLocaleDateString('fr-FR')}
                    {Number(evaluation.weight) !== 1
                      ? ` · poids ${evaluation.weight}`
                      : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setOpenSheetId(evaluation.id)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Saisir les notes
                  </button>
                  {!period?.isClosed && (
                    <button
                      onClick={() => handleDelete(evaluation)}
                      title="Supprimer l'évaluation"
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openSheetId && (
        <GradeSheetEditor
          evaluationId={openSheetId}
          onClose={() => setOpenSheetId(null)}
        />
      )}
    </div>
  );
};

/* ─── Création d'une évaluation ──────────────────────────────────── */
const NewEvaluationForm: React.FC<{
  classRoomId: string;
  subjectId: string;
  gradingPeriodId: string;
  onDone: () => void;
}> = ({ classRoomId, subjectId, gradingPeriodId, onDone }) => {
  const [type, setType] = useState<EvaluationType>(EvaluationType.DEVOIR);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIso());
  const [maxScore, setMaxScore] = useState(20);
  const createMutation = useCreateEvaluation();

  // Un devoir est toujours noté sur 20 ; seule l'interrogation laisse le choix.
  const isDevoir = type === EvaluationType.DEVOIR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        classRoomId,
        subjectId,
        gradingPeriodId,
        type,
        title: title.trim(),
        date,
        maxScore: isDevoir ? 20 : maxScore,
      },
      {
        onSuccess: (data) => {
          toast.success(`Évaluation « ${data.title} » créée.`);
          setTitle('');
          onDone();
        },
        onError: (err) =>
          toast.error(errorMessage(err, "Erreur lors de la création")),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(EvaluationType).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  if (t === EvaluationType.DEVOIR) setMaxScore(20);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  type === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {EVALUATION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Barème *
          </label>
          {isDevoir ? (
            <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
              Sur 20 — un devoir est toujours noté sur 20
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[10, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMaxScore(v)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all font-mono ${
                    maxScore === v
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  / {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Intitulé *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Devoir n°1 — Équations du second degré"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Date *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
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
            <span>Création...</span>
          </>
        ) : (
          <span>Créer l'évaluation</span>
        )}
      </button>
    </form>
  );
};
