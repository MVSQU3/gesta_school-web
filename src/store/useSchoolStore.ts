import { create } from 'zustand';
import type { School } from '../types';

interface SchoolStoreState {
  currentSchool: School | null;
  setCurrentSchool: (school: School | null) => void;
}

export const useSchoolStore = create<SchoolStoreState>((set) => ({
  currentSchool: null,
  setCurrentSchool: (school) => set({ currentSchool: school }),
}));
