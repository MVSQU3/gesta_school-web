import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, Role } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes(Role.SUPER_ADMIN)) return true;
        return user.roles.includes(role);
      },
      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes(Role.SUPER_ADMIN)) return true;
        return roles.some((role) => user.roles.includes(role));
      },
    }),
    {
      name: 'gesta-school-auth',
    }
  )
);
