import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  ForeignStudentMatch,
  SharedFile,
  TransferRequest,
} from '../types';

/** Ajoute le `schoolId`, qui n'est utile qu'au SUPER_ADMIN. */
const withSchool = (schoolId?: string) => (schoolId ? `?schoolId=${schoolId}` : '');

/**
 * Recherche un élève dans les autres établissements.
 *
 * Volontairement une mutation et non une requête : le serveur exige le triplet
 * complet nom + prénom + date de naissance, la recherche est donc un acte
 * délibéré et non un filtrage au fil de la frappe. Rien ne part tant que le
 * directeur n'a pas validé.
 *
 * Route: POST /api/v1/transfers/search
 */
export function useSearchForeignStudent(schoolId?: string) {
  return useMutation({
    mutationFn: async (body: {
      lastName: string;
      firstName: string;
      birthDay: string;
    }) => {
      const { data } = await apiClient.post<ForeignStudentMatch[]>(
        `/transfers/search${withSchool(schoolId)}`,
        body,
      );
      return data;
    },
  });
}

/** Demandes émises par l'établissement. Route: GET /api/v1/transfers/outgoing */
export function useOutgoingTransfers(schoolId?: string) {
  return useQuery({
    queryKey: ['transfers', 'outgoing', schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<TransferRequest[]>(
        `/transfers/outgoing${withSchool(schoolId)}`,
      );
      return data;
    },
  });
}

/** Demandes reçues, à instruire. Route: GET /api/v1/transfers/incoming */
export function useIncomingTransfers(schoolId?: string) {
  return useQuery({
    queryKey: ['transfers', 'incoming', schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get<TransferRequest[]>(
        `/transfers/incoming${withSchool(schoolId)}`,
      );
      return data;
    },
  });
}

export function useCreateTransferRequest(schoolId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      studentId: string;
      holdingSchoolId: string;
      reason: string;
    }) => {
      const { data } = await apiClient.post<TransferRequest>(
        `/transfers${withSchool(schoolId)}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

type Decision = 'approve' | 'reject' | 'revoke';

/**
 * Décision de l'école détentrice sur une demande reçue.
 *
 * Les trois verdicts partagent un même appel : ils ne diffèrent que par le
 * segment d'URL, et les distinguer en trois hooks n'apporterait que de la
 * répétition dans l'écran qui les appelle.
 */
export function useDecideTransfer(schoolId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      ...body
    }: {
      id: string;
      decision: Decision;
      reason?: string;
      durationDays?: number;
    }) => {
      const { data } = await apiClient.patch<TransferRequest>(
        `/transfers/${id}/${decision}${withSchool(schoolId)}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

/**
 * Le dossier partagé — des bulletins, et rien d'autre.
 *
 * `staleTime: 0` : l'école détentrice peut révoquer l'accès à tout moment, et
 * un dossier servi depuis le cache après une révocation montrerait des données
 * qu'on n'a plus le droit de lire.
 *
 * Route: GET /api/v1/transfers/:id/file
 */
export function useSharedFile(requestId?: string, schoolId?: string) {
  return useQuery({
    queryKey: ['transfers', 'file', requestId, schoolId],
    enabled: !!requestId,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const { data } = await apiClient.get<SharedFile>(
        `/transfers/${requestId}/file${withSchool(schoolId)}`,
      );
      return data;
    },
  });
}
