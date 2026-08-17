import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AssignmentUsage, ScheduleGrid, TimeSlot } from '../types';

/** Assemble les paramètres optionnels communs à toutes les routes. */
const query = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.append(key, value);
  });
  return search.toString() ? `?${search.toString()}` : '';
};

/* ─── Grille horaire ─────────────────────────────────────────────────────── */

/** Route: GET /api/v1/schedule/slots */
export function useTimeSlots(schoolId?: string) {
  return useQuery({
    queryKey: ['schedule', 'slots', schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<TimeSlot[]>(
        `/schedule/slots${query({ schoolId })}`,
      );
      return data;
    },
  });
}

/**
 * Création, modification et suppression d'un créneau.
 *
 * Les trois opérations partagent un hook : elles invalident toutes le même
 * cache, et un changement de grille horaire redessine l'emploi du temps de
 * toutes les classes — d'où l'invalidation de `['schedule']` en entier.
 */
export function useSaveTimeSlot(schoolId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      remove,
      ...body
    }: {
      id?: string;
      remove?: boolean;
      label?: string;
      startTime?: string;
      endTime?: string;
      sequence?: number;
      isBreak?: boolean;
    }) => {
      const suffix = query({ schoolId });
      if (remove && id) {
        const { data } = await apiClient.delete(`/schedule/slots/${id}${suffix}`);
        return data;
      }
      if (id) {
        const { data } = await apiClient.patch<TimeSlot>(
          `/schedule/slots/${id}${suffix}`,
          body,
        );
        return data;
      }
      const { data } = await apiClient.post<TimeSlot>(
        `/schedule/slots${suffix}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

/* ─── Consultation ───────────────────────────────────────────────────────── */

/** Route: GET /api/v1/schedule/class/:classRoomId */
export function useClassSchedule(
  classRoomId?: string,
  academicYearId?: string,
  schoolId?: string,
) {
  return useQuery({
    queryKey: ['schedule', 'class', classRoomId, academicYearId, schoolId],
    enabled: !!classRoomId,
    queryFn: async () => {
      const { data } = await apiClient.get<ScheduleGrid>(
        `/schedule/class/${classRoomId}${query({ academicYearId, schoolId })}`,
      );
      return data;
    },
  });
}

/** Emploi du temps de l'enseignant connecté. Route: GET /api/v1/schedule/mine */
export function useMySchedule(academicYearId?: string, schoolId?: string) {
  return useQuery({
    queryKey: ['schedule', 'mine', academicYearId, schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<ScheduleGrid>(
        `/schedule/mine${query({ academicYearId, schoolId })}`,
      );
      return data;
    },
  });
}

/** Route: GET /api/v1/schedule/teacher/:teacherId */
export function useTeacherSchedule(
  teacherId?: string,
  academicYearId?: string,
  schoolId?: string,
) {
  return useQuery({
    queryKey: ['schedule', 'teacher', teacherId, academicYearId, schoolId],
    enabled: !!teacherId,
    queryFn: async () => {
      const { data } = await apiClient.get<ScheduleGrid>(
        `/schedule/teacher/${teacherId}${query({ academicYearId, schoolId })}`,
      );
      return data;
    },
  });
}

/** Ce qui peut être posé dans la grille d'une classe. */
export function useClassAssignments(
  classRoomId?: string,
  academicYearId?: string,
  schoolId?: string,
) {
  return useQuery({
    queryKey: ['schedule', 'assignments', classRoomId, academicYearId, schoolId],
    enabled: !!classRoomId,
    queryFn: async () => {
      const { data } = await apiClient.get<AssignmentUsage[]>(
        `/schedule/class/${classRoomId}/assignments${query({ academicYearId, schoolId })}`,
      );
      return data;
    },
  });
}

/* ─── Composition ────────────────────────────────────────────────────────── */

export function useSaveScheduleEntry(schoolId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      remove,
      ...body
    }: {
      id?: string;
      remove?: boolean;
      teachingAssignmentId?: string;
      dayOfWeek?: number;
      timeSlotId?: string;
    }) => {
      const suffix = query({ schoolId });
      if (remove && id) {
        const { data } = await apiClient.delete(`/schedule/entries/${id}${suffix}`);
        return data;
      }
      if (id) {
        const { data } = await apiClient.patch(
          `/schedule/entries/${id}${suffix}`,
          body,
        );
        return data;
      }
      const { data } = await apiClient.post(`/schedule/entries${suffix}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}
