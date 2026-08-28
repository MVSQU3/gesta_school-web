/**
 * Longueur minimale d'un mot de passe choisi par un utilisateur.
 *
 * Doit rester alignée sur `MIN_PASSWORD_LENGTH` côté API : une valeur plus
 * basse ici ferait refuser côté serveur un formulaire que l'écran a accepté,
 * ce qui se lit comme un bug.
 *
 * La connexion, elle, n'impose aucun plancher : elle vérifie un mot de passe
 * existant, dont certains sont antérieurs à cette règle.
 */
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_HINT = `Minimum ${MIN_PASSWORD_LENGTH} caractères.`;
