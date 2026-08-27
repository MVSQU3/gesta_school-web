import React from "react";
import { Menu, School as SchoolIcon } from "lucide-react";
import { useSidebarStore } from "../store/useSidebarStore";

/**
 * Bandeau supérieur, visible sous `lg` uniquement.
 *
 * Sur grand écran la barre latérale est toujours là et se suffit à elle-même.
 * Sur mobile elle est repliée hors de l'écran : il faut bien un point d'entrée
 * pour la faire coulisser, et un rappel de l'application au-dessus du contenu.
 */
export const MobileTopBar: React.FC = () => {
  const openMobile = useSidebarStore((s) => s.openMobile);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 text-white lg:hidden">
      <button
        onClick={openMobile}
        title="Ouvrir le menu"
        aria-label="Ouvrir le menu"
        className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-indigo-600 p-1.5 shadow-lg shadow-indigo-600/30">
          <SchoolIcon className="h-4 w-4" />
        </div>
        <span className="font-bold tracking-wide">Gesta School</span>
      </div>
    </header>
  );
};
