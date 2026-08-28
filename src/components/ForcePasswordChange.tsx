import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT } from '../api/passwordPolicy';

/**
 * Écran bloquant affiché tant que l'utilisateur détient un mot de passe
 * provisoire. Il n'est pas fermable : la seule issue est de choisir un mot de
 * passe, ou de se déconnecter. Le serveur refuse de toute façon toute autre
 * route dans cet état.
 */
export const ForcePasswordChange: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !pending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setPending(true);
    try {
      await apiClient.patch<{
        message: string;
      }>('/auth/password', { currentPassword, newPassword });

      // Le drapeau est levé côté serveur, et le cookie renouvelé sur cette
      // même réponse : il ne reste qu'à mettre le profil local à jour.
      setUser({ ...user, mustChangePassword: false });
      toast.success('Mot de passe défini. Bienvenue !');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du changement';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 my-8">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900">
              Choisissez votre mot de passe
            </h1>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-5">
          Votre mot de passe actuel est provisoire : il vous a été communiqué par
          la direction. Vous devez en choisir un nouveau, connu de vous seul,
          avant d'accéder à l'application.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mot de passe provisoire *
            </label>
            <input
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">{PASSWORD_HINT}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirmer *
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-sm ${
                mismatch
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-slate-200 focus:ring-amber-500'
              }`}
            />
            {mismatch && (
              <p className="mt-1 text-xs text-red-600">
                Les deux saisies ne correspondent pas.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Définir mon mot de passe</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter</span>
          </button>
        </form>
      </div>
    </div>
  );
};
