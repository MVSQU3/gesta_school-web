import { apiClient } from './client';

/**
 * Télécharge un PDF servi par l'API.
 *
 * Un simple lien ne conviendrait pas : les routes sont protégées par un jeton
 * transmis en en-tête, que le navigateur n'ajoute pas de lui-même. On récupère
 * donc le document en binaire avant de déclencher l'enregistrement.
 */
export async function downloadPdf(
  url: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await apiClient.get(url, { responseType: 'blob' });

  // Le nom proposé par le serveur prime sur celui de l'appelant
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackFilename;

  const blobUrl = window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' }),
  );

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Libère l'objet une fois le téléchargement amorcé
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}
