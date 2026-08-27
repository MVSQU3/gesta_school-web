import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { type Enrollment } from '../types';
import {
  useDeleteEnrollment,
  useUpdateEnrollment,
} from '../hooks/useEnrollments';
import { useUpdateStudent } from '../hooks/useStudents';
import { useClassRooms } from '../hooks/useClasses';
import { useSchoolStore } from '../store/useSchoolStore';
import { errorMessage } from '../api/errorMessage';

/** ISO `AAAA-MM-JJ` (ce que renvoie l'API) → `JJ-MM-AAAA` (ce qu'elle attend). */
const isoToLocal = (value?: string): string => {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return day && month && year ? `${day}-${month}-${year}` : '';
};

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

interface Props {
  dossier: Enrollment | null;
  /** La suppression est réservée à la direction. */
  canDelete: boolean;
  onClose: () => void;
}

/**
 * Correction d'un dossier et de la fiche élève associée.
 *
 * Les deux vivent dans la même fenêtre parce que c'est un seul geste pour le
 * secrétariat — « corriger le dossier de cet enfant » — mais ce sont deux
 * ressources distinctes côté API : la fiche élève est partagée par toutes ses
 * inscriptions, la classe n'appartient qu'à ce dossier-ci. Les deux appels ne
 * partent que si le champ correspondant a réellement changé.
 */
export const EditDossierModal: React.FC<Props> = ({ dossier, canDelete, onClose }) => {
  const { currentSchool } = useSchoolStore();
  const { data: classRooms = [] } = useClassRooms();

  const updateStudent = useUpdateStudent();
  const updateEnrollment = useUpdateEnrollment();
  const deleteEnrollment = useDeleteEnrollment();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Réinitialisation à chaque ouverture : la clé du composant change avec le
  // dossier (voir DossiersTable), ce qui remonte l'état initial ci-dessous.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (dossier && loadedFor !== dossier.id) {
    setLoadedFor(dossier.id);
    setFirstName(dossier.student?.firstName ?? '');
    setLastName(dossier.student?.lastName ?? '');
    setBirthDay(isoToLocal(dossier.student?.birthDay));
    setParentPhone(dossier.student?.parentPhone ?? '');
    setClassRoomId(dossier.classRoomId ?? '');
    setConfirmingDelete(false);
  }

  if (!dossier) return null;

  const student = dossier.student;
  const targetClass = classRooms.find((c) => c.id === classRoomId);
  const classChanged = classRoomId !== dossier.classRoomId;
  const studentChanged =
    firstName.trim() !== (student?.firstName ?? '') ||
    lastName.trim() !== (student?.lastName ?? '') ||
    birthDay !== isoToLocal(student?.birthDay) ||
    parentPhone.trim() !== (student?.parentPhone ?? '');

  const busy =
    updateStudent.isPending ||
    updateEnrollment.isPending ||
    deleteEnrollment.isPending;

  const handleSave = async () => {
    if (!studentChanged && !classChanged) {
      onClose();
      return;
    }

    try {
      if (studentChanged && student) {
        await updateStudent.mutateAsync({
          studentId: student.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDay,
          parentPhone: parentPhone.trim(),
          schoolId: currentSchool?.id,
        });
      }

      if (classChanged) {
        await updateEnrollment.mutateAsync({
          id: dossier.id,
          classRoomId,
          schoolId: currentSchool?.id,
        });
      }

      toast.success('Dossier corrigé.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'La correction a échoué.'));
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteEnrollment.mutateAsync({
        id: dossier.id,
        schoolId: currentSchool?.id,
      });
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'La suppression a échoué.'));
    }
  };

  const paid = dossier.balanceInfo?.amountPaid ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Corriger le dossier</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{dossier.reference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Fiche élève */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Fiche élève
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom" value={lastName} onChange={setLastName} />
              <Field label="Prénom" value={firstName} onChange={setFirstName} />
              <Field
                label="Date de naissance"
                value={birthDay}
                onChange={setBirthDay}
                placeholder="JJ-MM-AAAA"
              />
              <Field
                label="Téléphone du parent"
                value={parentPhone}
                onChange={setParentPhone}
                placeholder="+225…"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              La fiche est commune à toutes les inscriptions de cet élève : la
              correction vaut aussi pour ses dossiers des autres années.
            </p>
          </div>

          {/* Classe */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Classe
            </h3>
            <select
              value={classRoomId}
              onChange={(e) => setClassRoomId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              {classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {formatFcfa(Number(c.tuitionFee) || 0)}
                </option>
              ))}
            </select>

            {classChanged && targetClass && (
              <div className="mt-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
                Le montant dû passera de{' '}
                <strong>{formatFcfa(dossier.balanceInfo?.totalDue ?? 0)}</strong> à{' '}
                <strong>{formatFcfa(Number(targetClass.tuitionFee) || 0)}</strong>.
                {paid > 0 && (
                  <>
                    {' '}
                    Les {formatFcfa(paid)} déjà versés sont conservés et le statut
                    du dossier est recalculé.
                  </>
                )}
              </div>
            )}
          </div>

          {/* Suppression */}
          {canDelete && (
            <div className="pt-4 border-t border-slate-100">
              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  disabled={busy}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer ce dossier ouvert par erreur
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold">Supprimer définitivement {dossier.reference} ?</p>
                      <p className="mt-1">
                        La fiche de l'élève est conservée, ainsi que la référence
                        déjà consommée. Un dossier portant des versements ne peut
                        pas être supprimé : il faut d'abord les annuler en caisse.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleDelete}
                      disabled={busy}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-40"
                    >
                      {deleteEnrollment.isPending ? 'Suppression...' : 'Oui, supprimer'}
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Fermer
          </button>
          <button
            onClick={handleSave}
            disabled={busy || (!studentChanged && !classChanged)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-40"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer les corrections
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
    />
  </div>
);
