import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Enrollment, EnrollmentStatus, PaginatedResult } from '../types';

export interface EnrollmentFilters {
  status?: EnrollmentStatus | '';
  search?: string;
  academicYearId?: string;
  classRoomId?: string;
  page?: number;
  limit?: number;
  /** Uniquement requis pour le SUPER_ADMIN */
  schoolId?: string;
}

/**
 * Liste paginée et filtrable des dossiers de l'école.
 * Route: GET /api/v1/enrollments
 */
export function useEnrollmentsList(filters: EnrollmentFilters) {
  return useQuery({
    queryKey: ['enrollments', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const { data } = await apiClient.get<PaginatedResult<Enrollment>>(
        `/enrollments?${params.toString()}`,
      );
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export interface CreateEnrollmentInput {
  schoolId: string;
  classRoomId: string;
  academicYearId: string;
  /** Réinscription : fiche élève existante. Exclusif avec `studentData`. */
  studentId?: string;
  /** Première inscription : création de la fiche élève. */
  studentData?: {
    firstName: string;
    lastName: string;
    birthDay: string;
    parentPhone: string;
  };
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEnrollmentInput) => {
      const { data } = await apiClient.post<Enrollment>('/enrollments', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useExpiredEnrollments(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'expired', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data } = await apiClient.get<Enrollment[]>(
        `/enrollments/expired?schoolId=${schoolId}`,
      );
      return data;
    },
  });
}

export function useRenewEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<Enrollment>(`/enrollments/${id}/renew`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'expired'] });
    },
  });
}

/**
 * Recherche un dossier par sa référence.
 * schoolId est optionnel : uniquement requis pour le SUPER_ADMIN.
 * Pour les autres rôles, le back le lit depuis le JWT.
 */
export function useSearchEnrollmentByRef() {
  return useMutation({
    mutationFn: async ({ reference, schoolId }: { reference: string; schoolId?: string }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.get<Enrollment>(
        `/enrollments/ref/${reference.trim().toUpperCase()}${query}`,
      );
      return data;
    },
  });
}

/**
 * Valide une inscription (PENDING_PAYMENT → ENROLLED).
 * schoolId optionnel : uniquement requis pour le SUPER_ADMIN.
 */
export function useValidateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId?: string }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.patch<Enrollment>(`/enrollments/${id}/validate${query}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
