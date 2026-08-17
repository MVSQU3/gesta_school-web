import React, { useState } from 'react';
import { X } from 'lucide-react';
import { StudentFileView } from './StudentFileView';

interface Props {
  studentId: string | null;
  onClose: () => void;
}

/**
 * Dossier d'un élève ouvert depuis la liste des inscriptions.
 *
 * Simple enveloppe autour de `StudentFileView` : la consultation depuis le
 * guichet et l'espace Élèves de la direction doivent montrer exactement la
 * même chose, sinon les deux écrans finissent par diverger.
 *
 * L'année choisie est remise à zéro à chaque ouverture — on repart de l'année
 * en cours, qui est la question posée dans la quasi-totalité des cas.
 */
export const StudentHistoryModal: React.FC<Props> = ({ studentId, onClose }) => {
  const [yearId, setYearId] = useState<string | undefined>();

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-slate-900">Dossier de l’élève</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <StudentFileView
            studentId={studentId}
            academicYearId={yearId}
            onSelectYear={setYearId}
          />
        </div>
      </div>
    </div>
  );
};
