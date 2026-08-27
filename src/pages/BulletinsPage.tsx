import React, { useEffect, useMemo, useState } from 'react';
import { Award, Download, FileText, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadPdf } from '../api/downloadPdf';
import { useAcademicYears, useClassRooms } from '../hooks/useClasses';
import { useGradingPeriods } from '../hooks/useGrading';
import { useClassBulletins } from '../hooks/useBulletins';
import { BulletinDocument } from '../components/BulletinDocument';
import { useSchoolStore } from '../store/useSchoolStore';
import type { StudentBulletin } from '../types';
import { QueryPanel } from '../components/QueryPanel';

export const BulletinsPage: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data: years = [] } = useAcademicYears();
  const { data: classRooms = [] } = useClassRooms();

  const [academicYearId, setAcademicYearId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [selected, setSelected] = useState<StudentBulletin | null>(null);
  /** Impression de toute la classe : les bulletins sont empilés hors écran. */
  const [printingAll, setPrintingAll] = useState(false);
  /** Identifiant en cours de téléchargement, ou 'class' pour le lot. */
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (years.length > 0 && !academicYearId) {
      setAcademicYearId((years.find((y) => y.isActive) ?? years[0]).id);
    }
  }, [years, academicYearId]);

  useEffect(() => {
    if (classRooms.length > 0 && !classRoomId) setClassRoomId(classRooms[0].id);
  }, [classRooms, classRoomId]);

  const { data: periods = [] } = useGradingPeriods(academicYearId);
  useEffect(() => {
    if (periods.length > 0 && !periods.some((p) => p.id === periodId)) {
      setPeriodId(periods[0].id);
    }
  }, [periods, periodId]);

  const bulletinsQuery = useClassBulletins(classRoomId, periodId);
  const { data, isLoading } = bulletinsQuery;
  const bulletins = data?.bulletins ?? [];
  const period = data?.period;

  const yearLabel = years.find((y) => y.id === academicYearId)?.label;
  const className = classRooms.find((c) => c.id === classRoomId)?.name;

  /** Repères de la classe, affichés au-dessus du tableau. */
  const stats = useMemo(() => {
    const graded = bulletins.filter((b) => b.average !== null);
    if (graded.length === 0) return null;
    const values = graded.map((b) => b.average as number);
    return {
      count: graded.length,
      average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
      best: Math.max(...values),
      worst: Math.min(...values),
      passing: values.filter((v) => v >= 10).length,
    };
  }, [bulletins]);

  /**
   * PDF produits par le serveur : mise en page identique quel que soit le
   * navigateur, et fichier archivable — contrairement à l'impression du HTML.
   */
  const withSchool = (url: string) =>
    currentSchool?.id
      ? `${url}${url.includes('?') ? '&' : '?'}schoolId=${currentSchool.id}`
      : url;

  const downloadClassPdf = async () => {
    setDownloading('class');
    try {
      await downloadPdf(
        withSchool(
          `/bulletins/classroom/${classRoomId}/pdf?gradingPeriodId=${periodId}`,
        ),
        `bulletins-${className ?? 'classe'}.pdf`,
      );
    } catch {
      toast.error("Les bulletins n'ont pas pu être générés.");
    } finally {
      setDownloading(null);
    }
  };

  const downloadOne = async (bulletin: StudentBulletin) => {
    setDownloading(bulletin.enrollmentId);
    try {
      await downloadPdf(
        withSchool(
          `/bulletins/enrollment/${bulletin.enrollmentId}/pdf?gradingPeriodId=${periodId}`,
        ),
        `bulletin-${bulletin.lastName}-${bulletin.firstName}.pdf`,
      );
    } catch {
      toast.error("Le bulletin n'a pas pu être généré.");
    } finally {
      setDownloading(null);
    }
  };

  const printAll = () => {
    setPrintingAll(true);
    // Laisse React peindre les bulletins avant d'ouvrir la boîte d'impression
    setTimeout(() => {
      window.print();
      setPrintingAll(false);
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex items-center space-x-6 print:hidden">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulletins</h1>
          <p className="text-slate-500 mt-1">
            Moyennes, rangs et édition des bulletins par classe.
          </p>
        </div>
      </div>

      {/* Sélection */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Année scolaire
          </label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
                {y.isActive ? ' (active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Classe
          </label>
          <select
            value={classRoomId}
            onChange={(e) => setClassRoomId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            {classRooms.length === 0 ? (
              <option value="">Aucune classe</option>
            ) : (
              classRooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Période
          </label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            {periods.length === 0 ? (
              <option value="">Aucune période</option>
            ) : (
              periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.isClosed ? ' (clôturée)' : ''}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Tableau de la classe */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 print:hidden">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {className} — {period?.label}
            </h2>
            {stats && (
              <p className="text-sm text-slate-500 mt-0.5">
                Moyenne de classe {stats.average.toFixed(2)}/20 · {stats.passing}/
                {stats.count} au-dessus de 10 · extrêmes {stats.worst.toFixed(2)} –{' '}
                {stats.best.toFixed(2)}
              </p>
            )}
          </div>
          {bulletins.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={printAll}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
              <button
                onClick={downloadClassPdf}
                disabled={downloading !== null}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloading === 'class'
                    ? 'Génération...'
                    : `PDF de la classe (${bulletins.length})`}
                </span>
              </button>
            </div>
          )}
        </div>

        {bulletinsQuery.error ? (
          <QueryPanel
            query={bulletinsQuery}
            fallback="Les bulletins de cette classe sont momentanément indisponibles."
          >
            {null}
          </QueryPanel>
        ) : isLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Calcul des bulletins...</p>
        ) : bulletins.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Aucun bulletin</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aucun élève inscrit dans cette classe pour cette année scolaire.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                  <th className="py-3 px-4 w-12 text-center">Rang</th>
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-4 text-center">Moyenne</th>
                  <th className="py-3 px-4 text-center">Absences</th>
                  <th className="py-3 px-4 text-right">Bulletin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bulletins.map((b) => (
                  <tr key={b.enrollmentId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                      {b.rank ?? '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {b.lastName} {b.firstName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono font-bold ${
                          b.average === null
                            ? 'text-slate-300'
                            : b.average >= 10
                              ? 'text-emerald-700'
                              : 'text-red-600'
                        }`}
                      >
                        {b.average !== null ? `${b.average.toFixed(2)}/20` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500 font-mono">
                      {b.absences.justified + b.absences.unjustified > 0
                        ? `${b.absences.justified + b.absences.unjustified} ½ j.`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelected(b)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => downloadOne(b)}
                          disabled={downloading !== null}
                          title="Télécharger le bulletin en PDF"
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all disabled:opacity-40"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulletin individuel */}
      {selected && period && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto print:static print:bg-transparent print:p-0 print:block">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8 print:my-0 print:shadow-none print:rounded-none print:max-w-none">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 print:hidden">
              <h2 className="font-bold text-slate-900">
                Bulletin — {selected.lastName} {selected.firstName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div id="bulletin-printable" className="p-6 sm:p-8 print:p-0">
              <BulletinDocument
                bulletin={selected}
                period={period}
                schoolName={currentSchool?.name}
                academicYearLabel={yearLabel}
                className={className}
              />
            </div>
          </div>
        </div>
      )}

      {/* Impression en lot : rendu hors écran, visible uniquement à l'impression */}
      {printingAll && period && (
        <div id="bulletin-printable" className="hidden print:block">
          {bulletins.map((b, index) => (
            <BulletinDocument
              key={b.enrollmentId}
              bulletin={b}
              period={period}
              schoolName={currentSchool?.name}
              academicYearLabel={yearLabel}
              className={className}
              pageBreak={index < bulletins.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
