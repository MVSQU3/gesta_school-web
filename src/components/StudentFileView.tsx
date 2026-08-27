import React from 'react';
import {
  Award,
  CalendarX,
  Loader2,
  Receipt,
  UserX,
  Wallet,
} from 'lucide-react';
import {
  ENROLLMENT_STATUS_LABELS,
  HalfDay,
  PAYMENT_METHOD_LABELS,
  type HistoryEnrollment,
  type StudentFile,
} from '../types';
import { useStudentFile } from '../hooks/useStudents';
import { useSchoolStore } from '../store/useSchoolStore';
import { errorMessage } from '../api/errorMessage';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

const HALF_DAY_LABELS: Record<HalfDay, string> = {
  [HalfDay.MORNING]: 'Matin',
  [HalfDay.AFTERNOON]: 'Après-midi',
};

interface Props {
  studentId: string;
  /** Année affichée. `undefined` = année active, résolue par le serveur. */
  academicYearId?: string;
  onSelectYear: (academicYearId: string | undefined) => void;
}

/**
 * Dossier d'un élève sur une année scolaire.
 *
 * L'année active est affichée d'office : c'est la seule qui répond aux
 * questions du quotidien. Les années antérieures sont accessibles par le
 * sélecteur, une à la fois — les charger toutes reviendrait à recalculer les
 * bulletins de la classe entière pour chaque période de chaque année.
 *
 * Le composant pilote son propre chargement mais pas son état : l'année
 * choisie appartient à l'écran hôte, qui peut ainsi la conserver en changeant
 * d'élève ou la reporter dans son URL.
 */
export const StudentFileView: React.FC<Props> = ({
  studentId,
  academicYearId,
  onSelectYear,
}) => {
  const { currentSchool } = useSchoolStore();
  const fileQuery = useStudentFile(
    studentId,
    academicYearId,
    currentSchool?.id,
  );
  const { data, isLoading, isError, isFetching } = fileQuery;

  if (isLoading) {
    return (
      <p className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement du dossier...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <p className="p-10 text-center text-sm text-red-600">
        {/* Le motif du serveur plutôt qu'un message maison : « transfert
            refusé » et « dossier introuvable » n'appellent pas la même
            réaction du secrétariat. */}
        {errorMessage(
          fileQuery.error,
          "Impossible de charger le dossier de cet élève.",
        )}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          {data.student.lastName} {data.student.firstName}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Né(e) le {formatDate(data.student.birthDay)} · Parent{' '}
          <span className="font-mono">{data.student.parentPhone}</span>
        </p>
      </div>

      <YearPicker file={data} selected={academicYearId} onSelect={onSelectYear} />

      {/* Cumuls sur toute la scolarité — indépendants de l'année affichée. */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Depuis l'entrée dans l'établissement
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Années" value={String(data.totals.years)} />
          <Stat label="Total dû" value={formatFcfa(data.totals.totalDue)} />
          <Stat
            label="Total versé"
            value={formatFcfa(data.totals.totalPaid)}
            tone="text-sky-700"
          />
          <Stat
            label="Reste dû"
            value={formatFcfa(data.totals.balance)}
            tone={data.totals.balance > 0 ? 'text-red-600' : 'text-emerald-600'}
          />
        </div>
      </div>

      <div className={isFetching ? 'opacity-50 transition-opacity' : undefined}>
        {data.enrollment ? (
          <YearDetail enrollment={data.enrollment} />
        ) : (
          <EmptyYear file={data} />
        )}
      </div>
    </div>
  );
};

/**
 * Sélecteur d'année.
 *
 * Chaque année où l'élève a un dossier est proposée avec sa classe : « 2024-2025
 * · 6ème B » se reconnaît mieux qu'une date seule quand on cherche à situer un
 * redoublement.
 */
const YearPicker: React.FC<{
  file: StudentFile;
  selected?: string;
  onSelect: (id: string | undefined) => void;
}> = ({ file, selected, onSelect }) => {
  if (file.availableYears.length === 0) return null;

  const activeYearId = file.availableYears.find((y) => y.isActive)?.id;
  const shownId = selected ?? file.selectedYear?.id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
        Année scolaire
      </span>
      {file.availableYears.map((year) => {
        const isShown = year.id === shownId;
        return (
          <button
            key={year.id}
            type="button"
            // Revenir à l'année active efface le paramètre : on retrouve la clé
            // de cache du chargement initial plutôt que d'en créer une seconde.
            onClick={() => onSelect(year.id === activeYearId ? undefined : year.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isShown
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {year.label}
            {year.className && (
              <span className={isShown ? 'text-slate-300' : 'text-slate-400'}>
                {' '}
                · {year.className}
              </span>
            )}
            {year.isActive && (
              <span
                className={`ml-1.5 text-[9px] uppercase font-bold ${
                  isShown ? 'text-emerald-300' : 'text-emerald-600'
                }`}
              >
                en cours
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * L'élève n'a pas de dossier sur l'année demandée.
 *
 * Cas courant en début d'année : la réinscription n'est pas encore faite. On
 * ne bascule pas en silence sur une autre année — afficher les notes de l'an
 * dernier sous l'étiquette de cette année ferait prendre une décision sur de
 * mauvaises données.
 */
const EmptyYear: React.FC<{ file: StudentFile }> = ({ file }) => (
  <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center">
    <UserX className="w-6 h-6 text-slate-300 mx-auto mb-2" />
    <p className="text-sm text-slate-600 font-semibold">
      {file.availableYears.length === 0
        ? "Cet élève n'a encore aucun dossier d'inscription."
        : "Pas de dossier sur l'année en cours."}
    </p>
    {file.availableYears.length > 0 && (
      <p className="text-xs text-slate-400 mt-1">
        Sa réinscription n'a pas été enregistrée. Choisissez une autre année
        ci-dessus pour consulter sa scolarité passée.
      </p>
    )}
  </div>
);

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = 'text-slate-800',
}) => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
      {label}
    </span>
    <span className={`font-mono font-bold text-sm ${tone}`}>{value}</span>
  </div>
);

const YearDetail: React.FC<{ enrollment: HistoryEnrollment }> = ({ enrollment }) => {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = React.useState(0);
  const validPayments = enrollment.payments.filter((p) => !p.cancelledAt);
  const hasResults = enrollment.periods.some((p) => p.average !== null);

  const periodIndex = Math.min(selectedPeriodIndex, Math.max(0, enrollment.periods.length - 1));
  const selectedPeriod = enrollment.periods[periodIndex];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="font-bold text-slate-900 text-sm">
          {enrollment.academicYear.label}
        </span>
        <span className="text-sm text-slate-600">
          {enrollment.classRoom?.name ?? '—'}
        </span>
        <span className="font-mono text-xs text-slate-400">{enrollment.reference}</span>
        <span className="ml-auto text-xs font-semibold text-slate-600">
          {ENROLLMENT_STATUS_LABELS[enrollment.status]}
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Situation financière */}
        <div>
          <SectionTitle icon={<Wallet className="w-3.5 h-3.5" />}>
            Scolarité — {formatFcfa(enrollment.balance.amountPaid)} versés sur{' '}
            {formatFcfa(enrollment.balance.totalDue)}
            {enrollment.balance.balance > 0 && (
              <span className="text-red-600 font-bold">
                {' '}
                · reste {formatFcfa(enrollment.balance.balance)}
              </span>
            )}
          </SectionTitle>

          {enrollment.payments.length === 0 ? (
            <p className="text-xs text-slate-400">Aucun versement enregistré.</p>
          ) : (
            <ul className="space-y-1">
              {enrollment.payments.map((p) => (
                <li
                  key={p.id}
                  className={`flex flex-wrap items-center gap-x-3 text-xs ${
                    p.cancelledAt ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <Receipt className="w-3 h-3 flex-shrink-0" />
                  <span className="font-mono">{p.receiptNumber}</span>
                  <span className={p.cancelledAt ? 'line-through' : 'font-semibold'}>
                    {formatFcfa(p.amount)}
                  </span>
                  <span>{PAYMENT_METHOD_LABELS[p.method]}</span>
                  <span>{formatDate(p.paidAt)}</span>
                  {p.receivedBy && <span className="text-slate-400">{p.receivedBy}</span>}
                  {p.cancelledAt && (
                    <span className="text-red-500 font-semibold">
                      annulé — {p.cancellationReason}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {validPayments.length !== enrollment.payments.length && (
            <p className="text-[11px] text-slate-400 mt-1">
              Les versements annulés restent affichés mais sortent des totaux.
            </p>
          )}
        </div>

        {/* Résultats par période */}
        {enrollment.periods.length > 0 && (
          <div>
            <SectionTitle icon={<Award className="w-3.5 h-3.5" />}>
              Résultats et assiduité
            </SectionTitle>

            {!hasResults ? (
              <p className="text-xs text-slate-400">
                Aucune note saisie sur cette année pour le moment.
              </p>
            ) : selectedPeriod ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {enrollment.periods.map((p, idx) => (
                    <button
                      key={p.gradingPeriodId}
                      onClick={() => setSelectedPeriodIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        idx === periodIndex
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-baseline gap-x-3 px-3 py-2 bg-slate-50/70">
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedPeriod.label}
                    </span>
                    {selectedPeriod.isClosed && (
                      <span className="text-[10px] text-slate-400">clôturée</span>
                    )}
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {selectedPeriod.average === null
                        ? '—'
                        : `${selectedPeriod.average.toFixed(2)}/20`}
                    </span>
                    {selectedPeriod.rank !== null && (
                      <span className="text-xs text-slate-500">
                        {selectedPeriod.rank}e / {selectedPeriod.classSize}
                      </span>
                    )}
                    {selectedPeriod.absences.justified + selectedPeriod.absences.unjustified > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
                        <CalendarX className="w-3 h-3 text-amber-500" />
                        {selectedPeriod.absences.justified} justifiée(s) ·{' '}
                        {selectedPeriod.absences.unjustified} non justifiée(s)
                      </span>
                    )}
                  </div>

                  {selectedPeriod.subjects.length > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">
                          <th className="text-left px-3 py-1">Matière</th>
                          <th className="text-right px-3 py-1">Coef.</th>
                          <th className="text-right px-3 py-1">Moyenne</th>
                          <th className="text-right px-3 py-1">Classe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPeriod.subjects.map((s) => (
                          <tr key={s.name}>
                            <td className="px-3 py-1.5 text-slate-700">{s.name}</td>
                            <td className="px-3 py-1.5 text-right text-slate-500">
                              {s.coefficient}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-800">
                              {s.average === null ? '—' : s.average.toFixed(2)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                              {s.classAverage === null
                                ? '—'
                                : s.classAverage.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Relevé d'assiduité daté */}
        {enrollment.absences.length > 0 && (
          <div>
            <SectionTitle icon={<CalendarX className="w-3.5 h-3.5" />}>
              Absences de l'année ({enrollment.absences.length} demi-journées)
            </SectionTitle>
            <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {enrollment.absences.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 text-xs">
                  <span className="font-mono text-slate-600">{formatDate(a.date)}</span>
                  <span className="text-slate-500">{HALF_DAY_LABELS[a.halfDay]}</span>
                  <span
                    className={`font-semibold ${
                      a.isJustified ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {a.isJustified ? 'justifiée' : 'non justifiée'}
                  </span>
                  {a.reason && <span className="text-slate-400">{a.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
    {icon}
    <span>{children}</span>
  </h4>
);
