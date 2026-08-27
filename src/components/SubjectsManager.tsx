import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Check,
  Layers,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';
import { useClassRooms } from '../hooks/useClasses';
import { QueryPanel } from './QueryPanel';
import { errorMessage } from '../api/errorMessage';
import {
  useAssignSubject,
  useClassProgram,
  useCreateSubject,
  useDeleteSubject,
  useRemoveFromProgram,
  useSubjects,
  useUpdateCoefficient,
  useUpdateSubject,
} from '../hooks/useGrading';

export const SubjectsManager: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SubjectCatalog />
      <ClassProgramEditor />
    </div>
  );
};

/* ─── Catalogue des matières de l'établissement ──────────────────── */
const SubjectCatalog: React.FC = () => {
  const subjectsQuery = useSubjects();
  const { data: subjects = [], isLoading } = subjectsQuery;
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editShort, setEditShort] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { name: name.trim(), shortName: shortName.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success(`Matière « ${data.name} » créée.`);
          setName('');
          setShortName('');
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la création')),
      },
    );
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate(
      { id, name: editName.trim(), shortName: editShort.trim() },
      {
        onSuccess: () => {
          toast.success('Matière mise à jour.');
          setEditingId(null);
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la modification')),
      },
    );
  };

  const remove = (id: string, label: string) => {
    if (!window.confirm(`Supprimer la matière ${label} ?`)) return;
    deleteMutation.mutate(id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err, 'Suppression impossible')),
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
        <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
        Matières de l'établissement
      </h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Mathématiques"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <input
          type="text"
          maxLength={10}
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="MATH"
          title="Abréviation utilisée sur le bulletin"
          className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono uppercase"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
        </button>
      </form>

      {subjectsQuery.error ? (
        <QueryPanel
          query={subjectsQuery}
          fallback="La liste des matières est momentanément indisponible."
        >
          {null}
        </QueryPanel>
      ) : isLoading ? (
        <p className="text-sm text-slate-400">Chargement...</p>
      ) : subjects.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune matière créée.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              {editingId === s.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                  <input
                    value={editShort}
                    onChange={(e) => setEditShort(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono uppercase"
                  />
                  <button onClick={() => saveEdit(s.id)} title="Enregistrer"
                    className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} title="Annuler"
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                    {s.shortName && (
                      <span className="ml-2 text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {s.shortName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setEditName(s.name);
                        setEditShort(s.shortName ?? '');
                      }}
                      title="Modifier"
                      className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(s.id, s.name)} title="Supprimer"
                      className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
        Une matière portant des évaluations ne peut plus être supprimée. Le
        coefficient ne se règle pas ici : il dépend de la classe, et se définit
        dans le programme ci-contre.
      </p>
    </div>
  );
};

/* ─── Programme d'une classe : matières et coefficients ──────────── */
const ClassProgramEditor: React.FC = () => {
  const { data: classRooms = [] } = useClassRooms();
  const { data: subjects = [] } = useSubjects();
  const [classRoomId, setClassRoomId] = useState('');

  useEffect(() => {
    if (classRooms.length > 0 && !classRoomId) setClassRoomId(classRooms[0].id);
  }, [classRooms, classRoomId]);

  const { data: program = [], isLoading } = useClassProgram(classRoomId);
  const assignMutation = useAssignSubject();
  const coefMutation = useUpdateCoefficient();
  const removeMutation = useRemoveFromProgram();

  const [subjectId, setSubjectId] = useState('');
  const [coefficient, setCoefficient] = useState('1');

  const assigned = new Set(program.map((p) => p.subjectId));
  const available = subjects.filter((s) => !assigned.has(s.id));

  // Total des coefficients : c'est le dénominateur de la moyenne générale
  const totalCoef = program.reduce((sum, p) => sum + Number(p.coefficient), 0);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    assignMutation.mutate(
      { classRoomId, subjectId, coefficient: Number(coefficient) },
      {
        onSuccess: (data) => {
          toast.success(`${data.subject.name} ajoutée au programme.`);
          setSubjectId('');
          setCoefficient('1');
        },
        onError: (err) => toast.error(errorMessage(err, "Erreur lors de l'ajout")),
      },
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
        <Layers className="w-5 h-5 mr-2 text-violet-500" />
        Programme d'une classe
      </h2>

      <select
        value={classRoomId}
        onChange={(e) => setClassRoomId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-white mb-4"
      >
        {classRooms.length === 0 ? (
          <option value="">Aucune classe créée</option>
        ) : (
          classRooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))
        )}
      </select>

      {classRoomId && (
        <form onSubmit={handleAssign} className="flex gap-2 mb-5">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="flex-1 min-w-0 text-ellipsis px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-white"
          >
            <option value="">
              {available.length === 0
                ? 'Toutes les matières sont déjà au programme'
                : 'Ajouter une matière...'}
            </option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0.5}
            max={20}
            step={0.5}
            required
            value={coefficient}
            onChange={(e) => setCoefficient(e.target.value)}
            title="Coefficient"
            className="w-20 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-mono text-center"
          />
          <button
            type="submit"
            disabled={assignMutation.isPending || !subjectId}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl disabled:opacity-40"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Chargement...</p>
      ) : program.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune matière au programme de cette classe.</p>
          <p className="text-xs mt-1">
            Sans programme, aucune évaluation ne peut y être créée.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {program.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
              >
                <span className="flex-1 font-semibold text-slate-800 text-sm min-w-0 truncate">
                  {entry.subject.name}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-slate-400">coef.</span>
                  <input
                    type="number"
                    min={0.5}
                    max={20}
                    step={0.5}
                    defaultValue={entry.coefficient}
                    onBlur={(e) => {
                      const value = Number(e.target.value);
                      if (value === Number(entry.coefficient)) return;
                      coefMutation.mutate(
                        { id: entry.id, coefficient: value },
                        {
                          onSuccess: () => toast.success('Coefficient mis à jour.'),
                          onError: (err) => {
                            toast.error(errorMessage(err, 'Erreur'));
                            e.target.value = String(entry.coefficient);
                          },
                        },
                      );
                    }}
                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={() => {
                      if (!window.confirm(`Retirer ${entry.subject.name} du programme ?`)) return;
                      removeMutation.mutate(entry.id, {
                        onSuccess: (res) => toast.success(res.message),
                        onError: (err) => toast.error(errorMessage(err, 'Retrait impossible')),
                      });
                    }}
                    title="Retirer du programme"
                    className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">Total des coefficients</span>
            <span className="font-mono font-bold text-slate-800">{totalCoef}</span>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
        Le coefficient pondère la moyenne générale de l'élève. Modifiez-le
        directement dans le champ : il est enregistré à la sortie du champ.
      </p>
    </div>
  );
};
