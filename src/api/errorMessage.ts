/**
 * Message d'erreur renvoyé par l'API, à défaut un repli générique.
 *
 * Le serveur compose des phrases destinées à l'utilisateur — « L'année
 * scolaire 2024-2025 est clôturée », « Cet élève n'est pas rattaché à votre
 * compte ». Les remplacer par un message maison perd l'information ; les
 * afficher telles quelles évite d'avoir à deviner.
 *
 * `message` peut être un tableau : c'est la forme que prend un refus du
 * ValidationPipe, qui liste les champs invalides. On n'en montre que le
 * premier, les autres suivront à la correction.
 *
 * Fichier séparé de `QueryPanel` : un module qui exporte à la fois un
 * composant et une fonction désactive le rechargement à chaud de Vite.
 */
/** Forme d'une erreur axios dont on sait extraire un message serveur. */
interface ApiErrorShape {
  response?: { data?: { message?: string | string[] } };
}

export function errorMessage(err: unknown, fallback: string): string {
  const msg = (err as ApiErrorShape)?.response?.data?.message;

  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return msg || fallback;
}
