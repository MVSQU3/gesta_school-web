import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { DashboardStats } from '../types';

/**
 * Statistiques consolidées de l'établissement.
 * Sans academicYearId, l'API utilise l'année scolaire active.
 * Route: GET /api/v1/dashboard
 */
export function useDashboard(academicYearId?: string) {
  return useQuery({
    queryKey: ['dashboard', academicYearId],
    queryFn: async () => {
      const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
      const { data } = await apiClient.get<DashboardStats>(`/dashboard${query}`);
      return data;
    },
  });
}
