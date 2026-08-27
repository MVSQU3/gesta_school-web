import React, { useState } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  Banknote,
} from 'lucide-react';
import {
  EnrollmentStatus,
  ENROLLMENT_STATUS_LABELS,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
} from '../types';
import { useDashboard } from '../hooks/useDashboard';
import { QueryPanel } from './QueryPanel';
import { useAcademicYears } from '../hooks/useClasses';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING_PAYMENT]: 'bg-amber-500',
  [EnrollmentStatus.PARTIALLY_PAID]: 'bg-sky-500',
  [EnrollmentStatus.ENROLLED]: 'bg-emerald-500',
  [EnrollmentStatus.EXPIRED]: 'bg-red-500',
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: string;
}> = ({ icon, label, value, hint, tone }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-2.5 rounded-xl ${tone}`}>{icon}</div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">
      {value}
    </span>
    {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
  </div>
);

export const DashboardDirection: React.FC = () => {
  const [academicYearId, setAcademicYearId] = useState('');
  const { data: years = [] } = useAcademicYears();
  const dashboard = useDashboard(academicYearId || undefined);
  const { data, isLoading } = dashboard;

  /**
   * L'échec est traité avant l'absence d'année.
   *
   * Sans cette branche, une API en panne rendait `data` indéfini et l'écran
   * concluait « Aucune année scolaire configurée » — un diagnostic faux, qui
   * envoie le directeur créer une année qui existe déjà.
   */
  if (dashboard.error || isLoading) {
    return (
      <QueryPanel
        query={dashboard}
        loading="Chargement des statistiques…"
        fallback="Les statistiques sont momentanément indisponibles."
      >
        {null}
      </QueryPanel>
    );
  }

  if (!data || !data.academicYear) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">
          Aucune année scolaire configurée
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Créez une année scolaire et activez-la depuis l'onglet « Année Scolaire »
          pour voir apparaître les statistiques de votre établissement.
        </p>
      </div>
    );
  }

  const { enrollments, finance, byClassRoom } = data;
  const maxOutstanding = Math.max(...byClassRoom.map((c) => c.outstanding), 1);

  return (
    <div className="space-y-6">
      {/* Sélecteur d'année */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <CalendarDays className="w-4 h-4" />
          <span>
            Année scolaire <strong className="text-slate-800">{data.academicYear.label}</strong>
          </span>
        </div>
        <select
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
        >
          <option value="">Année active</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
              {y.isActive ? ' (active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          tone="bg-indigo-50"
          label="Dossiers"
          value={String(enrollments.total)}
          hint={`${enrollments.byStatus[EnrollmentStatus.ENROLLED]} soldé(s)`}
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          tone="bg-emerald-50"
          label="Encaissé"
          value={formatFcfa(finance.totalCollected)}
          hint={`sur ${formatFcfa(finance.totalDue)} attendus`}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          tone="bg-red-50"
          label="Reste à recouvrer"
          value={formatFcfa(finance.outstanding)}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5 text-sky-600" />}
          tone="bg-sky-50"
          label="Encaissé aujourd'hui"
          value={formatFcfa(finance.collectedToday)}
          hint="toutes années confondues"
        />
      </div>

      {/* Taux de recouvrement */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-800">
              Taux de recouvrement
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900">
            {finance.recoveryRate}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
            style={{ width: `${Math.min(finance.recoveryRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des dossiers */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Répartition des dossiers
          </h3>
          <div className="space-y-3">
            {Object.values(EnrollmentStatus).map((status) => {
              const count = enrollments.byStatus[status];
              const pct = enrollments.total > 0 ? (count / enrollments.total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">
                      {ENROLLMENT_STATUS_LABELS[status]}
                    </span>
                    <span className="font-mono font-bold text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Encaissements par mode */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Encaissements par mode de règlement
          </h3>
          <div className="space-y-3">
            {Object.values(PaymentMethod).map((m) => {
              const amount = finance.byMethod[m] ?? 0;
              const pct =
                finance.totalCollected > 0 ? (amount / finance.totalCollected) * 100 : 0;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{PAYMENT_METHOD_LABELS[m]}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatFcfa(amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-700 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Détail par classe */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Recouvrement par classe
          <span className="ml-2 text-xs font-normal text-slate-400">
            (trié par reste à recouvrer)
          </span>
        </h3>

        {byClassRoom.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            Aucun dossier sur cette année scolaire.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3 text-center">Élèves</th>
                  <th className="py-2.5 px-3 text-right">Attendu</th>
                  <th className="py-2.5 px-3 text-right">Encaissé</th>
                  <th className="py-2.5 px-3 text-right">Reste</th>
                  <th className="py-2.5 px-3 w-32">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {byClassRoom.map((c) => {
                  const pct = c.totalDue > 0 ? (c.collected / c.totalDue) * 100 : 0;
                  return (
                    <tr key={c.classRoomId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {c.enrollmentCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatFcfa(c.totalDue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">
                        {formatFcfa(c.collected)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                        {formatFcfa(c.outstanding)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                            title={`${Math.round(pct)}%`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {byClassRoom.length > 0 && maxOutstanding > 0 && (
          <p className="text-xs text-slate-400 mt-4">
            La classe <strong>{byClassRoom[0].name}</strong> concentre le plus gros
            reste à recouvrer : {formatFcfa(byClassRoom[0].outstanding)}.
          </p>
        )}
      </div>
    </div>
  );
};
