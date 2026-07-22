import React from 'react';
import { Printer, CheckCircle2, X, School as SchoolIcon } from 'lucide-react';
import type { Payment } from '../types';

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const enrollment = payment.enrollment;
  const student = enrollment?.student;
  const school = enrollment?.school;

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
          {/* Entête du Reçu */}
          <div className="flex flex-col items-center justify-center border-b border-dashed border-slate-200 pb-6 mb-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
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
          </div>

          {/* Bloc du Montant Total Centré */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20 mb-6 text-center">
            <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block mb-1">
              Montant Total Encaissé
            </span>
            <span className="text-3xl font-black font-mono tracking-tight">
              {Number(payment.amount).toLocaleString('fr-FR')} FCFA
            </span>
            <span className="text-[11px] block mt-1 opacity-80">Frais de scolarité & d'inscription</span>
          </div>

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
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimer le Reçu PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
