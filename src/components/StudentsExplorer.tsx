import React, { useState } from 'react';
import { Loader2, Search, Users } from 'lucide-react';
import { useStudentSearch } from '../hooks/useStudents';
import { useSchoolStore } from '../store/useSchoolStore';
import { StudentFileView } from './StudentFileView';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

/**
 * Espace Élèves de la direction : on cherche un élève, on ouvre son dossier.
 *
 * L'entrée se fait par la recherche et non par une liste complète : un
 * établissement compte des centaines d'élèves et la question posée porte
 * toujours sur un élève précis, dont on connaît le nom.
 *
 * L'année choisie est conservée en changeant d'élève. Comparer deux élèves
 * d'une même promotion est le cas d'usage courant ; devoir resélectionner
 * l'année à chaque fois serait une gêne inutile.
 */
export const StudentsExplorer: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const [term, setTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [yearId, setYearId] = useState<string | undefined>();

  const { data: results, isFetching } = useStudentSearch(term, currentSchool?.id);
  const trimmed = term.trim();

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-6 items-start">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nom ou prénom de l'élève"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
          )}
        </label>

        <div className="mt-3">
          {trimmed.length < 2 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Saisissez au moins 2 caractères pour lancer la recherche.
            </p>
          ) : !results || results.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isFetching ? 'Recherche...' : 'Aucun élève à ce nom.'}
            </p>
          ) : (
            <ul className="space-y-1 max-h-[28rem] overflow-y-auto">
              {results.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(student.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                      student.id === selectedId
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {student.lastName} {student.firstName}
                    </span>
                    <span
                      className={`block text-[11px] ${
                        student.id === selectedId ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      Né(e) le {formatDate(student.birthDay)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 min-h-[20rem]">
        {selectedId ? (
          <StudentFileView
            key={selectedId}
            studentId={selectedId}
            academicYearId={yearId}
            onSelectYear={setYearId}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-16">
            <Users className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              Sélectionnez un élève pour ouvrir son dossier.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Scolarité, versements, notes et absences de l'année en cours —
              les années antérieures se consultent depuis le dossier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
