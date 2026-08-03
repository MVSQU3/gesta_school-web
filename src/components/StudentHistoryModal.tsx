import React from 'react';
import {
  Award,
  CalendarX,
  Loader2,
  Receipt,
  Wallet,
  X,
} from 'lucide-react';
import {
  ENROLLMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type HistoryEnrollment,
} from '../types';
import { useStudentHistory } from '../hooks/useStudents';
import { useSchoolStore } from '../store/useSchoolStore';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

interface Props {
  studentId: string | null;
  onClose: () => void;
}

/**
 * Dossier d'un élève : sa scolarité année par année.
 *
 * L'ordre suit celui de l'API — la plus récente d'abord : au guichet, la
 * question posée porte presque toujours sur l'année en cours, et les années
 * antérieures ne servent qu'à la vérifier.
 */
export const StudentHistoryModal: React.FC<Props> = ({ studentId, onClose }) => {
  const { currentSchool } = useSchoolStore();
  const { data, isLoading, isError } = useStudentHistory(
    studentId ?? undefined,
    currentSchool?.id,
  );

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {data
                ? `${data.student.lastName} ${data.student.firstName}`
                : 'Dossier de l’élève'}
            </h2>
            {data && (
              <p className="text-xs text-slate-500 mt-0.5">
                Né(e) le {formatDate(data.student.birthDay)} · Parent{' '}
                <span className="font-mono">{data.student.parentPhone}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement du dossier...
          </p>
        ) : isError || !data ? (
          <p className="p-10 text-center text-sm text-red-600">
            Impossible de charger le dossier de cet élève.
          </p>
        ) : (
          <div className="p-6 space-y-6">
            {/* Cumuls sur toute la scolarité */}
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

            {data.enrollments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Cet élève n'a encore aucun dossier d'inscription.
              </p>
            ) : (
              data.enrollments.map((enrollment) => (
                <YearCard key={enrollment.id} enrollment={enrollment} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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

const YearCard: React.FC<{ enrollment: HistoryEnrollment }> = ({ enrollment }) => {
  const validPayments = enrollment.payments.filter((p) => !p.cancelledAt);
  const hasResults = enrollment.periods.some((p) => p.average !== null);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="font-bold text-slate-900 text-sm">
          {enrollment.academicYear.label}
        </span>
        {enrollment.academicYear.isActive && (
          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            en cours
          </span>
        )}
        <span className="text-sm text-slate-600">{enrollment.classRoom?.name ?? '—'}</span>
        <span className="font-mono text-xs text-slate-400">{enrollment.reference}</span>
        <span className="ml-auto text-xs font-semibold text-slate-600">
          {ENROLLMENT_STATUS_LABELS[enrollment.status]}
        </span>
      </div>

      <div className="p-4 space-y-4">
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

        {/* Résultats et assiduité */}
        {enrollment.periods.length > 0 && (
          <div>
            <SectionTitle icon={<Award className="w-3.5 h-3.5" />}>
              Résultats et assiduité
            </SectionTitle>

            {!hasResults ? (
              <p className="text-xs text-slate-400">
                Aucune note saisie sur cette année pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wide text-[10px] font-semibold">
                      <th className="text-left py-1">Période</th>
                      <th className="text-right py-1">Moyenne</th>
                      <th className="text-right py-1">Rang</th>
                      <th className="text-right py-1">Absences</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollment.periods.map((p) => (
                      <tr key={p.gradingPeriodId}>
                        <td className="py-1.5 text-slate-700">
                          {p.label}
                          {p.isClosed && (
                            <span className="text-slate-300"> · clôturée</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-800">
                          {p.average === null ? '—' : `${p.average.toFixed(2)}/20`}
                        </td>
                        <td className="py-1.5 text-right text-slate-500">
                          {p.rank === null ? '—' : `${p.rank}e / ${p.classSize}`}
                        </td>
                        <td className="py-1.5 text-right text-slate-500">
                          {p.absences.justified + p.absences.unjustified === 0 ? (
                            '—'
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <CalendarX className="w-3 h-3 text-amber-500" />
                              {p.absences.justified} J · {p.absences.unjustified} NJ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
