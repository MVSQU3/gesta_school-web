import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Copy, KeyRound, Loader2, ShieldAlert, X } from 'lucide-react';
import { apiClient } from '../api/client';
import type { User } from '../types';

interface Props {
  user: User;
  /** Requis pour le super-admin, qui n'est rattaché à aucune école. */
  schoolId?: string;
  onClose: () => void;
}

type Mode = 'generate' | 'manual';

export const ResetPasswordModal: React.FC<Props> = ({
  user,
  schoolId,
  onClose,
}) => {
  const [mode, setMode] = useState<Mode>('generate');
  const [manualPassword, setManualPassword] = useState('');
  const [pending, setPending] = useState(false);
  /** Renseigné une fois l'opération faite : le mot de passe n'est montré qu'ici. */
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (mode === 'manual' && manualPassword.trim().length < 6) {
      toast.error('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setPending(true);
    try {
      const { data } = await apiClient.patch<{
        message: string;
        email: string;
        temporaryPassword: string;
      }>(
        `/users/${user.id}/password${schoolId ? `?schoolId=${schoolId}` : ''}`,
        mode === 'manual' ? { newPassword: manualPassword.trim() } : {},
      );
      setResult(data.temporaryPassword);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Réinitialisation impossible';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le presse-papiers est refusé hors HTTPS : le mot de passe reste lisible
      toast.error('Copie impossible — sélectionnez le mot de passe à la main.');
    }
  };

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
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              Réinitialiser un mot de passe
            </h2>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {result ? (
          /* ─── Résultat : le mot de passe n'est affiché qu'ici ─── */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-xs font-semibold text-emerald-800 mb-2">
                Mot de passe provisoire de {user.email}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-lg text-slate-900 tracking-wider text-center select-all">
                  {result}
                </code>
                <button
                  onClick={copy}
                  title="Copier"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Notez-le maintenant.</p>
                <p>
                  Il ne sera plus affiché. Ses sessions ouvertes sont fermées, et
                  il devra choisir son propre mot de passe dès sa prochaine
                  connexion — il ne pourra rien faire d'autre avant.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm"
            >
              J'ai noté le mot de passe
            </button>
          </div>
        ) : (
          /* ─── Choix du mode ─── */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('generate')}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  mode === 'generate'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Générer
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  mode === 'manual'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Définir moi-même
              </button>
            </div>

            {mode === 'generate' ? (
              <p className="text-xs text-slate-500">
                Un mot de passe provisoire de 10 caractères sera généré, sans
                caractère ambigu — ni O/0, ni I/l/1 — pour pouvoir être dicté
                ou recopié sans erreur.
              </p>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mot de passe provisoire *
                </label>
                <input
                  type="text"
                  minLength={6}
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              Les sessions ouvertes de cet employé seront immédiatement fermées,
              et il devra choisir son propre mot de passe à la connexion
              suivante.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={pending}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Réinitialisation...</span>
                  </>
                ) : (
                  <span>Réinitialiser</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
