import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  Ban,
  Check,
  Clock,
  FileText,
  Inbox,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  TRANSFER_STATUS_LABELS,
  TransferStatus,
  type ForeignStudentMatch,
  type TransferRequest,
} from '../types';
import {
  useCreateTransferRequest,
  useDecideTransfer,
  useIncomingTransfers,
  useOutgoingTransfers,
  useSearchForeignStudent,
  useSharedFile,
} from '../hooks/useTransfers';
import { useSchoolStore } from '../store/useSchoolStore';
import { errorMessage } from '../api/errorMessage';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

const STATUS_TONES: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [TransferStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [TransferStatus.REJECTED]: 'bg-red-100 text-red-700',
  [TransferStatus.REVOKED]: 'bg-slate-200 text-slate-600',
};

/** Un accès accordé peut avoir dépassé son terme sans changer de statut. */
const isExpired = (request: TransferRequest) =>
  request.status === TransferStatus.APPROVED &&
  !!request.expiresAt &&
  new Date(request.expiresAt).getTime() < Date.now();

const StatusBadge: React.FC<{ request: TransferRequest }> = ({ request }) => (
  <span
    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
      isExpired(request) ? 'bg-slate-200 text-slate-600' : STATUS_TONES[request.status]
    }`}
  >
    {isExpired(request) ? 'Expiré' : TRANSFER_STATUS_LABELS[request.status]}
  </span>
);

type Pane = 'search' | 'outgoing' | 'incoming';

/**
 * Transfert de dossier entre établissements.
 *
 * Un élève qui change d'école a une fiche dans chacune : rien ne se déplace,
 * c'est le droit de lire qui se demande. L'école détentrice décide, et le
 * dossier transmis se limite aux bulletins.
 */
export const TransfersManager: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const [pane, setPane] = useState<Pane>('search');

  const incoming = useIncomingTransfers(currentSchool?.id);
  const pendingCount =
    incoming.data?.filter((r) => r.status === TransferStatus.PENDING).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <PaneButton
          active={pane === 'search'}
          onClick={() => setPane('search')}
          icon={<Search className="w-4 h-4" />}
          label="Demander un dossier"
        />
        <PaneButton
          active={pane === 'outgoing'}
          onClick={() => setPane('outgoing')}
          icon={<Send className="w-4 h-4" />}
          label="Mes demandes"
        />
        <PaneButton
          active={pane === 'incoming'}
          onClick={() => setPane('incoming')}
          icon={<Inbox className="w-4 h-4" />}
          label="Demandes reçues"
          badge={pendingCount}
        />
      </div>

      {pane === 'search' && <SearchPane />}
      {pane === 'outgoing' && <OutgoingPane />}
      {pane === 'incoming' && <IncomingPane />}
    </div>
  );
};

const PaneButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      active
        ? 'bg-slate-900 text-white'
        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
    }`}
  >
    {icon}
    {label}
    {!!badge && (
      <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
        {badge}
      </span>
    )}
  </button>
);

/* ─── Volet 1 : retrouver l'élève et demander son dossier ───────────────── */

const SearchPane: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const [form, setForm] = useState({ lastName: '', firstName: '', birthDay: '' });
  const [matches, setMatches] = useState<ForeignStudentMatch[] | null>(null);

  const search = useSearchForeignStudent(currentSchool?.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    search.mutate(form, {
      onSuccess: setMatches,
      onError: (err) => toast.error(errorMessage(err, 'Recherche impossible.')),
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Retrouver l'élève dans son ancien établissement
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Les trois informations sont exigées et doivent correspondre exactement.
          C'est ce qui garantit qu'on ne peut pas parcourir les élèves des autres
          écoles : il faut déjà connaître l'enfant pour le retrouver.
        </p>

        <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3">
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Nom"
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Prénom"
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <input
            value={form.birthDay}
            onChange={(e) => setForm({ ...form, birthDay: e.target.value })}
            placeholder="Naissance JJ-MM-AAAA"
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={search.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {search.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Rechercher
          </button>
        </form>
      </div>

      {matches !== null &&
        (matches.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white rounded-3xl border border-slate-200 p-6 text-center">
            Aucun élève de ce nom et de cette date de naissance dans un autre
            établissement. Vérifiez l'orthographe et la date auprès du parent.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard key={match.studentId} match={match} />
            ))}
          </div>
        ))}
    </div>
  );
};

const MatchCard: React.FC<{ match: ForeignStudentMatch }> = ({ match }) => {
  const { currentSchool } = useSchoolStore();
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(!!match.existingRequest);
  const create = useCreateTransferRequest(currentSchool?.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        studentId: match.studentId,
        holdingSchoolId: match.school.id,
        reason,
      },
      {
        onSuccess: () => {
          setSent(true);
          toast.success("Demande transmise. L'établissement détenteur doit l'accepter.");
        },
        onError: (err) =>
          toast.error(errorMessage(err, "La demande n'a pas pu être émise.")),
      },
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-bold text-slate-900">
          {match.lastName} {match.firstName}
        </span>
        <span className="text-xs text-slate-500">
          né(e) le {formatDate(match.birthDay)}
        </span>
        <span className="ml-auto text-sm font-semibold text-slate-700">
          {match.school.name}
        </span>
      </div>

      {sent ? (
        <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 inline-flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          {match.existingRequest?.status === TransferStatus.APPROVED
            ? 'Vous avez déjà accès à ce dossier — voir « Mes demandes ».'
            : "Demande en attente de la décision de l'établissement détenteur."}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif de la demande (visible par l'autre école)"
            required
            minLength={10}
            className="flex-1 min-w-[16rem] px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Demander le dossier
          </button>
        </form>
      )}
    </div>
  );
};

/* ─── Volet 2 : les demandes émises ─────────────────────────────────────── */

const OutgoingPane: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data, isLoading } = useOutgoingTransfers(currentSchool?.id);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return <Empty>Vous n'avez émis aucune demande de dossier.</Empty>;
  }

  return (
    <div className="space-y-3">
      {data.map((request) => {
        const readable = request.status === TransferStatus.APPROVED && !isExpired(request);
        return (
          <div
            key={request.id}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold text-slate-900 text-sm">
                {request.student?.lastName} {request.student?.firstName}
              </span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-sm text-slate-600">
                {request.holdingSchool?.name}
              </span>
              <StatusBadge request={request} />
              <span className="ml-auto text-xs text-slate-400">
                Émise le {formatDate(request.createdAt)}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">« {request.reason} »</p>

            {request.decisionReason && (
              <p className="text-xs text-red-600 mt-1">
                Réponse : {request.decisionReason}
              </p>
            )}

            {readable ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === request.id ? null : request.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {openId === request.id ? 'Masquer' : 'Consulter les bulletins'}
                </button>
                <span className="ml-3 text-xs text-slate-400">
                  Accès jusqu'au {formatDate(request.expiresAt)}
                </span>
                {openId === request.id && <SharedFilePanel requestId={request.id} />}
              </div>
            ) : (
              isExpired(request) && (
                <p className="text-xs text-slate-400 mt-2">
                  L'accès a pris fin le {formatDate(request.expiresAt)}. Émettez une
                  nouvelle demande si besoin.
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Les bulletins reçus. Lecture seule, par construction : rien n'est modifiable. */
const SharedFilePanel: React.FC<{ requestId: string }> = ({ requestId }) => {
  const { currentSchool } = useSchoolStore();
  const { data, isLoading, isError, error } = useSharedFile(
    requestId,
    currentSchool?.id,
  );

  if (isLoading) return <Loading />;
  if (isError || !data) {
    return (
      <p className="mt-3 text-sm text-red-600">
        {errorMessage(error, 'Ce dossier n’est plus accessible.')}
      </p>
    );
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-x-3">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-slate-700">
          Dossier transmis par {data.holdingSchool}
        </span>
        <span className="text-[11px] text-slate-400">
          Bulletins uniquement — consultation en lecture seule
        </span>
      </div>

      <div className="p-4 space-y-4">
        {data.years.length === 0 ? (
          <p className="text-xs text-slate-400">
            Aucun bulletin n'a encore été établi pour cet élève.
          </p>
        ) : (
          data.years.map((year) => (
            <div key={year.label}>
              <h5 className="text-xs font-bold text-slate-700 mb-2">
                {year.label}
                {year.className && (
                  <span className="text-slate-400 font-normal"> · {year.className}</span>
                )}
              </h5>
              <div className="space-y-2">
                {year.periods.map((period) => (
                  <div
                    key={period.period}
                    className="border border-slate-100 rounded-xl overflow-hidden"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 px-3 py-2 bg-slate-50/70">
                      <span className="text-xs font-semibold text-slate-700">
                        {period.period}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {period.average === null
                          ? '—'
                          : `${period.average.toFixed(2)}/20`}
                      </span>
                      {period.rank !== null && (
                        <span className="text-xs text-slate-500">
                          {period.rank}e / {period.classSize}
                        </span>
                      )}
                    </div>
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
                        {period.subjects.map((s) => (
                          <tr key={s.name}>
                            <td className="px-3 py-1.5 text-slate-700">{s.name}</td>
                            <td className="px-3 py-1.5 text-right text-slate-500">
                              {s.coefficient}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-800">
                              {s.average === null ? '—' : s.average.toFixed(2)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                              {s.classAverage === null ? '—' : s.classAverage.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ─── Volet 3 : les demandes reçues, à instruire ────────────────────────── */

const IncomingPane: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data, isLoading } = useIncomingTransfers(currentSchool?.id);
  const decide = useDecideTransfer(currentSchool?.id);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return <Empty>Aucun autre établissement n'a demandé un de vos dossiers.</Empty>;
  }

  const run = (
    id: string,
    decision: 'approve' | 'reject' | 'revoke',
    body: { reason?: string; durationDays?: number },
    success: string,
  ) =>
    decide.mutate(
      { id, decision, ...body },
      {
        onSuccess: () => {
          toast.success(success);
          setRejecting(null);
          setReason('');
        },
        onError: (err) => toast.error(errorMessage(err, 'Action impossible.')),
      },
    );

  return (
    <div className="space-y-3">
      {data.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold text-slate-900 text-sm">
              {request.student?.lastName} {request.student?.firstName}
            </span>
            <span className="text-xs text-slate-500">
              demandé par{' '}
              <span className="font-semibold text-slate-700">
                {request.requestingSchool?.name}
              </span>
            </span>
            <StatusBadge request={request} />
            <span className="ml-auto text-xs text-slate-400 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(request.createdAt)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">« {request.reason} »</p>

          {request.status === TransferStatus.PENDING && (
            <>
              <p className="text-[11px] text-slate-400 mt-2">
                En acceptant, cet établissement pourra consulter les bulletins de
                l'élève pendant 30 jours. Aucune donnée financière n'est transmise, et
                vous pourrez couper l'accès à tout moment.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={decide.isPending}
                  onClick={() =>
                    run(
                      request.id,
                      'approve',
                      { durationDays: 30 },
                      'Accès accordé pour 30 jours.',
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accepter (30 jours)
                </button>
                <button
                  type="button"
                  onClick={() => setRejecting(request.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-red-300 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                  Refuser
                </button>
              </div>

              {rejecting === request.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motif du refus (transmis au demandeur)"
                    className="flex-1 min-w-[16rem] px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!reason.trim() || decide.isPending}
                    onClick={() =>
                      run(request.id, 'reject', { reason }, 'Demande refusée.')
                    }
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    Confirmer le refus
                  </button>
                </div>
              )}
            </>
          )}

          {request.status === TransferStatus.APPROVED && !isExpired(request) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">
                Accès ouvert jusqu'au {formatDate(request.expiresAt)}
              </span>
              <button
                type="button"
                disabled={decide.isPending}
                onClick={() =>
                  run(request.id, 'revoke', {}, 'Accès révoqué immédiatement.')
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                Révoquer l'accès
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Loading: React.FC = () => (
  <p className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    Chargement...
  </p>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-slate-400 bg-white rounded-3xl border border-slate-200 p-10 text-center">
    {children}
  </p>
);
