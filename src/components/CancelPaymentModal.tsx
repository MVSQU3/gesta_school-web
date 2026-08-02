import React, { useState } from 'react';
import { Ban, Loader2, X } from 'lucide-react';
import {
  CancellationType,
  CANCELLATION_TYPE_LABELS,
  type Payment,
} from '../types';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

interface Props {
  payment: Payment | null;
  isPending: boolean;
  onConfirm: (type: CancellationType, reason: string) => void;
  onClose: () => void;
}

export const CancelPaymentModal: React.FC<Props> = ({
  payment,
  isPending,
  onConfirm,
  onClose,
}) => {
  const [type, setType] = useState<CancellationType>(CancellationType.ERROR);
  const [reason, setReason] = useState('');

  if (!payment) return null;

  const canSubmit = reason.trim().length >= 5 && !isPending;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-slate-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Annuler un encaissement</h2>
            <p className="text-sm text-slate-500">
              Reçu <span className="font-mono font-bold">{payment.receiptNumber}</span> —{' '}
              {formatFcfa(payment.amount)}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm mb-5">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500 text-xs">Élève</span>
            <span className="font-semibold text-slate-800">
              {payment.enrollment?.student?.firstName}{' '}
              {payment.enrollment?.student?.lastName}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500 text-xs">Dossier</span>
            <span className="font-mono text-xs text-slate-700">
              {payment.enrollment?.reference}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500 text-xs">Encaissé le</span>
            <span className="text-xs text-slate-700">
              {new Date(payment.paidAt).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nature de l'annulation *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CancellationType).map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setType(ct)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    type === ct
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {CANCELLATION_TYPE_LABELS[ct]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {type === CancellationType.ERROR
                ? "Erreur de saisie : l'argent n'a jamais été réellement encaissé."
                : "Remboursement : l'argent a été encaissé puis rendu à la famille."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Motif * <span className="text-slate-400 font-normal">(5 caractères minimum)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={255}
              placeholder="Ex : Double saisie du versement du 2 février"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Le motif est conservé sur le reçu et dans le journal de caisse.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Le reçu ne sera pas supprimé : il reste au journal, barré, et son numéro
            demeure consommé. Le montant sort des totaux de caisse et le solde du
            dossier est recalculé automatiquement.
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-all"
            >
              Renoncer
            </button>
            <button
              onClick={() => onConfirm(type, reason.trim())}
              disabled={!canSubmit}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Annulation...</span>
                </>
              ) : (
                <span>Confirmer l'annulation</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
