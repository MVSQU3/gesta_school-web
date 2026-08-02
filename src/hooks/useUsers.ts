import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { User, Role } from '../types';

/**
 * Input du directeur : schoolId est résolu par le JWT côté back,
 * pas besoin de le passer dans le body.
 */
export interface CreateStaffInput {
  email: string;
  password: string;
  roles: Role[];
}

/**
 * Input de l'admin : doit obligatoirement spécifier l'école cible.
 */
export interface AdminCreateUserInput extends CreateStaffInput {
  schoolId: string;
}

/**
 * Utilisé par le directeur pour créer une secrétaire ou un comptable.
 * Le schoolId et le slug sont résolus automatiquement depuis le JWT du directeur.
 * Route: POST /api/v1/users
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStaffInput) => {
      const { data } = await apiClient.post<User>('/users', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Personnel de l'établissement du directeur connecté.
 * Route: GET /api/v1/users
 */
export function useStaff() {
  return useQuery({
    queryKey: ['users', 'staff'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/users');
      return data;
    },
  });
}

/** Modification de l'email et/ou des rôles d'un employé. */
export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      email?: string;
      roles?: Role[];
    }) => {
      const { data } = await apiClient.patch<User>(`/users/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Personnel d'un établissement donné.
 * Réservé au super-admin : les autres rôles sont ramenés à leur propre école
 * par l'API, quel que soit le schoolId transmis.
 */
export function useSchoolStaff(schoolId?: string) {
  return useQuery({
    queryKey: ['users', 'school', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>(`/users?schoolId=${schoolId}`);
      return data;
    },
  });
}

/**
 * Activation / désactivation d'un compte employé.
 * `schoolId` n'est utile qu'au super-admin, qui n'est rattaché à aucune école.
 */
export function useSetStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      isActive,
      schoolId,
    }: {
      id: string;
      isActive: boolean;
      schoolId?: string;
    }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.patch<User>(
        `/users/${id}/status${query}`,
        { isActive },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/** Suppression définitive d'un compte employé. */
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Utilisé par l'admin pour créer un directeur, une secrétaire ou un comptable
 * pour une école spécifique (schoolId obligatoire).
 * Route: POST /api/v1/admin/create-user
 */
export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminCreateUserInput) => {
      const { data } = await apiClient.post<User>('/admin/create-user', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['directors'] });
    },
  });
}

/**
 * Utilisé par l'admin pour récupérer tous les utilisateurs staff.
 * Route: GET /api/v1/admin/users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/admin/users');
      return data;
    },
  });
}

/**
 * Utilisé par l'admin pour récupérer uniquement les directeurs.
 * Route: GET /api/v1/admin/directors
 */
export function useAdminDirectors() {
  return useQuery({
    queryKey: ['directors'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/admin/directors');
      return data;
    },
  });
}
