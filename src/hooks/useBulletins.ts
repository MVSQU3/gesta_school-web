import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { ClassBulletins } from '../types';

/**
 * Bulletins de toute une classe pour une période, rangs inclus.
 *
 * Un seul appel suffit pour l'écran : le bulletin individuel est extrait de
 * cette réponse, et les moyennes de classe supposent de toute façon d'avoir
 * calculé l'ensemble des élèves.
 */
export function useClassBulletins(
  classRoomId?: string,
  gradingPeriodId?: string,
) {
  const ready = !!classRoomId && !!gradingPeriodId;
  return useQuery({
    queryKey: ['bulletins', classRoomId, gradingPeriodId],
    enabled: ready,
    queryFn: async () => {
      const { data } = await apiClient.get<ClassBulletins>(
        `/bulletins/classroom/${classRoomId}?gradingPeriodId=${gradingPeriodId}`,
      );
      return data;
    },
  });
}
