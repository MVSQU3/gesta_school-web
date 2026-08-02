import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Student } from '../types';

/**
 * Recherche d'un élève déjà enregistré dans l'établissement, pour éviter de
 * recréer une fiche à chaque réinscription.
 *
 * L'API ne répond qu'à partir de 2 caractères ; la requête n'est donc lancée
 * qu'au-delà de ce seuil.
 *
 * Route: GET /api/v1/students/search?q=
 */
export function useStudentSearch(query: string, schoolId?: string) {
  const term = query.trim();
  return useQuery({
    queryKey: ['students', 'search', term, schoolId],
    enabled: term.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({ q: term });
      if (schoolId) params.append('schoolId', schoolId);
      const { data } = await apiClient.get<Student[]>(
        `/students/search?${params.toString()}`,
      );
      return data;
    },
  });
}
