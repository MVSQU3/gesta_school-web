import React, { useMemo, useState } from 'react';
import {
  Award,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  Users,
} from 'lucide-react';
import {
  useMyChildAbsences,
  useMyChildBulletin,
  useMyChildGrades,
  useMyChildFinance,
  useMyChildPeriods,
  useMyChildren,
  useMyYears,
} from '../hooks/useParents';
import { errorMessage } from '../api/errorMessage';
import {
  EVALUATION_TYPE_LABELS,
  EnrollmentStatus,
  type ParentChild,
  type ParentSubjectGrades,
} from '../types';

const formatFcfa = (value: number) =>
  `${Number(value).toLocaleString('fr-FR')} FCFA`;

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING_PAYMENT]: 'En attente de versement',
  [EnrollmentStatus.PARTIALLY_PAID]: 'Partiellement réglé',
  [EnrollmentStatus.ENROLLED]: 'Scolarité réglée',
  [EnrollmentStatus.EXPIRED]: 'Dossier expiré',
};

const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING_PAYMENT]: 'bg-amber-100 text-amber-800',
  [EnrollmentStatus.PARTIALLY_PAID]: 'bg-blue-100 text-blue-800',
  [EnrollmentStatus.ENROLLED]: 'bg-emerald-100 text-emerald-800',
  [EnrollmentStatus.EXPIRED]: 'bg-red-100 text-red-800',
};

type Tab = 'scolarite' | 'notes' | 'absences';

/**
 * Espace parent : un onglet par enfant, puis trois volets de suivi.
 *
 * L'écran est en lecture seule de bout en bout. Un parent constate, il ne
 * corrige pas : une note ou une absence contestée se règle avec
 * l'établissement, et non par une saisie depuis le téléphone du parent.
 */
export const ParentPage: React.FC = () => {
  const { data: years = [] } = useMyYears();
  /**
   * Année consultée. Vide = « la plus récente », ce que le serveur applique
   * par défaut : l'écran s'ouvre donc sur la situation du jour sans attendre
   * la liste des années.
   */
  const [yearId, setYearId] = useState<string>('');
  const { data: children = [], isLoading } = useMyChildren(yearId || undefined);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('scolarite');

  /**
   * Sélection dérivée plutôt que recopiée dans un effet : à défaut de choix
   * explicite, on retombe sur le premier enfant. Une famille n'ayant qu'un
   * enfant ne doit pas avoir à cliquer pour voir quoi que ce soit, et un
   * effet qui poserait l'état provoquerait un rendu vide intermédiaire.
   */
  const child = useMemo(
    () =>
      children.find((c) => c.studentId === pickedId) ?? children[0] ?? null,
    [children, pickedId],
  );
  const selectedId = child?.studentId ?? null;
  const setSelectedId = setPickedId;

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500 shadow-xl">
        Chargement de vos enfants…
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl">
        <Users className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Aucun enfant rattaché
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Votre compte n'est encore rattaché à aucun élève. Rapprochez-vous du
          secrétariat de l'établissement pour effectuer le rattachement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Suivi de mes enfants</h1>
        <p className="text-sm text-slate-500">
          Scolarité, notes et assiduité — en consultation.
        </p>
      </header>

      {/* Sélecteur d'année — masqué tant qu'une seule année existe. */}
      {years.length > 1 && (
        <label className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">
            Année scolaire
          </span>
          <select
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {!y.isActive ? ' (clôturée)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Sélecteur d'enfant — masqué s'il n'y en a qu'un, il n'aurait rien à
          sélectionner. */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.studentId}
              onClick={() => setSelectedId(c.studentId)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                c.studentId === selectedId
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>
                {c.firstName} {c.lastName}
              </span>
            </button>
          ))}
        </div>
      )}

      {child && (
        <>
          <ChildHeader child={child} />

          {child.enrollment ? (
            <>
              <nav className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                <TabButton
                  icon={CreditCard}
                  label="Scolarité"
                  active={tab === 'scolarite'}
                  onClick={() => setTab('scolarite')}
                />
                <TabButton
                  icon={Award}
                  label="Notes"
                  active={tab === 'notes'}
                  onClick={() => setTab('notes')}
                />
                <TabButton
                  icon={CalendarCheck}
                  label="Absences"
                  active={tab === 'absences'}
                  onClick={() => setTab('absences')}
                />
              </nav>

              {tab === 'scolarite' && (
                <FinancePanel enrollmentId={child.enrollment.id} />
              )}
              {tab === 'notes' && (
                <GradesPanel enrollmentId={child.enrollment.id} />
              )}
              {tab === 'absences' && (
                <AbsencesPanel enrollmentId={child.enrollment.id} />
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-xl">
              {yearId
                ? "Cet enfant n'était pas inscrit sur l'année sélectionnée."
                : "Aucune inscription n'est encore enregistrée pour cet enfant."}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Sous-composants ────────────────────────────────────────────── */

const TabButton: React.FC<{
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
      active
        ? 'bg-slate-900 text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

/** Bandeau d'identité : classe, référence du dossier et solde en un coup d'œil. */
const ChildHeader: React.FC<{ child: ParentChild }> = ({ child }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {child.firstName} {child.lastName}
        </h2>
        <p className="text-sm text-slate-500">
          {child.enrollment?.classRoom?.name ?? 'Classe non affectée'}
          {child.enrollment?.academicYear?.label
            ? ` — ${child.enrollment.academicYear.label}`
            : ''}
        </p>
        {/*
          Une année close est annoncée comme telle : sans cette mention, un
          parent dont l'enfant n'est pas encore réinscrit lisait le solde de
          l'an passé en le croyant à jour.
        */}
        {child.enrollment?.academicYear &&
          child.enrollment.academicYear.isActive === false && (
            <span className="mt-1 inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              Année clôturée
            </span>
          )}
        {child.enrollment && (
          <p className="mt-1 font-mono text-xs text-slate-400">
            {child.enrollment.reference}
          </p>
        )}
      </div>

      {child.enrollment && (
        <div className="text-right">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              STATUS_STYLES[child.enrollment.status]
            }`}
          >
            {STATUS_LABELS[child.enrollment.status]}
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatFcfa(child.enrollment.balance.balance)}
          </p>
          <p className="text-xs text-slate-500">Reste à régler</p>
        </div>
      )}
    </div>
  </div>
);

const FinancePanel: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
  const { data, isLoading } = useMyChildFinance(enrollmentId);

  if (isLoading) return <PanelMessage>Chargement du dossier…</PanelMessage>;
  if (!data) return <PanelMessage>Dossier indisponible.</PanelMessage>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total dû" value={formatFcfa(data.balance.totalDue)} />
        <StatCard label="Déjà réglé" value={formatFcfa(data.balance.amountPaid)} />
        <StatCard
          label="Reste à régler"
          value={formatFcfa(data.balance.balance)}
          accent
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <h3 className="border-b border-slate-100 px-6 py-4 font-bold text-slate-900">
          Versements
        </h3>
        {data.payments.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            Aucun versement enregistré à ce jour.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Reçu</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.map((p) => (
                  <tr
                    key={p.id}
                    /*
                      Un versement annulé reste affiché, barré et motivé : une
                      famille détient le reçu papier, la ligne ne peut pas
                      disparaître sans explication.
                    */
                    className={p.cancelledAt ? 'bg-red-50/50 text-slate-400' : ''}
                  >
                    <td className="px-6 py-3 font-mono text-xs">
                      {p.receiptNumber}
                      {p.cancelledAt && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                          ANNULÉ
                        </span>
                      )}
                      {p.cancelledAt && p.cancellationReason && (
                        <p className="mt-0.5 text-[11px] italic text-red-600">
                          {p.cancellationReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-semibold ${
                        p.cancelledAt ? 'line-through' : ''
                      }`}
                    >
                      {formatFcfa(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const GradesPanel: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
  const {
    data: periods = [],
    isLoading: periodsLoading,
    error: periodsError,
  } = useMyChildPeriods(enrollmentId);
  const [pickedPeriodId, setPickedPeriodId] = useState<string>('');

  // Même principe que la sélection d'enfant : la première période sert de
  // valeur par défaut sans passer par un effet.
  const periodId =
    periods.find((p) => p.id === pickedPeriodId)?.id ?? periods[0]?.id ?? '';

  const {
    data,
    isLoading,
    error: bulletinError,
  } = useMyChildBulletin(enrollmentId, periodId);
  const { data: subjectGrades = [], isLoading: gradesLoading } =
    useMyChildGrades(enrollmentId, periodId);

  if (periodsLoading) {
    return <PanelMessage>Chargement des périodes…</PanelMessage>;
  }

  if (periodsError) {
    return (
      <PanelMessage>
        {errorMessage(periodsError, 'Périodes indisponibles.')}
      </PanelMessage>
    );
  }

  if (periods.length === 0) {
    return <PanelMessage>Aucune période de notation ouverte.</PanelMessage>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPickedPeriodId(p.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              p.id === periodId
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && <PanelMessage>Calcul du bulletin…</PanelMessage>}

      {!isLoading && !data && (
        <PanelMessage>
          {errorMessage(
            bulletinError,
            'Aucun bulletin disponible pour cette période.',
          )}
        </PanelMessage>
      )}

      {data && (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold text-slate-900">{data.period.label}</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {data.bulletin.average !== null
                  ? `${data.bulletin.average.toFixed(2)} / 20`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500">
                Moyenne générale
                {data.bulletin.rank !== null && ` — ${data.bulletin.rank}ᵉ`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Matière</th>
                  <th className="px-6 py-3 text-center">Coef.</th>
                  <th className="px-6 py-3 text-center">Moyenne</th>
                  <th className="px-6 py-3 text-center">Classe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.bulletin.subjects.map((s) => (
                  <tr key={s.subjectId}>
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500">
                      {s.coefficient}
                    </td>
                    <td className="px-6 py-3 text-center font-bold text-slate-900">
                      {s.average !== null ? s.average.toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500">
                      {s.classAverage !== null ? s.classAverage.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/*
        Le détail des notes, sous les moyennes. Le bulletin dit « 9,29 » ;
        c'est ici qu'une famille voit quels devoirs l'ont produit.
      */}
      {gradesLoading && <PanelMessage>Chargement des notes…</PanelMessage>}

      {!gradesLoading && subjectGrades.length === 0 && data && (
        <PanelMessage>
          Aucune note saisie sur cette période pour le moment.
        </PanelMessage>
      )}

      {subjectGrades.map((subject) => (
        <SubjectGradesCard key={subject.subjectId} subject={subject} />
      ))}
    </div>
  );
};

/** Les notes d'une matière : une ligne par devoir ou interrogation. */
const SubjectGradesCard: React.FC<{ subject: ParentSubjectGrades }> = ({
  subject,
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
    <h4 className="border-b border-slate-100 px-6 py-3 font-bold text-slate-900">
      {subject.name}
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-6 py-3">Évaluation</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3 text-right">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subject.grades.map((g) => (
            <tr key={g.id}>
              <td className="px-6 py-3">
                <span className="font-medium text-slate-800">{g.title}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {EVALUATION_TYPE_LABELS[g.type] ?? g.type}
                </span>
                {g.comment && (
                  <p className="mt-0.5 text-xs italic text-slate-500">
                    {g.comment}
                  </p>
                )}
              </td>
              <td className="px-6 py-3 text-slate-500">
                {new Date(g.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-6 py-3 text-right">
                {/*
                  Une absence n'est pas un zéro : elle ne compte pas dans la
                  moyenne, et l'afficher « 0 » ferait croire à un échec.
                */}
                {g.isAbsent ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    Absent
                  </span>
                ) : g.score === null ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <span className="font-bold text-slate-900">
                    {/* Note brute : un 7/10 reste « 7/10 », comme sur la copie. */}
                    {g.score} / {g.maxScore}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AbsencesPanel: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
  const { data = [], isLoading } = useMyChildAbsences(enrollmentId);

  if (isLoading) return <PanelMessage>Chargement des absences…</PanelMessage>;
  if (data.length === 0) {
    return <PanelMessage>Aucune absence enregistrée. </PanelMessage>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Demi-journée</th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3">Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((a) => (
              <tr key={a.id}>
                <td className="px-6 py-3">
                  {new Date(a.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-3 text-slate-500">
                  {/* Le cours manqué, plutôt que la demi-journée. */}
                  {a.subjectName ?? '—'}
                  {a.timeSlotLabel ? ` · ${a.timeSlotLabel}` : ''}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      a.isJustified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {a.isJustified ? 'Justifiée' : 'Non justifiée'}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-500">{a.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
}> = ({ label, value, accent }) => (
  <div
    className={`rounded-2xl border p-5 shadow-lg ${
      accent
        ? 'border-indigo-200 bg-indigo-50'
        : 'border-slate-100 bg-white'
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
  </div>
);

const PanelMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-xl">
    {children}
  </div>
);
