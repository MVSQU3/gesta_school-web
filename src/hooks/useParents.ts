import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type {
  Gender,
  HistoryAbsence,
  Parent,
  ParentChild,
  ParentChildFinance,
  PaginatedResult,
  ParentSubjectGrades,
  ParentYear,
  StudentBulletin,
  GradingPeriod,
} from '../types';

/* ─── Espace parent ──────────────────────────────────────────────── */

/**
 * Les enfants du parent connecté.
 *
 * Aucun identifiant n'est passé : le serveur ne connaît que le compte du
 * jeton, et c'est bien l'objectif — un `parentId` en paramètre serait une
 * invitation à essayer celui du voisin.
 */
export function useMyChildren(academicYearId?: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['parent', 'children', user?.id, academicYearId ?? ''],
    queryFn: async () => {
      const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
      const { data } = await apiClient.get<ParentChild[]>(
        `/parents/me/children${query}`,
      );
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Années que le parent peut consulter — celles où un de ses enfants a été
 * inscrit. Alimente le sélecteur d'année.
 */
export function useMyYears() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['parent', 'years', user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<ParentYear[]>('/parents/me/years');
      return data;
    },
    enabled: !!user,
  });
}

/** Solde et versements d'un dossier, côté parent. */
export function useMyChildFinance(enrollmentId?: string) {
  return useQuery({
    queryKey: ['parent', 'finance', enrollmentId],
    queryFn: async () => {
      const { data } = await apiClient.get<ParentChildFinance>(
        `/parents/me/enrollments/${enrollmentId}/finance`,
      );
      return data;
    },
    enabled: !!enrollmentId,
  });
}

/**
 * Périodes de notation de l'année de l'enfant.
 *
 * Passe par la route de l'espace parent, et non par `useGradingPeriods` qui
 * interroge la route d'établissement : celle-ci est refusée à un compte
 * parent, et l'onglet « Notes » restait vide.
 */
export function useMyChildPeriods(enrollmentId?: string) {
  return useQuery({
    queryKey: ['parent', 'periods', enrollmentId],
    queryFn: async () => {
      const { data } = await apiClient.get<GradingPeriod[]>(
        `/parents/me/enrollments/${enrollmentId}/periods`,
      );
      return data;
    },
    enabled: !!enrollmentId,
  });
}

/** Bulletin d'un enfant sur une période. */
export function useMyChildBulletin(
  enrollmentId?: string,
  gradingPeriodId?: string,
) {
  return useQuery({
    queryKey: ['parent', 'bulletin', enrollmentId, gradingPeriodId],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        period: GradingPeriod;
        bulletin: StudentBulletin;
      }>(
        `/parents/me/enrollments/${enrollmentId}/bulletin?gradingPeriodId=${gradingPeriodId}`,
      );
      return data;
    },
    enabled: !!enrollmentId && !!gradingPeriodId,
  });
}

/**
 * Notes individuelles d'un enfant sur une période, groupées par matière.
 *
 * Complète le bulletin, qui n'en donne que les moyennes : une famille veut
 * voir les devoirs qui ont produit la moyenne affichée.
 */
export function useMyChildGrades(
  enrollmentId?: string,
  gradingPeriodId?: string,
) {
  return useQuery({
    queryKey: ['parent', 'grades', enrollmentId, gradingPeriodId],
    queryFn: async () => {
      const { data } = await apiClient.get<ParentSubjectGrades[]>(
        `/parents/me/enrollments/${enrollmentId}/grades?gradingPeriodId=${gradingPeriodId}`,
      );
      return data;
    },
    enabled: !!enrollmentId && !!gradingPeriodId,
  });
}

/** Absences et retards d'un enfant. */
export function useMyChildAbsences(enrollmentId?: string) {
  return useQuery({
    queryKey: ['parent', 'absences', enrollmentId],
    queryFn: async () => {
      const { data } = await apiClient.get<HistoryAbsence[]>(
        `/parents/me/enrollments/${enrollmentId}/absences`,
      );
      return data;
    },
    enabled: !!enrollmentId,
  });
}

/* ─── Administration des comptes — secrétariat ───────────────────── */

export interface CreateParentInput {
  email: string;
  firstName: string;
  lastName: string;
  /** Male ou Female — obligatoire côté serveur. */
  gender: Gender;
  phone?: string;
  studentIds?: string[];
}

/** Liste des comptes parents de l'établissement. */
/**
 * Comptes parents, paginés côté serveur.
 *
 * Une école compte autant de comptes que de familles : la liste entière
 * repartait à chaque frappe dans la recherche.
 */
export function useParents(search?: string, page = 1) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['parents', user?.schoolId, search ?? '', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search?.trim()) params.append('search', search.trim());
      const { data } = await apiClient.get<PaginatedResult<Parent>>(
        `/parents?${params.toString()}`,
      );
      return data;
    },
  });
}

/**
 * Création d'un compte parent.
 *
 * La réponse porte le mot de passe provisoire, renvoyé une seule fois par le
 * serveur : l'appelant doit l'afficher immédiatement, il ne sera plus jamais
 * récupérable.
 */
export function useCreateParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateParentInput) => {
      const { data } = await apiClient.post<{
        parent: Parent;
        temporaryPassword: string;
      }>('/parents', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}

export function useLinkChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      studentId,
    }: {
      parentId: string;
      studentId: string;
    }) => {
      const { data } = await apiClient.post<Parent>(
        `/parents/${parentId}/children`,
        { studentId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}

export function useUnlinkChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      studentId,
    }: {
      parentId: string;
      studentId: string;
    }) => {
      const { data } = await apiClient.delete<Parent>(
        `/parents/${parentId}/children/${studentId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}

/** Réinitialisation du mot de passe d'un parent (direction uniquement). */
export function useResetParentPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (parentId: string) => {
      const { data } = await apiClient.patch<{ temporaryPassword: string }>(
        `/parents/${parentId}/password`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}

export function useSetParentActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      isActive,
    }: {
      parentId: string;
      isActive: boolean;
    }) => {
      const { data } = await apiClient.patch<Parent>(
        `/parents/${parentId}/status`,
        { isActive },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}
