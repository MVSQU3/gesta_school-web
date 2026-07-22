import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import type { User } from '../types';

interface LoginInput {
  email: string;
  password: string;
  slug?: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
    },
  });
}
