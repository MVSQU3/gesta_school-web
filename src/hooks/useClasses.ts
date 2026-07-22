import { useQuery } from '@tanstack/react-query';
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
