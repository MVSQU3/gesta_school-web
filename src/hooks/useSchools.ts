import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { School } from '../types';

export interface CreateSchoolInput {
  name: string;
  slug: string;
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
