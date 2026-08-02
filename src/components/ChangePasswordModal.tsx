import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ onClose }) => {
  const { token, user, setAuth } = useAuthStore();
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
    if (!canSubmit) return;

    setPending(true);
    try {
      const { data } = await apiClient.patch<{
        access_token: string;
        message: string;
      }>('/auth/password', { currentPassword, newPassword });

      // Le changement révoque les jetons antérieurs : on remplace aussitôt
      // celui de cette session, sinon l'utilisateur se déconnecte lui-même.
      if (user) setAuth(data.access_token, user);

      toast.success(data.message);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du changement';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setPending(false);
    }
  };

  // Le jeton est nécessaire : la modale n'est ouverte que connecté
  if (!token) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Changer mon mot de passe
            </h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mot de passe actuel *
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">Minimum 6 caractères.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Confirmer le nouveau mot de passe *
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
                  : 'border-slate-200 focus:ring-indigo-500'
              }`}
            />
            {mismatch && (
              <p className="mt-1 text-xs text-red-600">
                Les deux saisies ne correspondent pas.
              </p>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Vos autres sessions ouvertes seront déconnectées. Celle-ci reste
            active.
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Modification...</span>
                </>
              ) : (
                <span>Modifier</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
