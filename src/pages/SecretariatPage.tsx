import React, { useState } from 'react';
import { UserPlus, Ghost, FolderOpen } from 'lucide-react';
import { SecretariatForm } from '../components/SecretariatForm';
import { LesOubliesTable } from '../components/LesOubliesTable';
import { DossiersTable } from '../components/DossiersTable';

export const SecretariatPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inscription' | 'dossiers' | 'oublies'>(
    'inscription',
  );

  return (
    <div className="space-y-6">
      {/* Navigation sous-onglets Secrétariat */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveSubTab('inscription')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSubTab === 'inscription'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvelle Inscription (Ticket 72H)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dossiers')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSubTab === 'dossiers'
              ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Dossiers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('oublies')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSubTab === 'oublies'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ghost className="w-4 h-4" />
          <span>Les Oubliés (Dossiers Expirés)</span>
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeSubTab === 'inscription' && <SecretariatForm />}
      {activeSubTab === 'dossiers' && <DossiersTable />}
      {activeSubTab === 'oublies' && <LesOubliesTable />}
    </div>
  );
};
