import React, { useState } from 'react';
import {
  Search,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pencil,
  History,
  Download,
} from 'lucide-react';
import {
  EnrollmentStatus,
  ENROLLMENT_STATUS_LABELS,
  type Enrollment,
} from '../types';
import { useEnrollmentsList } from '../hooks/useEnrollments';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useSchoolStore } from '../store/useSchoolStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import { EditDossierModal } from './EditDossierModal';
import { StudentHistoryModal } from './StudentHistoryModal';
import { downloadCsv } from '../api/downloadPdf';
import toast from 'react-hot-toast';

const formatFcfa = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`;

const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING_PAYMENT]: 'bg-amber-100 text-amber-800 border-amber-200',
  [EnrollmentStatus.PARTIALLY_PAID]: 'bg-sky-100 text-sky-800 border-sky-200',
  [EnrollmentStatus.ENROLLED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [EnrollmentStatus.EXPIRED]: 'bg-red-100 text-red-700 border-red-200',
};

const StatusBadge: React.FC<{ status: EnrollmentStatus }> = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${STATUS_STYLES[status]}`}
  >
    {ENROLLMENT_STATUS_LABELS[status]}
  </span>
);

export const DossiersTable: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const user = useAuthStore((s) => s.user);
  // La suppression d'un dossier est réservée à la direction ; la correction
  // reste ouverte au secrétariat, qui est celui qui saisit.
  const canDelete = !!user?.roles.some((r) =>
    [Role.SUPER_ADMIN, Role.DIRECTOR].includes(r),
  );
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  /**
   * Export tableur des dossiers filtrés, avec leur situation financière.
   *
   * C'est le document de relance des familles : il reprend les filtres
   * affichés — classe, année, statut, recherche — mais sans pagination.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (academicYearId) params.append('academicYearId', academicYearId);
      if (classRoomId) params.append('classRoomId', classRoomId);
      if (currentSchool?.id) params.append('schoolId', currentSchool.id);
      await downloadCsv(`/enrollments/export?${params.toString()}`, 'dossiers.csv');
    } catch {
      toast.error("L'export a échoué.");
    } finally {
      setExporting(false);
    }
  };
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [page, setPage] = useState(1);

  const { data: classRooms = [] } = useClassRooms();
  const { data: academicYears = [] } = useAcademicYears();

  const { data, isLoading, isFetching, refetch } = useEnrollmentsList({
    search,
    status,
    academicYearId,
    classRoomId,
    page,
    limit: 20,
    schoolId: currentSchool?.id,
  });

  const items: Enrollment[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  /** Tout changement de filtre ramène à la première page. */
  const applyFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter(() => setSearch(searchInput));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Dossiers d'inscription</h2>
            <p className="text-sm text-slate-500">
              {total} dossier{total > 1 ? 's' : ''} — recherche par nom, référence ou téléphone
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Export...' : 'Exporter (CSV)'}</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Nom, prénom, référence ou téléphone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </form>

        <select
          value={status}
          onChange={(e) => applyFilter(() => setStatus(e.target.value as EnrollmentStatus | ''))}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          {Object.values(EnrollmentStatus).map((s) => (
            <option key={s} value={s}>
              {ENROLLMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={classRoomId}
          onChange={(e) => applyFilter(() => setClassRoomId(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
        >
          <option value="">Toutes les classes</option>
          {classRooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={academicYearId}
          onChange={(e) => applyFilter(() => setAcademicYearId(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white lg:col-span-4"
        >
          <option value="">Toutes les années scolaires</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
              {y.isActive ? ' (active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Chargement des dossiers...</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun dossier trouvé</h3>
          <p className="text-xs text-slate-500 mt-1">
            Aucun dossier ne correspond aux filtres sélectionnés.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Total dû</th>
                <th className="py-3 px-4 text-right">Versé</th>
                <th className="py-3 px-4 text-right">Reste</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {item.student?.firstName} {item.student?.lastName}
                    <div className="text-xs text-slate-400 font-mono font-normal">
                      {item.student?.parentPhone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-xs text-slate-700">
                      {item.reference}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.classRoom?.name || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {item.balanceInfo && item.balanceInfo.totalDue > 0
                      ? formatFcfa(item.balanceInfo.totalDue)
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sky-700">
                    {formatFcfa(item.balanceInfo?.amountPaid ?? 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-mono font-bold ${
                        (item.balanceInfo?.balance ?? 0) > 0
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatFcfa(item.balanceInfo?.balance ?? 0)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setHistoryOf(item.studentId)}
                      title="Voir le dossier de l'élève"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditing(item)}
                      title="Corriger ce dossier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Page {page} sur {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      <StudentHistoryModal
        studentId={historyOf}
        onClose={() => setHistoryOf(null)}
      />

      <EditDossierModal
        key={editing?.id ?? 'aucun'}
        dossier={editing}
        canDelete={canDelete}
        onClose={() => setEditing(null)}
      />
    </div>
  );
};
