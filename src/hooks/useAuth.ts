import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../types';

interface LoginInput {
  email: string;
  password: string;
  slug?: string;
}

/**
 * Le corps contient encore `access_token`, destiné aux clients non-navigateur.
 * L'interface l'ignore : sa session tient au cookie httpOnly posé par la même
 * réponse, hors de portée du JavaScript.
 */
interface LoginResponse {
  user: User;
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => {
      setUser(data.user);
    },
  });
}
