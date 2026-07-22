import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Enrollment } from '../types';

interface EnrollmentDraftState {
  firstName: string;
  lastName: string;
  birthDay: string;
  parentPhone: string;
  selectedClassId: string;
  selectedYearId: string;
  lastGeneratedEnrollment: Enrollment | null;
  setDraft: (fields: Partial<EnrollmentDraftState>) => void;
  setLastGeneratedEnrollment: (enrollment: Enrollment | null) => void;
  resetDraft: () => void;
}

const initialDraft = {
  firstName: '',
  lastName: '',
  birthDay: '',
  parentPhone: '+2250102030405',
  selectedClassId: '',
  selectedYearId: '',
  lastGeneratedEnrollment: null,
};

export const useEnrollmentDraftStore = create<EnrollmentDraftState>()(
  persist(
    (set) => ({
      ...initialDraft,
      setDraft: (fields) => set((state) => ({ ...state, ...fields })),
      setLastGeneratedEnrollment: (enrollment) =>
        set({ lastGeneratedEnrollment: enrollment }),
      resetDraft: () =>
        set((state) => ({
          ...initialDraft,
          lastGeneratedEnrollment: state.lastGeneratedEnrollment, // Conserve le dernier ticket affiché
        })),
    }),
    {
      name: 'gesta-school-enrollment-draft',
      storage: createJSONStorage(() => sessionStorage), // Conserve le brouillon et le dernier ticket pendant toute la session de navigation
    },
  ),
);
