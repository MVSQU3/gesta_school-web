import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  ClassRoomSubject,
  Evaluation,
  EvaluationType,
  GradeSheet,
  GradingPeriod,
  Subject,
  TeachingAssignment,
} from '../types';

/* ─── Matières de l'établissement ────────────────────────────────── */

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await apiClient.get<Subject[]>('/subjects');
      return data;
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; shortName?: string }) => {
      const { data } = await apiClient.post<Subject>('/subjects', input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; shortName?: string }) => {
      const { data } = await apiClient.patch<Subject>(`/subjects/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['class-program'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/subjects/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['class-program'] });
    },
  });
}

/* ─── Programme d'une classe : matières et coefficients ──────────── */

export function useClassProgram(classRoomId?: string) {
  return useQuery({
    queryKey: ['class-program', classRoomId],
    enabled: !!classRoomId,
    queryFn: async () => {
      const { data } = await apiClient.get<ClassRoomSubject[]>(
        `/subjects/classroom/${classRoomId}`,
      );
      return data;
    },
  });
}

export function useAssignSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classRoomId,
      subjectId,
      coefficient,
    }: {
      classRoomId: string;
      subjectId: string;
      coefficient: number;
    }) => {
      const { data } = await apiClient.post<ClassRoomSubject>(
        `/subjects/classroom/${classRoomId}`,
        { subjectId, coefficient },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-program'] }),
  });
}

export function useUpdateCoefficient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coefficient }: { id: string; coefficient: number }) => {
      const { data } = await apiClient.patch<ClassRoomSubject>(
        `/subjects/program/${id}`,
        { coefficient },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-program'] }),
  });
}

export function useRemoveFromProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/subjects/program/${id}`,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-program'] }),
  });
}

/* ─── Affectations des enseignants (côté direction) ──────────────── */

export function useAssignments(academicYearId?: string) {
  return useQuery({
    queryKey: ['teaching-assignments', 'all', academicYearId],
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data } = await apiClient.get<TeachingAssignment[]>(
        `/teaching-assignments?academicYearId=${academicYearId}`,
      );
      return data;
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      teacherId: string;
      classRoomId: string;
      subjectId: string;
      academicYearId: string;
    }) => {
      const { data } = await apiClient.post<TeachingAssignment>(
        '/teaching-assignments',
        input,
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['teaching-assignments'] }),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/teaching-assignments/${id}`,
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['teaching-assignments'] }),
  });
}

/** Renommage, dates, ouverture ou clôture d'une période de notation. */
export function useUpdateGradingPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      label?: string;
      startDate?: string;
      endDate?: string;
      isClosed?: boolean;
    }) => {
      const { data } = await apiClient.patch<GradingPeriod>(
        `/grading-periods/${id}`,
        body,
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['grading-periods'] }),
  });
}

/** Périodes de notation d'une année (trimestres ou semestres selon l'école). */
export function useGradingPeriods(academicYearId?: string) {
  return useQuery({
    queryKey: ['grading-periods', academicYearId],
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data } = await apiClient.get<GradingPeriod[]>(
        `/grading-periods?academicYearId=${academicYearId}`,
      );
      return data;
    },
  });
}

/**
 * Affectations de l'enseignant connecté. L'API force le filtre sur son
 * identifiant : il ne peut pas consulter celles des autres.
 */
export function useMyAssignments(academicYearId?: string) {
  return useQuery({
    queryKey: ['teaching-assignments', 'mine', academicYearId],
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data } = await apiClient.get<TeachingAssignment[]>(
        `/teaching-assignments?academicYearId=${academicYearId}`,
      );
      return data;
    },
  });
}

export interface EvaluationFilters {
  classRoomId?: string;
  subjectId?: string;
  gradingPeriodId?: string;
}

export function useEvaluations(filters: EvaluationFilters) {
  const ready = !!filters.classRoomId && !!filters.gradingPeriodId;
  return useQuery({
    queryKey: ['evaluations', filters],
    enabled: ready,
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const { data } = await apiClient.get<Evaluation[]>(
        `/evaluations?${params.toString()}`,
      );
      return data;
    },
  });
}

export interface CreateEvaluationInput {
  classRoomId: string;
  subjectId: string;
  gradingPeriodId: string;
  type: EvaluationType;
  title: string;
  date: string;
  maxScore?: number;
  weight?: number;
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEvaluationInput) => {
      const { data } = await apiClient.post<Evaluation>('/evaluations', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/evaluations/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

/** Feuille de notes : les élèves de la classe et leur note actuelle. */
export function useGradeSheet(evaluationId?: string) {
  return useQuery({
    queryKey: ['grade-sheet', evaluationId],
    enabled: !!evaluationId,
    queryFn: async () => {
      const { data } = await apiClient.get<GradeSheet>(
        `/evaluations/${evaluationId}/grades`,
      );
      return data;
    },
  });
}

export interface GradeEntryInput {
  enrollmentId: string;
  score?: number | null;
  isAbsent?: boolean;
  comment?: string;
}

/** Enregistrement de la feuille de notes complète, en une fois. */
export function useSaveGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      evaluationId,
      grades,
    }: {
      evaluationId: string;
      grades: GradeEntryInput[];
    }) => {
      const { data } = await apiClient.post<{ saved: number }>(
        `/evaluations/${evaluationId}/grades`,
        { grades },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['grade-sheet', variables.evaluationId],
      });
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
    },
  });
}
