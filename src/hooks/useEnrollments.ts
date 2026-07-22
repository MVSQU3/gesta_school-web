import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Enrollment } from '../types';

export interface CreateEnrollmentInput {
  schoolId: string;
  classRoomId: string;
  academicYearId: string;
  studentData: {
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

export function useSearchEnrollmentByRef() {
  return useMutation({
    mutationFn: async (reference: string) => {
      const { data } = await apiClient.get<Enrollment>(
        `/enrollments/ref/${reference.trim().toUpperCase()}`,
      );
      return data;
    },
  });
}
