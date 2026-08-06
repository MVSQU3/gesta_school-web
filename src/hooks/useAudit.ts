import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AuditLog, PaginatedResult } from '../types';

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  /** Uniquement requis pour le SUPER_ADMIN. */
  schoolId?: string;
}

/**
 * Journal d'audit de l'établissement, du plus récent au plus ancien.
 *
 * Route: GET /api/v1/audit
 */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const { data } = await apiClient.get<PaginatedResult<AuditLog>>(
        `/audit?${params.toString()}`,
      );
      return data;
    },
    placeholderData: (previous) => previous,
  });
}
