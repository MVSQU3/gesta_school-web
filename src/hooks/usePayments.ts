import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  CancellationType,
  CashJournalSummary,
  PaginatedResult,
  Payment,
  PaymentMethod,
} from '../types';

/**
 * Retrouve un reçu archivé par son numéro, pour réimpression.
 * Route: GET /api/v1/payments/receipt/:receiptNumber
 */
export function useReceiptLookup() {
  return useMutation({
    mutationFn: async ({
      receiptNumber,
      schoolId,
    }: {
      receiptNumber: string;
      schoolId?: string;
    }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.get<Payment>(
        `/payments/receipt/${receiptNumber.trim().toUpperCase()}${query}`,
      );
      return data;
    },
  });
}

/**
 * Annulation d'un encaissement (erreur de saisie ou remboursement).
 * Réservé à la direction côté API.
 * Route: PATCH /api/v1/payments/:id/cancel
 */
export function useCancelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
      schoolId,
    }: {
      id: string;
      type: CancellationType;
      reason: string;
      schoolId?: string;
    }) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.patch<Payment>(
        `/payments/${id}/cancel${query}`,
        { type, reason },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export interface CashJournalFilters {
  /** Format AAAA-MM-JJ. Sans dates, l'API renvoie la journée en cours. */
  from?: string;
  to?: string;
  method?: PaymentMethod | '';
  receivedByUserId?: string;
  page?: number;
  limit?: number;
  /** Uniquement requis pour le SUPER_ADMIN */
  schoolId?: string;
}

type CashJournal = PaginatedResult<Payment> & { summary: CashJournalSummary };

/**
 * Journal de caisse : versements d'une période avec les totaux consolidés.
 * Route: GET /api/v1/payments
 */
export function useCashJournal(filters: CashJournalFilters) {
  return useQuery({
    queryKey: ['payments', 'journal', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const { data } = await apiClient.get<CashJournal>(
        `/payments?${params.toString()}`,
      );
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export interface ProcessPaymentInput {
  reference: string;
  amount: number;
  method?: PaymentMethod;
  /** Uniquement requis pour le SUPER_ADMIN (passé en query param côté back) */
  schoolId?: string;
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, ...rest }: ProcessPaymentInput) => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.post<Payment>(`/payments${query}`, rest);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/**
 * Échéancier d'une inscription : la liste des versements déjà encaissés.
 * Route: GET /api/v1/payments/enrollment/:enrollmentId
 */
export function useEnrollmentPayments(
  enrollmentId: string | undefined,
  schoolId?: string,
) {
  return useQuery({
    queryKey: ['payments', 'enrollment', enrollmentId, schoolId],
    enabled: !!enrollmentId,
    queryFn: async () => {
      const query = schoolId ? `?schoolId=${schoolId}` : '';
      const { data } = await apiClient.get<Payment[]>(
        `/payments/enrollment/${enrollmentId}${query}`,
      );
      return data;
    },
  });
}
