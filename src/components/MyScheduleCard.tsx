import React, { useState } from 'react';
import { CalendarClock, ChevronDown, ChevronUp, Loader2, Printer } from 'lucide-react';
import { useMySchedule } from '../hooks/useSchedule';
import { useSchoolStore } from '../store/useSchoolStore';
import { ScheduleGridView } from './ScheduleGridView';

/**
 * L'emploi du temps de l'enseignant connecté.
 *
 * Replié par défaut : l'enseignant vient sur cet écran pour saisir des notes,
 * et déplier une grille de cinq colonnes repousserait la saisie sous la ligne
 * de flottaison. Les séances affichent la classe en premier — un enseignant
 * sait ce qu'il enseigne, il cherche où il doit être.
 */
export const MyScheduleCard: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useMySchedule(undefined, currentSchool?.id);

  // Aucune séance et aucun créneau : la direction n'a pas encore établi les
  // emplois du temps. Inutile d'afficher une carte vide.
  if (!isLoading && (isError || !data || data.slots.length === 0)) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
          <CalendarClock className="w-5 h-5" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold text-slate-900">
            Mon emploi du temps
          </span>
          <span className="block text-xs text-slate-500">
            {isLoading
              ? 'Chargement...'
              : `${data?.entries.length ?? 0} séance(s) par semaine — année ${data?.academicYear.label}`}
          </span>
        </span>
        <span className="ml-auto text-slate-400">
          {open ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </span>
      </button>

      {open &&
        (isLoading || !data ? (
          <p className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement...
          </p>
        ) : (
          <div className="px-6 pb-6">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer
              </button>
            </div>
            <div id="schedule-printable">
              <ScheduleGridView grid={data} primary="classRoom" />
            </div>
          </div>
        ))}
    </div>
  );
};
