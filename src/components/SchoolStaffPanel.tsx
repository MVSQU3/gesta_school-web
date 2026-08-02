import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Power, ShieldCheck, Users, X } from 'lucide-react';
import { Role, ROLE_LABELS, type School, type User } from '../types';
import { useSchoolStaff, useSetStaffStatus } from '../hooks/useUsers';
import { ResetPasswordModal } from './ResetPasswordModal';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

interface Props {
  school: School;
  onClose: () => void;
}

/**
 * Personnel d'un établissement vu par le super-admin.
 *
 * Sert principalement au dépannage du directeur : lui seul peut réinitialiser
 * le mot de passe d'un directeur, puisqu'un directeur ne peut pas
 * réinitialiser le sien.
 */
export const SchoolStaffPanel: React.FC<Props> = ({ school, onClose }) => {
  const { data: staff = [], isLoading } = useSchoolStaff(school.id);
  const statusMutation = useSetStaffStatus();
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  // Les directeurs d'abord : c'est le motif habituel de la visite
  const sorted = useMemo(() => {
    const weight = (u: User) => (u.roles.includes(Role.DIRECTOR) ? 0 : 1);
    return [...staff].sort(
      (a, b) => weight(a) - weight(b) || a.email.localeCompare(b.email),
    );
  }, [staff]);

  const directors = staff.filter((u) => u.roles.includes(Role.DIRECTOR));
  const activeDirectors = directors.filter((u) => u.isActive);

  const toggleStatus = (user: User) => {
    statusMutation.mutate(
      { id: user.id, isActive: !user.isActive, schoolId: school.id },
      {
        onSuccess: () =>
          toast.success(
            user.isActive
              ? `Compte de ${user.email} désactivé.`
              : `Compte de ${user.email} réactivé.`,
          ),
        onError: (err) => toast.error(errorMessage(err, 'Erreur')),
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              Personnel — {school.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono">{school.slug}</p>
          </div>
        </div>

        {/* Alerte si l'établissement se retrouve sans directeur opérationnel */}
        {!isLoading && activeDirectors.length === 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 mb-5">
            <strong>Aucun directeur actif</strong> dans cet établissement.
            Personne ne peut y gérer le personnel, les classes ni les notes.
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Chargement...</p>
        ) : sorted.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun compte</p>
            <p className="text-xs text-slate-500 mt-1">
              Créez un directeur depuis la liste des établissements.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((user) => {
              const isDirector = user.roles.includes(Role.DIRECTOR);
              return (
                <li
                  key={user.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    isDirector
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {user.email}
                      </span>
                      {isDirector && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" />
                          DIRECTEUR
                        </span>
                      )}
                      {user.mustChangePassword && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          MOT DE PASSE PROVISOIRE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                      {!user.isActive && ' · compte désactivé'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setResetTarget(user)}
                      title="Réinitialiser son mot de passe"
                      className="p-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-slate-600 hover:text-amber-700 transition-all"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(user)}
                      disabled={statusMutation.isPending}
                      title={user.isActive ? 'Désactiver' : 'Réactiver'}
                      className={`p-2 rounded-lg border transition-all disabled:opacity-40 ${
                        user.isActive
                          ? 'bg-white hover:bg-amber-50 border-slate-200 text-amber-700'
                          : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
          Un directeur ne peut pas réinitialiser son propre mot de passe : c'est
          ici, et uniquement ici, qu'il peut être dépanné.
        </p>

        {resetTarget && (
          <ResetPasswordModal
            user={resetTarget}
            schoolId={school.id}
            onClose={() => setResetTarget(null)}
          />
        )}
      </div>
    </div>
  );
};
