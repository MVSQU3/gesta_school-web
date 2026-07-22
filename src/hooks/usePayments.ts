import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Payment } from '../types';

export interface ProcessPaymentInput {
  reference: string;
  amount: number;
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProcessPaymentInput) => {
      const { data } = await apiClient.post<Payment>('/payments', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
