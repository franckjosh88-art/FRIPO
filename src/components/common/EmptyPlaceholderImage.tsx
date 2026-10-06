import React from 'react';
import { Camera } from 'lucide-react';

interface EmptyPlaceholderImageProps {
  className?: string;
  iconSize?: number;
  text?: string;
  showText?: boolean;
}

export const EmptyPlaceholderImage: React.FC<EmptyPlaceholderImageProps> = ({
  className = 'w-full h-full min-h-[140px]',
  iconSize = 22,
  text = 'Photo à ajouter',
  showText = true,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-[#F1F1EE] text-[#555] rounded-2xl border border-dashed border-[#D2D2CC] select-none ${className}`}
      role="img"
      aria-label="Emplacement photo vide"
    >
      <div className="flex flex-col items-center justify-center p-3 text-center">
        <div className="w-10 h-10 rounded-full bg-[#E5E5E0] flex items-center justify-center mb-1.5 shadow-2xs">
          <Camera size={iconSize} className="text-[#333] stroke-[1.8]" />
        </div>
        {showText && (
          <span className="text-[11px] font-semibold text-[#666] tracking-tight leading-tight">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};
