import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * État de la barre de navigation latérale.
 *
 * Deux comportements distincts se partagent ce magasin, parce qu'ils
 * répondent à deux contraintes d'écran opposées :
 *
 *  - `isCollapsed` — sur grand écran, la barre reste toujours visible mais
 *    peut se réduire aux seules icônes. Un secrétariat travaille sur des
 *    tableaux larges (liste des dossiers, journal de caisse) : pouvoir rendre
 *    200 pixels à la grille change la lisibilité. Ce choix est mémorisé, il
 *    tient de la préférence de poste de travail.
 *
 *  - `isMobileOpen` — sous `lg`, la barre sort par-dessus le contenu et se
 *    referme dès qu'on a navigué. Volontairement non mémorisé : personne ne
 *    souhaite rouvrir l'application sur un panneau qui masque l'écran.
 */
interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

/** Largeurs de la barre, partagées avec le décalage du contenu dans App. */
export const SIDEBAR_WIDTH = 'w-64';
export const SIDEBAR_WIDTH_COLLAPSED = 'w-[4.5rem]';

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,

      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      openMobile: () => set({ isMobileOpen: true }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'gesta-school-sidebar',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
);
