import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, UserX } from 'lucide-react';
import {
  useAbsenceOverview,
  useAbsencesAtRisk,
} from '../hooks/useAbsences';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useGradingPeriods, useSubjects } from '../hooks/useGrading';
import { QueryPanel } from './QueryPanel';

/**
 * Suivi de l'assiduité pour la direction.
 *
 * Répond à ce que l'écran d'appel ne peut pas montrer : qui manque, dans
 * quelle matière, et depuis combien de temps. L'enseignant relève ses propres
 * cours ; c'est ici qu'on recoupe.
 */
export const AbsencesOverview: React.FC = () => {
  const { data: years = [] } = useAcademicYears();
  const activeYear = years.find((y) => y.isActive);
  const [academicYearId, setAcademicYearId] = useState('');
  const yearId = academicYearId || activeYear?.id || '';

  const { data: periods = [] } = useGradingPeriods(yearId || undefined);
  const { data: classRooms = [] } = useClassRooms();
  const { data: subjects = [] } = useSubjects();

  const [gradingPeriodId, setGradingPeriodId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [threshold, setThreshold] = useState(5);

  const filters = useMemo(
    () => ({
      academicYearId: yearId || undefined,
      gradingPeriodId: gradingPeriodId || undefined,
      classRoomId: classRoomId || undefined,
      subjectId: subjectId || undefined,
    }),
    [yearId, gradingPeriodId, classRoomId, subjectId],
  );

  const overview = useAbsenceOverview(filters);
  const atRisk = useAbsencesAtRisk(threshold, {
    academicYearId: filters.academicYearId,
    gradingPeriodId: filters.gradingPeriodId,
  });

  const rows = overview.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Suivi de l'assiduité</h2>
        <p className="text-sm text-slate-500">
          Par matière et par classe. Les retards sont comptés à part : l'élève
          était là.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Année scolaire"
          value={yearId}
          onChange={setAcademicYearId}
          options={years.map((y) => ({
            value: y.id,
            label: y.label + (y.isActive ? '' : ' (clôturée)'),
          }))}
        />
        <Select
          label="Période"
          value={gradingPeriodId}
          onChange={setGradingPeriodId}
          placeholder="Toute l'année"
          options={periods.map((p) => ({ value: p.id, label: p.label }))}
        />
        <Select
          label="Classe"
          value={classRoomId}
          onChange={setClassRoomId}
          placeholder="Toutes les classes"
          options={classRooms.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Matière"
          value={subjectId}
          onChange={setSubjectId}
          placeholder="Toutes les matières"
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      {/* Élèves au-delà du seuil — la question qu'on se pose en premier. */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Élèves à surveiller
          </p>
          <label className="flex items-center gap-2 text-xs text-amber-900">
            À partir de
            <input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 1)}
              className="w-16 rounded-lg border border-amber-300 bg-white px-2 py-1 text-sm"
            />
            séance(s) non justifiée(s)
          </label>
        </div>

        <QueryPanel
          query={atRisk}
          isEmpty={(atRisk.data?.length ?? 0) === 0}
          loading="Calcul en cours…"
          empty={`Aucun élève n'atteint ${threshold} séance(s) non justifiée(s).`}
          fallback="Ce relevé est momentanément indisponible."
        >
          <ul className="space-y-1.5">
            {atRisk.data?.map((student) => (
              <li
                key={student.enrollmentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="font-semibold text-slate-800">
                  {student.lastName} {student.firstName}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {student.classRoomName}
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  {student.subjects.join(', ')}
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                  {student.unjustified} non justifiée(s)
                </span>
              </li>
            ))}
          </ul>
        </QueryPanel>
      </div>

      <QueryPanel
        query={overview}
        isEmpty={rows.length === 0}
        loading="Chargement du suivi…"
        empty="Aucune absence enregistrée sur ce périmètre."
        fallback="Le suivi de l'assiduité est momentanément indisponible."
      >
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Élève</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3">Matière</th>
                  <th className="px-6 py-3 text-center">Non justifiées</th>
                  <th className="px-6 py-3 text-center">Justifiées</th>
                  <th className="px-6 py-3 text-center">Retards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${row.enrollmentId}|${row.subjectId}`}>
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {row.lastName} {row.firstName}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {row.classRoomName}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {row.subjectName}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.unjustified > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700">
                          <UserX className="h-3.5 w-3.5" />
                          {row.unjustified}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-600">
                      {row.justified || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.late > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          {row.late}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryPanel>
    </div>
  );
};

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}> = ({ label, value, onChange, options, placeholder }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-600">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);
