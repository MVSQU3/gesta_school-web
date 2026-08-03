import React from "react";
import type { GradingPeriod, StudentBulletin } from "../types";

/**
 * Mention attribuée d'après la moyenne générale.
 *
 * Barème usuel en Côte d'Ivoire. Il n'est pas configurable pour l'instant :
 * si votre établissement applique d'autres seuils, ils sont à ajuster ici.
 */
function mentionFor(average: number | null): { label: string; tone: string } {
  if (average === null) return { label: "—", tone: "text-slate-400" };
  if (average >= 16) return { label: "Excellent", tone: "text-emerald-700" };
  if (average >= 14) return { label: "Très bien", tone: "text-emerald-600" };
  if (average >= 12) return { label: "Bien", tone: "text-sky-700" };
  if (average >= 10) return { label: "Assez bien", tone: "text-slate-700" };
  if (average >= 8) return { label: "Insuffisant", tone: "text-amber-700" };
  return { label: "Très insuffisant", tone: "text-red-700" };
}

const fmt = (v: number | null, suffix = "") =>
  v === null || v === undefined ? "—" : `${v.toFixed(2)}${suffix}`;

interface Props {
  bulletin: StudentBulletin;
  period: GradingPeriod;
  schoolName?: string;
  academicYearLabel?: string;
  className?: string;
  /** Saut de page après ce bulletin, pour l'impression en lot. */
  pageBreak?: boolean;
}

export const BulletinDocument: React.FC<Props> = ({
  bulletin,
  period,
  schoolName,
  academicYearLabel,
  className,
  pageBreak = false,
}) => {
  const mention = mentionFor(bulletin.average);
  const totalAbsences =
    bulletin.absences.justified + bulletin.absences.unjustified;

  return (
    <article
      className={`bulletin-page bg-white ${pageBreak ? "break-after-page" : ""}`}
    >
      {/* En-tête */}
      <header className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">
          {schoolName || "Établissement scolaire"}
        </h1>
        <p className="text-sm font-bold text-slate-700 mt-1">
          Bulletin de notes — {period.label}
        </p>
        {academicYearLabel && (
          <p className="text-xs text-slate-500 font-mono">
            Année scolaire {academicYearLabel}
          </p>
        )}
      </header>

      {/* Identité de l'élève */}
      <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
        <div className="col-span-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold block">
            Élève
          </span>
          <span className="font-bold text-slate-900 text-base">
            {bulletin.lastName} {bulletin.firstName}
          </span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold block">
            Classe
          </span>
          <span className="font-semibold text-slate-800">
            {className || "—"}
          </span>
        </div>
      </div>

      {/* Tableau des matières */}
      <table className="w-full border-collapse text-sm mb-5">
        <thead>
          <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
            <th className="border border-slate-300 px-2 py-1.5 text-left">
              Matière
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">
              Coef.
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-16 text-center">
              Moy.
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-16 text-center">
              Points
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-16 text-center">
              Moy. cl.
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">
              Min
            </th>
            <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">
              Max
            </th>
          </tr>
        </thead>
        <tbody>
          {bulletin.subjects.map((s) => {
            const notGraded = s.average === null;
            return (
              <tr
                key={s.subjectId}
                className={notGraded ? "text-slate-400" : ""}
              >
                <td className="border border-slate-300 px-2 py-1.5 font-medium">
                  {s.name}
                  {notGraded && (
                    <span className="ml-2 text-[10px] italic">non évaluée</span>
                  )}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                  {s.coefficient}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold">
                  {fmt(s.average)}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                  {fmt(s.points)}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-slate-500">
                  {fmt(s.classAverage)}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-slate-500">
                  {fmt(s.classMin)}
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-slate-500">
                  {fmt(s.classMax)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 font-bold">
            <td className="border border-slate-300 px-2 py-1.5 text-right">
              Totaux
            </td>
            <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
              {bulletin.totalCoefficients}
            </td>
            <td className="border border-slate-300 px-2 py-1.5" />
            <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
              {bulletin.totalPoints.toFixed(2)}
            </td>
            <td className="border border-slate-300 px-2 py-1.5" colSpan={3} />
          </tr>
        </tfoot>
      </table>

      {/* Synthèse */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <SummaryBox
          label="Moyenne générale"
          value={
            bulletin.average !== null
              ? `${bulletin.average.toFixed(2)}/20`
              : "—"
          }
          strong
        />
        <SummaryBox
          label="Rang"
          value={
            bulletin.rank !== null
              ? `${bulletin.rank}${bulletin.rank === 1 ? "er" : "e"} / ${bulletin.classSize}`
              : "Non classé"
          }
        />
        <SummaryBox label="Mention" value={mention.label} tone={mention.tone} />
        <SummaryBox
          label="Absences"
          value={`${totalAbsences} ½ j.`}
          hint={`${bulletin.absences.justified} just. · ${bulletin.absences.unjustified} non just.`}
        />
      </div>

      {bulletin.average === null && (
        <p className="text-xs text-slate-500 italic mb-5">
          Aucune note n'a été saisie pour cet élève sur cette période : il n'est
          pas classé.
        </p>
      )}

      {/* Appréciation et signature */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="border border-slate-300 rounded p-3 h-24">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold block mb-1">
            Appréciation du conseil de classe
          </span>
        </div>
        <div className="border border-slate-300 rounded p-3 h-24">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold block mb-1">
            Visa de la direction
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-4">
        Document édité le {new Date().toLocaleDateString("fr-FR")} — Gesta
        School
      </p>
    </article>
  );
};

const SummaryBox: React.FC<{
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  strong?: boolean;
}> = ({ label, value, hint, tone, strong }) => (
  <div
    className={`border rounded p-2.5 text-center ${
      strong ? "border-slate-800 border-2" : "border-slate-300"
    }`}
  >
    <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold block">
      {label}
    </span>
    <span
      className={`font-mono font-black ${strong ? "text-lg" : "text-sm"} ${tone ?? "text-slate-900"}`}
    >
      {value}
    </span>
    {hint && (
      <span className="text-[10px] text-slate-400 block mt-0.5">{hint}</span>
    )}
  </div>
);
