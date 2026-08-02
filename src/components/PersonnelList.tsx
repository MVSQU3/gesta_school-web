import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, KeyRound, Loader2, Pencil, Power, Trash2, X } from 'lucide-react';
import { Role, ROLE_LABELS, type User } from '../types';
import {
  useDeleteStaff,
  useSetStaffStatus,
  useStaff,
  useUpdateStaff,
} from '../hooks/useUsers';
import { useAuthStore } from '../store/useAuthStore';
import { ResetPasswordModal } from './ResetPasswordModal';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

export const PersonnelList: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { data: staff = [], isLoading } = useStaff();
  const updateMutation = useUpdateStaff();
  const statusMutation = useSetStaffStatus();
  const deleteMutation = useDeleteStaff();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>(Role.SECRETARY);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditEmail(user.email);
    setEditRole(user.roles[0] ?? Role.SECRETARY);
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate(
      { id, email: editEmail.trim(), roles: [editRole] },
      {
        onSuccess: () => {
          toast.success('Employé mis à jour.');
          setEditingId(null);
        },
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la modification')),
      },
    );
  };

  const toggleStatus = (user: User) => {
    statusMutation.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onSuccess: () =>
          toast.success(
            user.isActive
              ? `Compte de ${user.email} désactivé.`
              : `Compte de ${user.email} réactivé.`,
          ),
        onError: (err) => toast.error(errorMessage(err, 'Erreur lors du changement de statut')),
      },
    );
  };

  const remove = (user: User) => {
    if (
      !window.confirm(
        `Supprimer définitivement le compte ${user.email} ?\n\nLes inscriptions saisies et les encaissements réalisés sont conservés, mais ne lui seront plus attribués nominativement.\n\nPour conserver l'attribution, désactivez le compte plutôt que de le supprimer.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(user.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err, 'Erreur lors de la suppression')),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-6">Chargement du personnel...</p>;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h2 className="text-lg font-bold text-slate-800 mb-6">
        Personnel de l'établissement
        <span className="ml-2 text-xs font-normal text-slate-400">
          ({staff.length} compte{staff.length > 1 ? 's' : ''})
        </span>
      </h2>

      {staff.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">Aucun employé enregistré.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Rôle</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {staff.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isEditing = editingId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <span className="font-medium text-slate-800">
                          {user.email}
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              VOUS
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Role)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value={Role.SECRETARY}>{ROLE_LABELS[Role.SECRETARY]}</option>
                          <option value={Role.ACCOUNTANT}>{ROLE_LABELS[Role.ACCOUNTANT]}</option>
                          <option value={Role.TEACHER}>{ROLE_LABELS[Role.TEACHER]}</option>
                          <option value={Role.DIRECTOR}>{ROLE_LABELS[Role.DIRECTOR]}</option>
                        </select>
                      ) : (
                        <span className="text-slate-600">
                          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end space-x-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(user.id)}
                              disabled={updateMutation.isPending}
                              title="Enregistrer"
                              className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              title="Annuler"
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              title="Modifier"
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setResetTarget(user)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'Utilisez « Changer mon mot de passe » dans la barre du haut'
                                  : 'Réinitialiser son mot de passe'
                              }
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleStatus(user)}
                              disabled={isSelf || statusMutation.isPending}
                              title={
                                isSelf
                                  ? 'Vous ne pouvez pas désactiver votre propre compte'
                                  : user.isActive
                                    ? 'Désactiver'
                                    : 'Réactiver'
                              }
                              className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                user.isActive
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => remove(user)}
                              disabled={isSelf || deleteMutation.isPending}
                              title={
                                isSelf
                                  ? 'Vous ne pouvez pas supprimer votre propre compte'
                                  : 'Supprimer'
                              }
                              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}

      <p className="text-xs text-slate-400 mt-5 border-t border-slate-100 pt-4">
        <strong>Désactiver</strong> coupe l'accès tout en conservant le nom de l'employé
        sur les dossiers qu'il a saisis et les encaissements qu'il a réalisés.
        <strong> Supprimer</strong> efface le compte : l'historique reste, mais sans
        attribution nominative.
      </p>
    </div>
  );
};
