import { describe, expect, it } from 'vitest';
import { errorMessage } from './errorMessage';

/**
 * Ce helper est la raison pour laquelle deux faux bugs ont été signalés
 * pendant le développement : l'écran affichait « aucune donnée » là où le
 * serveur avait répondu 403. Il est désormais partagé par 26 écrans.
 */
describe('errorMessage', () => {
  it('affiche la phrase du serveur plutôt que le repli', () => {
    const err = {
      response: { data: { message: "L'année scolaire 2024-2025 est clôturée" } },
    };

    expect(errorMessage(err, 'Indisponible.')).toBe(
      "L'année scolaire 2024-2025 est clôturée",
    );
  });

  it('ne retient que le premier message d’un refus de validation', () => {
    // Le ValidationPipe renvoie un tableau : les autres suivront à la
    // correction du premier champ.
    const err = {
      response: { data: { message: ['Email invalide', 'Nom obligatoire'] } },
    };

    expect(errorMessage(err, 'Indisponible.')).toBe('Email invalide');
  });

  it('retombe sur le repli quand le serveur n’a rien dit', () => {
    expect(errorMessage(new Error('Network Error'), 'Indisponible.')).toBe(
      'Indisponible.',
    );
    expect(errorMessage(undefined, 'Indisponible.')).toBe('Indisponible.');
    expect(errorMessage({ response: {} }, 'Indisponible.')).toBe(
      'Indisponible.',
    );
  });

  it('retombe sur le repli pour un tableau vide', () => {
    const err = { response: { data: { message: [] } } };
    expect(errorMessage(err, 'Indisponible.')).toBe('Indisponible.');
  });
});
