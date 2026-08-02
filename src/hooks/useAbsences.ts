import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { HalfDay, RollCall } from '../types';

/** Feuille d'appel d'une classe à une date donnée. */
export function useRollCall(
  classRoomId?: string,
  academicYearId?: string,
  date?: string,
) {
  const ready = !!classRoomId && !!academicYearId && !!date;
  return useQuery({
    queryKey: ['roll-call', classRoomId, academicYearId, date],
    enabled: ready,
    queryFn: async () => {
      const params = new URLSearchParams({
        classRoomId: classRoomId as string,
        academicYearId: academicYearId as string,
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
  halfDay: HalfDay;
  isJustified?: boolean;
  reason?: string;
}

/**
 * Enregistre l'appel. L'API travaille par différence : les élèves absents de
 * la liste envoyée sont repassés présents.
 */
export function useRecordAbsences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      classRoomId: string;
      academicYearId: string;
      date: string;
      absences: AbsenceEntryInput[];
    }) => {
      const { data } = await apiClient.post<{ recorded: number; cleared: number }>(
        '/absences',
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roll-call'] });
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
    },
  });
}
