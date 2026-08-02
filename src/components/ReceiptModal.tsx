import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Printer, CheckCircle2, X, School as SchoolIcon, Ban, Download } from 'lucide-react';
import { downloadPdf } from '../api/downloadPdf';
import { useSchoolStore } from '../store/useSchoolStore';
import {
  CANCELLATION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Payment,
} from '../types';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const { currentSchool } = useSchoolStore();

  const handlePrint = () => {
    window.print();
  };

  /**
   * PDF produit par le serveur : mise en page identique quel que soit le
   * navigateur, contrairement à l'impression du rendu HTML.
   */
  const handleDownload = async () => {
    if (!payment) return;
    setDownloading(true);
    try {
      const query = currentSchool?.id ? `?schoolId=${currentSchool.id}` : '';
      await downloadPdf(
        `/payments/receipt/${payment.receiptNumber}/pdf${query}`,
        `recu-${payment.receiptNumber}.pdf`,
      );
    } catch {
      toast.error("Le reçu n'a pas pu être généré.");
    } finally {
      setDownloading(false);
    }
  };

  // Après les hooks : leur ordre d'appel doit rester constant d'un rendu à l'autre
  if (!payment) return null;

  const enrollment = payment.enrollment;
  const student = enrollment?.student;
  const school = enrollment?.school;
  const balance = payment.balanceAfter;
  const isFullyPaid = balance?.isFullyPaid ?? true;
  const isCancelled = !!payment.cancelledAt;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-slate-100 animate-in fade-in zoom-in duration-200 my-auto text-center">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu du Reçu de Caisse Centré */}
        <div id="receipt-printable" className="text-center">
          {/* Bandeau d'annulation — doit rester visible à l'impression */}
          {isCancelled && (
            <div className="mb-5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-left">
              <div className="flex items-center space-x-2 text-red-700 mb-1">
                <Ban className="w-5 h-5 flex-shrink-0" />
                <span className="font-black uppercase tracking-wide text-sm">
                  Reçu annulé —{' '}
                  {payment.cancellationType
                    ? CANCELLATION_TYPE_LABELS[payment.cancellationType]
                    : 'annulation'}
                </span>
              </div>
              <p className="text-xs text-red-800">
                <strong>Motif :</strong> {payment.cancellationReason}
              </p>
              <p className="text-[11px] text-red-600 mt-1">
                Annulé le{' '}
                {new Date(payment.cancelledAt as string).toLocaleString('fr-FR')}
                {payment.cancelledByUser?.email
                  ? ` par ${payment.cancelledByUser.email}`
                  : ''}
                . Ce document ne vaut plus justificatif de paiement.
              </p>
            </div>
          )}

          {/* Entête du Reçu */}
          <div className="flex flex-col items-center justify-center border-b border-dashed border-slate-200 pb-6 mb-6">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${
                isCancelled
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isCancelled ? (
                <Ban className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">REÇU DE PAIEMENT</h2>
            <p className="text-xs font-mono font-bold text-slate-500 mt-1">N° {payment.receiptNumber}</p>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
              <SchoolIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{school?.name || 'Établissement Scolaire'}</span>
            </div>
          </div>

          {/* Corps des Détails */}
          <div className="space-y-3 text-sm border-b border-dashed border-slate-200 pb-6 mb-6">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Référence Inscription :</span>
              <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {enrollment?.reference}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Élève Bénéficiaire :</span>
              <span className="font-bold text-slate-900">
                {student?.firstName} {student?.lastName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Classe Sollicitée :</span>
              <span className="font-semibold text-slate-800">{enrollment?.classRoom?.name || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Téléphone Parent :</span>
              <span className="font-mono text-slate-800">{student?.parentPhone}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Date & Heure Règlement :</span>
              <span className="text-slate-600 font-mono text-xs">
                {new Date(payment.paidAt || Date.now()).toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 text-xs font-medium">Mode de Règlement :</span>
              <span className="font-semibold text-slate-800">
                {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
              </span>
            </div>

            {payment.receivedByUser?.email && (
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-xs font-medium">Encaissé par :</span>
                <span className="text-slate-700 text-xs">{payment.receivedByUser.email}</span>
              </div>
            )}
          </div>

          {/* Bloc du Montant Versé */}
          <div
            className={`bg-gradient-to-br ${
              isCancelled
                ? 'from-slate-400 to-slate-500 shadow-slate-400/20 line-through'
                : isFullyPaid
                  ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/20'
                  : 'from-sky-500 to-sky-600 shadow-sky-500/20'
            } text-white rounded-2xl p-5 shadow-lg mb-4 text-center`}
          >
            <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block mb-1">
              {isFullyPaid ? 'Montant Encaissé' : 'Versement Encaissé'}
            </span>
            <span className="text-3xl font-black font-mono tracking-tight">
              {formatFcfa(payment.amount)}
            </span>
            <span className="text-[11px] block mt-1 opacity-80">
              Frais de scolarité & d'inscription
            </span>
          </div>

          {/* Situation du dossier après ce versement */}
          {balance && balance.totalDue > 0 && !isCancelled && (
            <div className="mb-6 rounded-2xl border border-slate-200 overflow-hidden text-sm">
              <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50">
                <span className="text-slate-500 text-xs">Total scolarité :</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatFcfa(balance.totalDue)}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-200">
                <span className="text-slate-500 text-xs">Cumul versé à ce jour :</span>
                <span className="font-mono font-semibold text-sky-700">
                  {formatFcfa(balance.amountPaid)}
                </span>
              </div>
              <div
                className={`flex justify-between items-center px-4 py-3 border-t-2 ${
                  balance.balance > 0
                    ? 'border-red-200 bg-red-50'
                    : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    balance.balance > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {balance.balance > 0 ? 'Reste à payer' : 'Solde soldé'}
                </span>
                <span
                  className={`font-mono font-black text-lg ${
                    balance.balance > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {formatFcfa(balance.balance)}
                </span>
              </div>
            </div>
          )}

          {/* Faux Code-Barres / QR Code de Validation */}
          <div className="flex flex-col items-center justify-center space-y-1 text-center border-t border-dashed border-slate-200 pt-4">
            <div className="h-8 w-48 bg-slate-900 rounded flex items-center justify-center space-x-1 p-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full ${i % 3 === 0 ? 'w-1 bg-white' : i % 2 === 0 ? 'w-0.5 bg-slate-300' : 'w-1.5 bg-white'}`}
                ></div>
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-400 tracking-widest">{payment.receiptNumber}</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Document officiel délivré par le guichet de caisse - Gesta_School MVP
          </p>
        </div>

        {/* Boutons d'Action Modal */}
        <div className="mt-6 flex items-center space-x-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimer</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{downloading ? 'Génération...' : 'Télécharger le PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
