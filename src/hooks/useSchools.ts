import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { GradingPeriod, School } from '../types';
import { PeriodSystem } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export interface CreateSchoolInput {
  name: string;
  slug: string;
  /** Découpage de l'année. Absent = trimestres, valeur par défaut du serveur. */
  periodSystem?: PeriodSystem;
  address?: string;
  phone?: string;
}

export interface UpdateSchoolInput {
  id: string;
  data: Partial<CreateSchoolInput>;
}

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data } = await apiClient.get<School[]>('/schools');
      return data;
    },
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSchoolInput) => {
      const { data } = await apiClient.post<School>('/admin/create-school', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: updateData }: UpdateSchoolInput) => {
      const { data } = await apiClient.patch<School>(`/schools/${id}`, updateData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/schools/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

/**
 * L'établissement de l'utilisateur connecté.
 *
 * `GET /schools` ne renvoie que sa propre école pour un non-administrateur :
 * c'est le chemin le plus court pour lire un réglage d'établissement sans
 * ajouter de route.
 */
export function useMySchool() {
  const user = useAuthStore((s) => s.user);
  const query = useSchools();
  return {
    ...query,
    data: query.data?.find((s) => s.id === user?.schoolId) ?? query.data?.[0],
  };
}

/** Bascule trimestre ↔ semestre pour son propre établissement. */
export function useUpdatePeriodSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodSystem: PeriodSystem) => {
      const { data } = await apiClient.patch<School>(
        '/schools/me/period-system',
        { periodSystem },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

/**
 * Recrée les périodes d'une année selon le découpage courant.
 * Refusé par le serveur dès qu'une note ou une absence y est rattachée.
 */
export function useRegeneratePeriods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (academicYearId: string) => {
      const { data } = await apiClient.post<GradingPeriod[]>(
        `/grading-periods/regenerate?academicYearId=${academicYearId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-periods'] });
    },
  });
}
