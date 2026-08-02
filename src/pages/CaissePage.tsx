import React, { useState } from 'react';
import { CreditCard, BookOpen } from 'lucide-react';
import { CaisseGuichet } from '../components/CaisseGuichet';
import { JournalCaisse } from '../components/JournalCaisse';

export const CaissePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guichet' | 'journal'>('guichet');

  return (
    <div className="space-y-6">
      {/* Navigation sous-onglets Caisse */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 print:hidden">
        <button
          onClick={() => setActiveTab('guichet')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'guichet'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Guichet</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'journal'
              ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Journal de caisse</span>
        </button>
      </div>

      {activeTab === 'guichet' ? <CaisseGuichet /> : <JournalCaisse />}
    </div>
  );
};
