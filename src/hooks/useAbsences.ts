import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  AbsenceAtRiskRow,
  AbsenceOverviewRow,
  AbsenceStatus,
  RollCall,
  TeachingSession,
} from '../types';

/**
 * Séances que l'enseignant peut appeler à une date donnée.
 *
 * L'appel se fait par cours et non par demi-journée : il faut donc lui
 * proposer ses créneaux du jour, sinon il devrait deviner lequel viser.
 */
export function useMySessions(date?: string) {
  return useQuery({
    queryKey: ['my-sessions', date],
    enabled: !!date,
    queryFn: async () => {
      const { data } = await apiClient.get<TeachingSession[]>(
        `/absences/my-sessions?date=${date}`,
      );
      return data;
    },
  });
}

/** Feuille d'appel d'une séance à une date donnée. */
export function useRollCall(scheduleEntryId?: string, date?: string) {
  return useQuery({
    queryKey: ['roll-call', scheduleEntryId, date],
    enabled: !!scheduleEntryId && !!date,
    queryFn: async () => {
      const params = new URLSearchParams({
        scheduleEntryId: scheduleEntryId as string,
        date: date as string,
      });
      const { data } = await apiClient.get<RollCall>(
        `/absences/roster?${params.toString()}`,
      );
      return data;
    },
  });
}

export interface AbsenceEntryInput {
  enrollmentId: string;
  status: AbsenceStatus;
  isJustified?: boolean;
  reason?: string;
}

/**
 * Enregistre l'appel d'une séance. L'API travaille par différence : un élève
 * absent de la liste envoyée est repassé présent.
 */
export function useRecordAbsences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      scheduleEntryId: string;
      date: string;
      entries: AbsenceEntryInput[];
    }) => {
      const { data } = await apiClient.post<{
        recorded: number;
        cleared: number;
      }>('/absences', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roll-call'] });
      queryClient.invalidateQueries({ queryKey: ['absence-overview'] });
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
    },
  });
}

/* ─── Espace direction ───────────────────────────────────────────── */

export interface OverviewFilters {
  academicYearId?: string;
  gradingPeriodId?: string;
  classRoomId?: string;
  subjectId?: string;
}

/** Suivi de l'assiduité par matière et par classe. */
export function useAbsenceOverview(filters: OverviewFilters) {
  return useQuery({
    queryKey: ['absence-overview', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.append(key, value);
      }
      const { data } = await apiClient.get<AbsenceOverviewRow[]>(
        `/absences/overview?${params.toString()}`,
      );
      return data;
    },
  });
}

/** Élèves dépassant un seuil d'absences non justifiées sur la période. */
export function useAbsencesAtRisk(
  threshold: number,
  filters: Pick<OverviewFilters, 'academicYearId' | 'gradingPeriodId'>,
) {
  return useQuery({
    queryKey: ['absence-overview', 'at-risk', threshold, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ threshold: String(threshold) });
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.append(key, value);
      }
      const { data } = await apiClient.get<AbsenceAtRiskRow[]>(
        `/absences/at-risk?${params.toString()}`,
      );
      return data;
    },
  });
}

/** Correction d'une ligne : statut, justification, motif. */
export function useUpdateAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: AbsenceStatus;
      isJustified?: boolean;
      reason?: string;
    }) => {
      const { data } = await apiClient.patch(`/absences/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roll-call'] });
      queryClient.invalidateQueries({ queryKey: ['absence-overview'] });
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/absences/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roll-call'] });
      queryClient.invalidateQueries({ queryKey: ['absence-overview'] });
    },
  });
}
