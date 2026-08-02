import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { School as SchoolIcon, Lock, Mail, Loader2 } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    loginMutation.mutate(
      { email, password, slug: slug.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Connexion réussie');
          navigate('/');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Erreur de connexion');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl shadow-lg mb-4">
          <SchoolIcon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Gesta School
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Connectez-vous à votre espace de gestion
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Adresse Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="admin@gestashool.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Slug de l'établissement
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SchoolIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="Ex: saint-jean (facultatif pour le Super Admin)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
