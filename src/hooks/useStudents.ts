import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Student, StudentFile } from '../types';

/**
 * Dossier d'un élève cadré sur une année scolaire.
 *
 * Sans `academicYearId`, le serveur retourne l'année active — c'est la question
 * posée dans la quasi-totalité des cas. Les années antérieures sont listées
 * dans `availableYears` et ne sont chargées que si le directeur les demande,
 * chacune sous sa propre clé de cache : revenir à l'année en cours est alors
 * instantané.
 *
 * Route: GET /api/v1/students/:id/history?academicYearId=
 */
export function useStudentFile(
  studentId?: string,
  academicYearId?: string,
  schoolId?: string,
) {
  return useQuery({
    queryKey: ['students', 'file', studentId, academicYearId ?? 'active', schoolId],
    enabled: !!studentId,
    // Le dossier mêle notes, absences et caisse : on garde la réponse courte
    // pour qu'un versement encaissé juste après se voie au retour sur la fiche.
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (academicYearId) params.append('academicYearId', academicYearId);
      if (schoolId) params.append('schoolId', schoolId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await apiClient.get<StudentFile>(
        `/students/${studentId}/history${query}`,
      );
      return data;
    },
  });
}

export interface UpdateStudentInput {
  studentId: string;
  /** Date au format local JJ-MM-AAAA, comme à la saisie. */
  birthDay?: string;
  firstName?: string;
  lastName?: string;
  parentPhone?: string;
  schoolId?: string;
}

/**
 * Correction d'une fiche élève.
 *
 * La fiche est partagée par tous les dossiers de l'élève : la correction se
 * répercute sur ses inscriptions passées et à venir. On invalide donc aussi
 * les listes de dossiers, où le nom est affiché.
 *
 * Route: PATCH /api/v1/students/:id
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, schoolId, ...body }: UpdateStudentInput) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.patch<Student>(
        `/students/${studentId}${query}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

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
