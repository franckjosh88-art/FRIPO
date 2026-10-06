import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EmptyPlaceholderImage } from '../common/EmptyPlaceholderImage';

export const OnboardingView: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const items = useStore((state) => state.items);
  const setOnboardingSeen = useStore((state) => state.setOnboardingSeen);
  const setCurrentView = useStore((state) => state.setCurrentView);

  const handleStart = () => {
    setOnboardingSeen(true);
    setCurrentView('auth');
  };

  // Les derniers articles réels publiés (s'il y en a) ou sinon 3 emplacements vides
  const displayCards = items.length > 0 ? items.slice(0, 3) : [null, null, null];

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F3F0] text-[#111111] p-4 pb-8 justify-between select-none animate-in fade-in duration-300">
      {/* Grand bloc bleu vif arrondi en haut avec logo FRIPO en noir */}
      <div className="w-full bg-[#0A84FF] rounded-[28px] pt-8 pb-6 px-5 flex flex-col items-center justify-center relative overflow-hidden shadow-md">
        {/* Motif décoratif pixelisé subtil */}
        <div className="absolute inset-0 bg-pixel-pattern opacity-30 pointer-events-none" />

        <span className="font-heading font-black text-4xl sm:text-5xl tracking-tighter text-[#111111] uppercase leading-none z-10">
          FRIPO
        </span>
        <span className="text-[11px] font-bold text-[#111111]/85 tracking-widest uppercase mt-1 z-10">
          Vintage & Streetwear Closet
        </span>

        {/* Carrousel horizontal de cartes blanches */}
        <div className="w-full mt-6 overflow-x-auto no-scrollbar flex items-center gap-3.5 px-2 py-1 snap-x snap-mandatory z-10">
          {displayCards.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[22px] p-2.5 shadow-md w-[190px] shrink-0 border border-white/50 snap-center"
            >
              <div className="aspect-[4/5] rounded-[16px] overflow-hidden bg-[#F1F1EE] relative mb-2">
                {item && item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <EmptyPlaceholderImage
                    className="w-full h-full rounded-[16px]"
                    iconSize={20}
                    text="Photo à ajouter"
                  />
                )}
                {item && (
                  <span className="absolute bottom-2 left-2 bg-[#111111] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {item.price} {item.currency}
                  </span>
                )}
              </div>

              <div className="px-1">
                <p className="font-heading font-bold text-xs text-[#111111] truncate">
                  {item ? item.title : `Pièce Closet #${idx + 1}`}
                </p>
                <p className="text-[10px] text-[#777777] font-medium">
                  {item ? `${item.size} · ${item.era}` : 'À estimer ou vendre'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Titres énormes et sous-titre */}
      <div className="my-6 px-2">
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#111111] uppercase leading-[1.05] tracking-tight">
          Découvre ce que valent tes habits
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] font-medium mt-3 leading-relaxed max-w-[320px]">
          La plupart des gens ne savent pas que leur garde-robe vaut des milliers.
          Vends, achète et estime la valeur de ton closet en temps réel.
        </p>
      </div>

      {/* Bouton noir Commencer et pagination en bas */}
      <div className="flex flex-col gap-4">
        <button
          onClick={handleStart}
          className="w-full bg-[#111111] hover:bg-black text-white py-4 px-6 rounded-[22px] font-heading font-bold text-sm uppercase tracking-wider flex items-center justify-between shadow-lg active:scale-[0.98] transition-all"
        >
          <span>Commencer</span>
          <ArrowRight size={18} className="stroke-[2.5]" />
        </button>

        {/* Points de pagination */}
        <div className="flex items-center justify-center gap-2 pb-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === 0 ? 'w-6 bg-[#111111]' : 'w-2 bg-[#CCCCCC]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
