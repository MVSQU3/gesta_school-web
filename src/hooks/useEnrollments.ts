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
export function useEnrollmentsList(
  filters: EnrollmentFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['enrollments', 'list', filters],
    enabled: options?.enabled ?? true,
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

/**
 * Dossiers expirés d'une année.
 *
 * Sans `academicYearId`, le serveur borne à l'année en cours — sans quoi
 * l'écran de rattrapage cumulerait les dossiers morts de toutes les rentrées
 * passées. L'année reste transmissible pour consulter les précédentes.
 */
export function useExpiredEnrollments(
  schoolId: string | undefined,
  academicYearId?: string,
) {
  return useQuery({
    queryKey: ['enrollments', 'expired', schoolId, academicYearId ?? ''],
    enabled: !!schoolId,
    queryFn: async () => {
      const params = new URLSearchParams({ schoolId: schoolId as string });
      if (academicYearId) params.append('academicYearId', academicYearId);
      const { data } = await apiClient.get<Enrollment[]>(
        `/enrollments/expired?${params.toString()}`,
      );
      return data;
    },
  });
}

/**
 * Correction d'un dossier : changement de classe.
 *
 * Le montant dû suit le tarif de la classe d'accueil et le statut est
 * recalculé côté serveur — la réponse porte la situation à jour, il ne faut
 * donc rien recalculer ici.
 *
 * Route: PATCH /api/v1/enrollments/:id
 */
export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      classRoomId,
      schoolId,
    }: {
      id: string;
      classRoomId: string;
      schoolId?: string;
    }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.patch<Enrollment>(
        `/enrollments/${id}${query}`,
        { classRoomId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

/**
 * Suppression d'un dossier ouvert par erreur. Le serveur la refuse dès qu'un
 * versement existe, même annulé.
 *
 * Route: DELETE /api/v1/enrollments/:id
 */
export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId?: string }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.delete<{ message: string }>(
        `/enrollments/${id}${query}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export interface BulkEnrollResult {
  created: Array<{ studentId: string; reference: string; name: string }>;
  skipped: Array<{ studentId: string; name: string; reason: string }>;
}

/**
 * Réinscription en masse : un dossier par élève sélectionné.
 *
 * Le serveur n'échoue pas sur un élève déjà inscrit, il l'écarte et le dit :
 * la réponse porte donc les deux listes, et l'appelant doit présenter les
 * écartés plutôt que d'annoncer un succès global.
 *
 * Route: POST /api/v1/enrollments/bulk
 */
export function useBulkEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classRoomId,
      academicYearId,
      studentIds,
      schoolId,
    }: {
      classRoomId: string;
      academicYearId: string;
      studentIds: string[];
      schoolId?: string;
    }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.post<BulkEnrollResult>(
        `/enrollments/bulk${query}`,
        { classRoomId, academicYearId, studentIds },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
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
