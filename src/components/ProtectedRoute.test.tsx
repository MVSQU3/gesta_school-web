import { describe, expect, it } from 'vitest';
import { homeRouteForRoles } from './ProtectedRoute';
import { Role } from '../types';

/**
 * Chaque rôle doit avoir un accueil qui lui est ouvert.
 *
 * Un rôle renvoyé vers une page qui lui est interdite serait redirigé à son
 * tour, indéfiniment — c'est la raison d'être de cette résolution.
 */
describe('homeRouteForRoles', () => {
  it('donne à chaque rôle un accueil distinct', () => {
    expect(homeRouteForRoles([Role.SUPER_ADMIN])).toBe('/admin');
    expect(homeRouteForRoles([Role.DIRECTOR])).toBe('/direction');
    expect(homeRouteForRoles([Role.SECRETARY])).toBe('/');
    expect(homeRouteForRoles([Role.ACCOUNTANT])).toBe('/caisse');
    expect(homeRouteForRoles([Role.TEACHER])).toBe('/enseignant');
    expect(homeRouteForRoles([Role.PARENT])).toBe('/mon-espace');
  });

  it('n’envoie jamais un parent vers un écran d’établissement', () => {
    // Le parent est le seul rôle dont la portée n'est pas l'école : son
    // accueil doit rester dans son propre espace.
    expect(homeRouteForRoles([Role.PARENT])).toBe('/mon-espace');
  });

  it('retombe sur la connexion pour un profil sans rôle connu', () => {
    expect(homeRouteForRoles([])).toBe('/login');
    expect(homeRouteForRoles(['INCONNU' as Role])).toBe('/login');
  });

  it('privilégie le rôle le plus large quand un compte en cumule', () => {
    expect(homeRouteForRoles([Role.TEACHER, Role.DIRECTOR])).toBe('/direction');
  });
});
