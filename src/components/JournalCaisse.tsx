import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Printer,
  Banknote,
  Search,
  Ban,
  Eye,
  Download,
} from 'lucide-react';
import {
  CancellationType,
  CANCELLATION_TYPE_LABELS,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  Role,
  type Payment,
} from '../types';
import {
  useCancelPayment,
  useCashJournal,
  useReceiptLookup,
} from '../hooks/usePayments';
import { downloadCsv } from '../api/downloadPdf';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAuthStore } from '../store/useAuthStore';
import { ReceiptModal } from './ReceiptModal';
import { CancelPaymentModal } from './CancelPaymentModal';
import { QueryPanel } from './QueryPanel';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const JournalCaisse: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const canCancel = hasAnyRole([Role.DIRECTOR]);

  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [page, setPage] = useState(1);

  const [receiptSearch, setReceiptSearch] = useState('');
  const [viewedReceipt, setViewedReceipt] = useState<Payment | null>(null);
  const [paymentToCancel, setPaymentToCancel] = useState<Payment | null>(null);
  const [exporting, setExporting] = useState(false);

  /**
   * Export tableur de la période affichée.
   *
   * Reprend les filtres en cours mais ignore la pagination : la comptabilité
   * veut le journal complet, pas la page à l'écran.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (method) params.append('method', method);
      if (currentSchool?.id) params.append('schoolId', currentSchool.id);
      await downloadCsv(`/payments/export?${params.toString()}`, 'journal-caisse.csv');
    } catch {
      toast.error("L'export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const lookupMutation = useReceiptLookup();
  const cancelMutation = useCancelPayment();

  const openReceipt = (receiptNumber: string) => {
    lookupMutation.mutate(
      { receiptNumber, schoolId: currentSchool?.id },
      {
        onSuccess: (data) => setViewedReceipt(data),
        onError: () => toast.error(`Aucun reçu trouvé pour "${receiptNumber}"`),
      },
    );
  };

  const handleReceiptSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptSearch.trim()) openReceipt(receiptSearch);
  };

  const confirmCancel = (type: CancellationType, reason: string) => {
    if (!paymentToCancel) return;
    cancelMutation.mutate(
      { id: paymentToCancel.id, type, reason, schoolId: currentSchool?.id },
      {
        onSuccess: () => {
          toast.success(
            `Reçu ${paymentToCancel.receiptNumber} annulé. Le solde du dossier a été recalculé.`,
          );
          setPaymentToCancel(null);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Erreur lors de l'annulation";
          toast.error(Array.isArray(msg) ? msg[0] : msg);
        },
      },
    );
  };

  const journal = useCashJournal({
    from,
    to,
    method,
    page,
    limit: 25,
    schoolId: currentSchool?.id,
  });
  const { data, isLoading, isFetching, refetch } = journal;

  const items: Payment[] = data?.items ?? [];
  const summary = data?.summary;
  const totalPages = data?.totalPages ?? 1;

  const applyFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div
      // Lorsqu'un reçu est ouvert par-dessus, c'est lui la cible d'impression :
      // le journal cède son identifiant pour ne pas s'imprimer en double.
      id={viewedReceipt ? undefined : 'journal-printable'}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 print:shadow-none print:border-0"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Journal de caisse</h2>
            <p className="text-sm text-slate-500">
              {summary
                ? `Période du ${summary.from} au ${summary.to}`
                : 'Versements encaissés sur la période'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 print:hidden">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Export...' : 'Exporter (CSV)'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Recherche d'un reçu archivé, pour réimpression */}
      <form onSubmit={handleReceiptSearch} className="flex gap-2 mb-5 print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={receiptSearch}
            onChange={(e) => setReceiptSearch(e.target.value)}
            placeholder="Retrouver un reçu par son numéro (ex: REC-CMB-26-0001)..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
        >
          {lookupMutation.isPending ? 'Recherche...' : 'Réimprimer'}
        </button>
      </form>

      {/* Filtres de période */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 print:hidden">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => applyFilter(() => setFrom(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Au</label>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => applyFilter(() => setTo(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
          <select
            value={method}
            onChange={(e) => applyFilter(() => setMethod(e.target.value as PaymentMethod | ''))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            <option value="">Tous les modes</option>
            {Object.values(PaymentMethod).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Totaux de clôture — portent sur toute la période, pas sur la page */}
      {summary && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Banknote className="w-5 h-5" />
              <span className="text-sm font-semibold">
                Total encaissé ({summary.count} versement{summary.count > 1 ? 's' : ''})
              </span>
            </div>
            <span className="text-2xl font-black font-mono tracking-tight">
              {formatFcfa(summary.totalAmount)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50">
            {Object.values(PaymentMethod).map((m) => (
              <div key={m} className="px-4 py-3 text-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  {PAYMENT_METHOD_LABELS[m]}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {formatFcfa(summary.byMethod[m]?.amount ?? 0)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {summary.byMethod[m]?.count ?? 0} opération
                  {(summary.byMethod[m]?.count ?? 0) > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Annulations de la période, présentées à part pour justification */}
          {summary.cancelledCount > 0 && (
            <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1.5 text-red-700 font-semibold">
                <Ban className="w-3.5 h-3.5" />
                <span>
                  {summary.cancelledCount} annulation
                  {summary.cancelledCount > 1 ? 's' : ''} sur la période
                </span>
              </span>
              <span className="font-mono font-bold text-red-700">
                {formatFcfa(summary.cancelledAmount)} exclus du total
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tableau des versements */}
      {/*
        L'échec passe avant « Aucun encaissement » : un comptable qui clôture
        sa caisse conclurait que la journée n'a rien encaissé, alors que le
        serveur n'a simplement pas répondu.
      */}
      {journal.error ? (
        <QueryPanel
          query={journal}
          fallback="Le journal de caisse est momentanément indisponible."
        >
          {null}
        </QueryPanel>
      ) : isLoading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Chargement du journal...</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun encaissement</h3>
          <p className="text-xs text-slate-500 mt-1">
            Aucun versement n'a été enregistré sur cette période.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3 px-4">Heure</th>
                <th className="py-3 px-4">Reçu</th>
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-4">Référence dossier</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Encaissé par</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {items.map((p) => {
                const cancelled = !!p.cancelledAt;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      cancelled ? 'bg-red-50/40 text-slate-400' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {new Date(p.paidAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                      <span className={cancelled ? 'line-through' : 'text-slate-800'}>
                        {p.receiptNumber}
                      </span>
                      {cancelled && (
                        <span
                          className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold"
                          title={p.cancellationReason ?? undefined}
                        >
                          ANNULÉ
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 ${cancelled ? '' : 'text-slate-700'}`}>
                      {p.enrollment?.student?.firstName} {p.enrollment?.student?.lastName}
                      <div className="text-xs text-slate-400">
                        {p.enrollment?.classRoom?.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {p.enrollment?.reference}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {p.receivedByUser?.email ?? '—'}
                      {cancelled && p.cancellationType && (
                        <div className="text-[11px] text-red-600 mt-0.5">
                          {CANCELLATION_TYPE_LABELS[p.cancellationType]}
                        </div>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold ${
                        cancelled ? 'line-through text-slate-400' : 'text-emerald-700'
                      }`}
                    >
                      {formatFcfa(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right print:hidden">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openReceipt(p.receiptNumber)}
                          title="Voir / réimprimer le reçu"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canCancel && !cancelled && (
                          <button
                            onClick={() => setPaymentToCancel(p)}
                            title="Annuler cet encaissement"
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 print:hidden">
          <span className="text-xs text-slate-500">
            Page {page} sur {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Réimpression d'un reçu archivé */}
      <ReceiptModal payment={viewedReceipt} onClose={() => setViewedReceipt(null)} />

      {/* Annulation d'un encaissement */}
      <CancelPaymentModal
        payment={paymentToCancel}
        isPending={cancelMutation.isPending}
        onConfirm={confirmCancel}
        onClose={() => setPaymentToCancel(null)}
      />
    </div>
  );
};
