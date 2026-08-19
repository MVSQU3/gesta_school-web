import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Clock,
  Coffee,
  Grid3x3,
  Loader2,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import {
  DAY_LABELS,
  type AssignmentUsage,
  type DayOfWeek,
  type ScheduleCell,
  type TimeSlot,
} from '../types';
import {
  useClassAssignments,
  useClassSchedule,
  useSaveScheduleEntry,
  useSaveTimeSlot,
  useTimeSlots,
} from '../hooks/useSchedule';
import { useClassRooms } from '../hooks/useClasses';
import { useSchoolStore } from '../store/useSchoolStore';
import { ScheduleGridView, formatHour } from './ScheduleGridView';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message || fallback;
  return Array.isArray(msg) ? msg[0] : msg;
};

type Pane = 'grille' | 'horaires';

/**
 * Composition des emplois du temps.
 *
 * Deux volets, dans l'ordre où on s'en sert : la grille horaire de
 * l'établissement se définit une fois, puis on remplit les emplois du temps
 * classe par classe.
 */
export const ScheduleManager: React.FC = () => {
  const [pane, setPane] = useState<Pane>('grille');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <PaneButton
          active={pane === 'grille'}
          onClick={() => setPane('grille')}
          icon={<Grid3x3 className="w-4 h-4" />}
          label="Emplois du temps"
        />
        <PaneButton
          active={pane === 'horaires'}
          onClick={() => setPane('horaires')}
          icon={<Clock className="w-4 h-4" />}
          label="Grille horaire"
        />
      </div>

      {pane === 'grille' ? <ClassSchedulePane /> : <TimeSlotsPane />}
    </div>
  );
};

const PaneButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      active
        ? 'bg-slate-900 text-white'
        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
    }`}
  >
    {icon}
    {label}
  </button>
);

/* ─── Volet 1 : l'emploi du temps d'une classe ──────────────────────────── */

const ClassSchedulePane: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data: classRooms } = useClassRooms();
  const [classRoomId, setClassRoomId] = useState<string>('');
  /** Case en attente d'une affectation, ouverte au clic sur un « + ». */
  const [placing, setPlacing] = useState<{
    day: DayOfWeek;
    timeSlotId: string;
  } | null>(null);

  const { data: grid, isLoading } = useClassSchedule(
    classRoomId || undefined,
    undefined,
    currentSchool?.id,
  );
  const { data: assignments } = useClassAssignments(
    classRoomId || undefined,
    undefined,
    currentSchool?.id,
  );
  const save = useSaveScheduleEntry(currentSchool?.id);

  const place = (assignment: AssignmentUsage) => {
    if (!placing) return;
    save.mutate(
      {
        teachingAssignmentId: assignment.id,
        dayOfWeek: placing.day,
        timeSlotId: placing.timeSlotId,
      },
      {
        onSuccess: () => {
          setPlacing(null);
          toast.success(`${assignment.subject.name} placé.`);
        },
        // Le conflit est explicite côté serveur (« la 6ème A a déjà maths sur
        // ce créneau ») : on l'affiche tel quel plutôt que de le reformuler.
        onError: (err) =>
          toast.error(errorMessage(err, 'Ce créneau ne peut pas être occupé.')),
      },
    );
  };

  const remove = (entry: ScheduleCell) =>
    save.mutate(
      { id: entry.id, remove: true },
      {
        onSuccess: () => toast.success('Séance retirée.'),
        onError: (err) => toast.error(errorMessage(err, 'Retrait impossible.')),
      },
    );

  const selectedClass = classRooms?.find((c) => c.id === classRoomId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <select
          value={classRoomId}
          onChange={(e) => {
            setClassRoomId(e.target.value);
            setPlacing(null);
          }}
          className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
        >
          <option value="">Choisir une classe...</option>
          {classRooms?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {grid && (
          <>
            <span className="text-xs text-slate-500">
              Année {grid.academicYear.label}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-400"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </button>
          </>
        )}
      </div>

      {!classRoomId ? (
        <p className="text-sm text-slate-400 bg-white rounded-3xl border border-slate-200 p-10 text-center">
          Choisissez une classe pour composer son emploi du temps.
        </p>
      ) : isLoading || !grid ? (
        <Loading />
      ) : (
        <>
          <div
            id="schedule-printable"
            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Emploi du temps — {selectedClass?.name}
              <span className="font-normal text-slate-400">
                {' '}
                · {grid.academicYear.label}
              </span>
            </h3>
            <ScheduleGridView
              grid={grid}
              onPlace={(day, timeSlotId) => setPlacing({ day, timeSlotId })}
              onRemove={remove}
            />
          </div>

          {placing && (
            <AssignmentPicker
              assignments={assignments ?? []}
              slot={grid.slots.find((s) => s.id === placing.timeSlotId)}
              day={placing.day}
              pending={save.isPending}
              onPick={place}
              onClose={() => setPlacing(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

/**
 * Choix de ce qu'on pose dans une case.
 *
 * La liste ne propose que les affectations de la classe : on ne peut pas
 * programmer un enseignant sur une matière qui ne lui a pas été confiée, et le
 * compteur de séances déjà posées donne le volume horaire d'un coup d'œil.
 */
const AssignmentPicker: React.FC<{
  assignments: AssignmentUsage[];
  slot?: TimeSlot;
  day: DayOfWeek;
  pending: boolean;
  onPick: (assignment: AssignmentUsage) => void;
  onClose: () => void;
}> = ({ assignments, slot, day, pending, onPick, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between p-5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {DAY_LABELS[day]}
            {slot && (
              <span className="font-normal text-slate-500">
                {' '}
                · {formatHour(slot.startTime)} – {formatHour(slot.endTime)}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quel cours placer sur ce créneau ?
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Aucun enseignant n'est affecté à cette classe. Attribuez d'abord les
            matières depuis l'onglet Enseignants.
          </p>
        ) : (
          <ul className="space-y-1">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onPick(assignment)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  <span className="block text-sm font-semibold text-slate-800">
                    {assignment.subject.name}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {assignment.teacher.email.split('@')[0]} ·{' '}
                    {assignment.scheduledCount} séance(s) par semaine
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

/* ─── Volet 2 : la grille horaire de l'établissement ────────────────────── */

const EMPTY_SLOT = {
  label: '',
  startTime: '',
  endTime: '',
  isBreak: false,
};

const TimeSlotsPane: React.FC = () => {
  const { currentSchool } = useSchoolStore();
  const { data: slots, isLoading } = useTimeSlots(currentSchool?.id);
  const save = useSaveTimeSlot(currentSchool?.id);
  const [form, setForm] = useState(EMPTY_SLOT);

  const nextSequence = (slots?.length ?? 0) + 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      { ...form, sequence: nextSequence },
      {
        onSuccess: () => {
          setForm(EMPTY_SLOT);
          toast.success('Créneau ajouté.');
        },
        onError: (err) =>
          toast.error(errorMessage(err, "Le créneau n'a pas pu être créé.")),
      },
    );
  };

  const remove = (slot: TimeSlot) =>
    save.mutate(
      { id: slot.id, remove: true },
      {
        onSuccess: () => toast.success('Créneau supprimé.'),
        // Un créneau occupé est refusé : le message serveur dit combien de
        // séances il faut retirer d'abord.
        onError: (err) =>
          toast.error(errorMessage(err, 'Suppression impossible.')),
      },
    );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Les horaires de la journée
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Définis une fois pour tout l'établissement, récréations comprises. Les
          emplois du temps de toutes les classes s'appuient dessus.
        </p>

        <form onSubmit={submit} className="grid sm:grid-cols-5 gap-3">
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Libellé (1ère heure)"
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-slate-900 focus:outline-none"
          />
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 px-2">
            <input
              type="checkbox"
              checked={form.isBreak}
              onChange={(e) => setForm({ ...form, isBreak: e.target.checked })}
              className="rounded"
            />
            Récréation / pause
          </label>
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {!slots || slots.length === 0 ? (
          <p className="text-sm text-slate-400 p-10 text-center">
            Aucun créneau défini. Commencez par la première heure de cours.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <span className="w-6 text-xs font-mono text-slate-300">
                  {slot.sequence}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {slot.label}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {formatHour(slot.startTime)} – {formatHour(slot.endTime)}
                </span>
                {slot.isBreak && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    <Coffee className="w-3 h-3" />
                    pause
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(slot)}
                  disabled={save.isPending}
                  className="ml-auto p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Supprimer ${slot.label}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Loading: React.FC = () => (
  <p className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    Chargement...
  </p>
);
