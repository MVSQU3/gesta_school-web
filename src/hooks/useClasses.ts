import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AcademicYear, ClassRoom } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export function useClassRooms() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['classrooms', user?.schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<ClassRoom[]>('/classrooms');
      return data;
    },
  });
}

export function useAcademicYears() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['academic-years', user?.schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<AcademicYear[]>('/academic-years');
      return data;
    },
  });
}

export interface CreateAcademicYearInput {
  /** Ex: "2026-2027" */
  label: string;
  isActive?: boolean;
}

/**
 * Utilisé par le directeur pour créer une année scolaire.
 * Le schoolId est résolu depuis le JWT du directeur côté back.
 * Route: POST /api/v1/academic-years
 */
export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAcademicYearInput) => {
      const { data } = await apiClient.post<AcademicYear>('/academic-years', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });
}

export interface CreateClassRoomInput {
  name: string;
  level: string;
  /** Frais de scolarité annuels, en FCFA. */
  tuitionFee?: number;
}

/**
 * Utilisé par le directeur pour créer une salle de classe.
 * Le schoolId est résolu depuis le JWT du directeur côté back.
 * Route: POST /api/v1/classrooms
 */
export function useCreateClassRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClassRoomInput) => {
      const { data } = await apiClient.post<ClassRoom>('/classrooms', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

/** Modification d'une classe (nom, niveau, frais de scolarité). */
export function useUpdateClassRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Partial<CreateClassRoomInput>) => {
      const { data } = await apiClient.patch<ClassRoom>(`/classrooms/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

/** Suppression d'une classe — refusée par l'API si des inscriptions existent. */
export function useDeleteClassRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/classrooms/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

/** Modification du libellé, activation ou clôture d'une année scolaire. */
export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      label?: string;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.patch<AcademicYear>(
        `/academic-years/${id}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });
}

/** Suppression d'une année — refusée par l'API si des inscriptions existent. */
export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/academic-years/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });
}
