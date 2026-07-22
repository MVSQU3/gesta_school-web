import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Mail, Lock, Shield, PlusCircle, Loader2 } from 'lucide-react';
import { useCreateUser } from '../hooks/useUsers';
import { Role } from '../types';

export const DirectionPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.SECRETARY);

  const createUserMutation = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) return;

    createUserMutation.mutate(
      { email, password, roles: [role] },
      {
        onSuccess: () => {
          toast.success(`Utilisateur ${role} créé avec succès !`);
          setEmail('');
          setPassword('');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur lors de la création de l'utilisateur";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête Espace Direction */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex items-center space-x-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Direction</h1>
          <p className="text-slate-500 mt-1">
            Gérez votre personnel (Secrétaires et Comptables) pour votre établissement.
          </p>
        </div>
      </div>

      {/* Formulaire de création d'utilisateur */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <PlusCircle className="w-5 h-5 mr-2 text-indigo-500" />
          Ajouter un nouvel employé
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Adresse Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="employe@ecole.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">Minimum 6 caractères.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rôle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-slate-400" />
              </div>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all bg-white"
              >
                <option value={Role.SECRETARY}>Secrétaire</option>
                <option value={Role.ACCOUNTANT}>Comptable</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
          >
            {createUserMutation.isPending ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Création en cours...
              </>
            ) : (
              'Créer le compte'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
