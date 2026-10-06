import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { FlutedGlassBackground } from '../common/FlutedGlassBackground';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [forceMobileFrame, setForceMobileFrame] = useState(true);

  return (
    <div className="min-h-screen bg-[#E5E5E2] flex flex-col items-center justify-center sm:py-6 sm:px-4 font-sans select-none antialiased">
      {/* Contrôle flottant discret pour alterner vue cadre mobile / plein écran sur desktop */}
      <div className="hidden lg:flex fixed top-3 right-4 z-50 items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#D5D5D0] text-xs font-semibold text-[#111111] shadow-xs">
        <span className="text-[10px] text-[#777777]">Format :</span>
        <button
          onClick={() => setForceMobileFrame(true)}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
            forceMobileFrame ? 'bg-[#111111] text-white' : 'hover:bg-[#F0F0ED]'
          }`}
        >
          <Smartphone size={12} />
          <span>390×844</span>
        </button>
        <button
          onClick={() => setForceMobileFrame(false)}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
            !forceMobileFrame ? 'bg-[#111111] text-white' : 'hover:bg-[#F0F0ED]'
          }`}
        >
          <Monitor size={12} />
          <span>Large</span>
        </button>
      </div>

      {/* Cadre smartphone (390 x 844) */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col ${
          forceMobileFrame
            ? 'max-w-[390px] h-screen sm:h-[844px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[8px] sm:border-[#1A1A1A] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden'
            : 'max-w-md min-h-screen sm:min-h-[844px] sm:rounded-[36px] sm:border border-[#D5D5D0] overflow-hidden shadow-xl'
        } bg-[#0B0B0C]`}
      >
        {/* Calque de fond en verre cannelé avec photos de vêtements */}
        <FlutedGlassBackground />

        {/* Encoche / Haut-parleur décoratif sur grand écran */}
        {forceMobileFrame && (
          <div className="hidden sm:flex absolute top-0 inset-x-0 h-5 z-40 items-center justify-center pointer-events-none">
            <div className="w-24 h-4 bg-[#1A1A1A] rounded-b-xl flex items-center justify-center">
              <div className="w-8 h-1 bg-[#3A3A3A] rounded-full" />
            </div>
          </div>
        )}

        {/* Contenu de l'application avec défilement autonome */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar relative z-10 flex flex-col bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};

