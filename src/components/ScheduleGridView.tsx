import React from 'react';
import { Coffee, Plus, X } from 'lucide-react';
import {
  DAY_LABELS,
  SCHOOL_DAYS,
  type DayOfWeek,
  type ScheduleCell,
  type ScheduleGrid,
} from '../types';

/** `HH:MM:SS` → `07h30`, la forme lue en Côte d'Ivoire. */
export const formatHour = (time: string) => time.slice(0, 5).replace(':', 'h');

interface Props {
  grid: ScheduleGrid;
  /** Ce que la séance affiche en gros : la matière, ou la classe. */
  primary?: 'subject' | 'classRoom';
  /** Composition : appelé au clic sur une case libre. */
  onPlace?: (day: DayOfWeek, timeSlotId: string) => void;
  /** Composition : appelé pour retirer une séance. */
  onRemove?: (entry: ScheduleCell) => void;
}

/**
 * La grille hebdomadaire : les créneaux en lignes, les jours en colonnes.
 *
 * Le même composant sert la consultation et la composition — c'est le passage
 * de `onPlace` qui fait apparaître les cases cliquables. Deux grilles séparées
 * auraient fini par diverger, alors que le directeur et l'enseignant doivent
 * voir exactement la même chose.
 *
 * Les pauses occupent leur ligne mais n'accueillent rien : la journée reste
 * lisible telle qu'elle se déroule.
 */
export const ScheduleGridView: React.FC<Props> = ({
  grid,
  primary = 'subject',
  onPlace,
  onRemove,
}) => {
  if (grid.slots.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-2xl p-10 text-center">
        <p className="text-sm font-semibold text-slate-600">
          La grille horaire n'est pas encore définie.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Créez les créneaux de la journée avant de composer les emplois du temps.
        </p>
      </div>
    );
  }

  // Une case au plus par (jour, créneau) : la base l'impose déjà.
  const byCell = new Map<string, ScheduleCell>();
  grid.entries.forEach((entry) => {
    byCell.set(`${entry.dayOfWeek}-${entry.timeSlotId}`, entry);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[44rem]">
        <thead>
          <tr>
            <th className="w-32 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold p-2">
              Horaire
            </th>
            {SCHOOL_DAYS.map((day) => (
              <th
                key={day}
                className="text-center text-xs font-bold text-slate-700 p-2"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.slots.map((slot) => (
            <tr key={slot.id}>
              <th className="align-top text-left p-2 border-t border-slate-100">
                <span className="block text-xs font-semibold text-slate-700">
                  {slot.label}
                </span>
                <span className="block font-mono text-[11px] text-slate-400">
                  {formatHour(slot.startTime)} – {formatHour(slot.endTime)}
                </span>
              </th>

              {slot.isBreak ? (
                <td
                  colSpan={SCHOOL_DAYS.length}
                  className="border-t border-slate-100 p-2"
                >
                  <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-semibold">
                    <Coffee className="w-3.5 h-3.5" />
                    {slot.label}
                  </div>
                </td>
              ) : (
                SCHOOL_DAYS.map((day) => {
                  const entry = byCell.get(`${day}-${slot.id}`);
                  return (
                    <td
                      key={day}
                      className="border-t border-slate-100 p-1 align-top w-1/5"
                    >
                      {entry ? (
                        <SessionCell
                          entry={entry}
                          primary={primary}
                          onRemove={onRemove}
                        />
                      ) : onPlace ? (
                        <button
                          type="button"
                          onClick={() => onPlace(day, slot.id)}
                          className="w-full h-full min-h-[3.5rem] rounded-xl border border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500 flex items-center justify-center transition-colors"
                          aria-label={`Placer un cours le ${DAY_LABELS[day]}, ${slot.label}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="min-h-[3.5rem]" />
                      )}
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SessionCell: React.FC<{
  entry: ScheduleCell;
  primary: 'subject' | 'classRoom';
  onRemove?: (entry: ScheduleCell) => void;
}> = ({ entry, primary, onRemove }) => (
  <div className="group relative min-h-[3.5rem] rounded-xl bg-slate-900 text-white px-2.5 py-2">
    <span className="block text-xs font-bold leading-tight">
      {primary === 'subject'
        ? entry.subject.shortName || entry.subject.name
        : entry.classRoom.name}
    </span>
    <span className="block text-[10px] text-slate-300 leading-tight mt-0.5 truncate">
      {primary === 'subject'
        ? entry.teacher.email.split('@')[0]
        : entry.subject.name}
    </span>

    {onRemove && (
      <button
        type="button"
        onClick={() => onRemove(entry)}
        className="absolute top-1 right-1 p-0.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white transition-opacity"
        aria-label="Retirer cette séance"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);
