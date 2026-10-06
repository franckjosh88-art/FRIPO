import React from 'react';
import { SlidersHorizontal, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const activeTab = useStore((state) => state.activeTab);
  const setIsFilterSheetOpen = useStore((state) => state.setIsFilterSheetOpen);
  const isFilterSheetOpen = useStore((state) => state.isFilterSheetOpen);

  return (
    <header className="sticky top-0 z-30 bg-[#0B0B0C]/40 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between">
      {/* Bouton Filtres (sur l'onglet Acheter) ou espace réservé */}
      {activeTab === 'buy' ? (
        <button
          onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
          aria-label="Ouvrir les filtres"
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-transform active:scale-95 backdrop-blur-md border border-white/10 shadow-xs"
        >
          <SlidersHorizontal size={18} className="stroke-[2.2]" />
        </button>
      ) : (
        <div className="w-10 h-10" />
      )}

      {/* Logo FRIPO en capitales grasses condensées */}
      <div className="text-center select-none cursor-pointer">
        <span className="font-heading font-black text-2xl tracking-tighter text-white uppercase leading-none block drop-shadow-md">
          FRIPO
        </span>
      </div>

      {/* Bouton Recherche ou espace */}
      {activeTab === 'buy' ? (
        <button
          onClick={() => {
            const input = document.getElementById('fripo-search-input');
            if (input) {
              input.focus();
            }
          }}
          aria-label="Rechercher un vêtement"
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-transform active:scale-95 backdrop-blur-md border border-white/10 shadow-xs"
        >
          <Search size={18} className="stroke-[2.2]" />
        </button>
      ) : (
        <div className="w-10 h-10" />
      )}
    </header>
  );
};
