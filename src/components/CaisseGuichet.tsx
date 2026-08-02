import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, CreditCard, AlertCircle, CheckCircle, Clock, Wallet } from 'lucide-react';
import {
  EnrollmentStatus,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  type Enrollment,
  type Payment,
} from '../types';
import { ReceiptModal } from './ReceiptModal';
import { useProcessPayment } from '../hooks/usePayments';
import { useSearchEnrollmentByRef } from '../hooks/useEnrollments';
import { useSchoolStore } from '../store/useSchoolStore';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

export const CaisseGuichet: React.FC = () => {
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [searching, setSearching] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  // schoolId du currentSchool pour le SUPER_ADMIN (les autres rôles utilisent le JWT)
  const { currentSchool } = useSchoolStore();

  const processPaymentMutation = useProcessPayment();
  const searchEnrollmentMutation = useSearchEnrollmentByRef();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setSearching(true);
    setEnrollment(null);

    searchEnrollmentMutation.mutate(
      { reference, schoolId: currentSchool?.id },
      {
      onSuccess: (data) => {
        setEnrollment(data);
        // Pré-remplir avec le solde restant dû plutôt qu'un montant arbitraire.
        // Le caissier reste libre de saisir un versement partiel inférieur.
        const remaining = data.balanceInfo?.balance ?? 0;
        setAmount(remaining > 0 ? String(remaining) : '');
        setSearching(false);
      },
      onError: () => {
        toast.error(`Aucun ticket trouvé pour la référence "${reference}"`);
        setSearching(false);
      },
    });
  };

  const handlePay = () => {
    if (!enrollment) return;

    processPaymentMutation.mutate(
      {
        reference: enrollment.reference,
        amount: Number(amount),
        method,
        schoolId: currentSchool?.id,
      },
      {
        onSuccess: (data) => {
          setCompletedPayment(data);
          const rest = data.balanceAfter?.balance ?? 0;
          toast.success(
            rest > 0
              ? `Versement encaissé (reçu #${data.receiptNumber}). Reste à payer : ${formatFcfa(rest)}`
              : `Scolarité intégralement réglée ! Reçu #${data.receiptNumber}`,
          );
          setEnrollment(null);
          setReference('');
          setAmount('');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message;
          toast.error(msg || 'Erreur lors du paiement');
        },
      },
    );
  };

  const balanceInfo = enrollment?.balanceInfo;

  // Un dossier ayant déjà reçu un versement n'expire plus : la place est acquise,
  // seul le solde reste à recouvrer. Seuls les dossiers sans aucun versement
  // sont soumis au délai de 72h.
  const isExpired =
    enrollment?.status === EnrollmentStatus.EXPIRED ||
    (enrollment?.status === EnrollmentStatus.PENDING_PAYMENT &&
      new Date(enrollment.expiresAt) < new Date());

  const isPartiallyPaid = enrollment?.status === EnrollmentStatus.PARTIALLY_PAID;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Barre de Recherche par Référence Ticket */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Guichet de Caisse</h2>
            <p className="text-sm text-slate-500">Recherche et encaissement des tickets d'inscription 72h</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Saisissez la référence (ex: INS-CMB-26-0001)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {searching ? <span>Recherche...</span> : <span>Vérifier le Ticket</span>}
          </button>
        </form>
      </div>

      {/* Résultat de la Recherche Ticket */}
      {enrollment && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Référence Vérifiée</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{enrollment.reference}</span>
            </div>

            {/* Badge de Statut */}
            {enrollment.status === EnrollmentStatus.ENROLLED ? (
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                INTÉGRALEMENT RÉGLÉ
              </span>
            ) : isPartiallyPaid ? (
              <span className="px-3.5 py-1.5 bg-sky-100 text-sky-700 font-bold text-xs rounded-full flex items-center space-x-1">
                <Wallet className="w-4 h-4 mr-1" />
                PARTIELLEMENT RÉGLÉ
              </span>
            ) : isExpired ? (
              <span className="px-3.5 py-1.5 bg-red-100 text-red-700 font-bold text-xs rounded-full flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 mr-1" />
                TICKET EXPIRÉ (72H DÉPASSÉES)
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full flex items-center space-x-1">
                <Clock className="w-4 h-4 mr-1" />
                VALIDE EN ATTENTE DE PAIEMENT
              </span>
            )}
          </div>

          {/* Informations Élève & Inscription */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Élève</span>
              <span className="font-bold text-slate-900 text-base">
                {enrollment.student?.firstName} {enrollment.student?.lastName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-xs">Téléphone Parent</span>
              <span className="font-mono font-semibold text-slate-800">{enrollment.student?.parentPhone}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-xs">Établissement</span>
              <span className="font-semibold text-slate-800">{enrollment.school?.name}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-xs">Date Limite 72h</span>
              <span className="font-mono font-semibold text-amber-600">
                {new Date(enrollment.expiresAt).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Situation financière du dossier */}
          {balanceInfo && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
                <div className="p-4">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Total dû
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-base">
                    {balanceInfo.totalDue > 0 ? formatFcfa(balanceInfo.totalDue) : '—'}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Déjà versé
                  </span>
                  <span className="font-mono font-bold text-sky-700 text-base">
                    {formatFcfa(balanceInfo.amountPaid)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Reste à payer
                  </span>
                  <span
                    className={`font-mono font-black text-base ${
                      balanceInfo.balance > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatFcfa(balanceInfo.balance)}
                  </span>
                </div>
              </div>

              {balanceInfo.totalDue === 0 && (
                <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Aucun tarif n'est défini pour la classe{' '}
                    <strong>{enrollment.classRoom?.name}</strong>. Le montant n'est donc pas
                    contrôlé — demandez à la direction de renseigner les frais de scolarité.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bloqueur en cas d'expiration */}
          {isExpired ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Encaissement Impossible à la Caisse !</p>
                <p className="text-xs mt-1">
                  Ce ticket a dépassé le délai légal de 72 heures. Veuillez renvoyer le parent auprès du secrétariat afin d'exécuter le <strong>Clonage Fantôme</strong> depuis l'onglet <em>"Les Oubliés"</em>.
                </p>
              </div>
            </div>
          ) : enrollment.status === EnrollmentStatus.ENROLLED ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-700 text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="font-semibold">L'inscription de cet élève a déjà été entièrement réglée.</p>
            </div>
          ) : (
            /* Zone d'Encaissement Valide */
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Montant du versement (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={
                      balanceInfo && balanceInfo.totalDue > 0
                        ? balanceInfo.balance
                        : undefined
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold font-mono text-emerald-700"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {balanceInfo && balanceInfo.totalDue > 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      Un montant inférieur au solde enregistre un versement partiel ; le
                      reliquat restera dû.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Mode de paiement *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white h-[54px]"
                  >
                    {Object.values(PaymentMethod).map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aperçu du solde après opération */}
              {balanceInfo && balanceInfo.totalDue > 0 && Number(amount) > 0 && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span>Solde après ce versement :</span>
                  <span
                    className={`font-mono font-bold ${
                      balanceInfo.balance - Number(amount) > 0
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {formatFcfa(Math.max(balanceInfo.balance - Number(amount), 0))}
                  </span>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={processPaymentMutation.isPending || !amount}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50"
              >
                {processPaymentMutation.isPending ? (
                  <span>Validation de l'encaissement...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Encaisser le Versement & Imprimer le Reçu</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reçu Modal lors de la validation */}
      <ReceiptModal payment={completedPayment} onClose={() => setCompletedPayment(null)} />
    </div>
  );
};
