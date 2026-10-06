import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, ArrowRight, Scan } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompression';
import { analyzeGarment } from '../../utils/lensAnalyzer';

export const LensView: React.FC = () => {
  const setLensDraftPhoto = useStore((state) => state.setLensDraftPhoto);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const [analyzing, setAnalyzing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];

    setAnalyzing(true);
    try {
      // Compression
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      });

      // Upload Cloudinary ou DataURL local
      const photoUrl = await uploadToCloudinary(compressed);

      // Appel de la fonction isolée d'analyse d'IA
      await analyzeGarment(photoUrl);

      // Transmission au brouillon de vente
      setLensDraftPhoto(photoUrl);
      setAnalyzing(false);
      setActiveTab('sell');
    } catch (err) {
      console.error('Erreur Lens:', err);
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 bg-[#111111] text-white p-5 justify-between select-none animate-in fade-in">
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleCapture(e.target.files)}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={(e) => handleCapture(e.target.files)}
        className="hidden"
      />

      {/* En-tête Lens */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-heading font-black text-xl tracking-tight uppercase text-white">
            FRIPO LENS
          </span>
          <span className="text-[10px] font-bold bg-[#0A84FF] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            Scanner
          </span>
        </div>
        <p className="text-xs text-[#888888] font-medium mt-1">
          Scanne un vêtement pour créer ton annonce en un instant.
        </p>
      </div>

      {/* Viseur streetwear central */}
      <div className="my-8 flex flex-col items-center justify-center">
        <div className="relative w-64 h-72 rounded-[32px] border-2 border-dashed border-[#444444] bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center overflow-hidden shadow-2xl">
          {/* Coins accentués façon scanner */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#0A84FF]" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#0A84FF]" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#0A84FF]" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#0A84FF]" />

          {analyzing ? (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <Scan size={44} className="text-[#0A84FF] animate-spin mb-3" />
              <p className="font-heading font-bold text-xs uppercase text-white">
                Traitement de la photo...
              </p>
              <p className="text-[10px] text-[#888888] mt-1">
                Préparation du brouillon
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#222222] flex items-center justify-center mb-3 text-[#0A84FF]">
                <Camera size={30} className="stroke-[2]" />
              </div>
              <p className="font-heading font-bold text-xs uppercase text-white">
                Place la pièce dans le cadre
              </p>
              <p className="text-[10px] text-[#777777] mt-1">
                Photo nette sous bon éclairage
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={analyzing}
          className="w-full bg-white hover:bg-neutral-100 text-[#111111] py-4 px-6 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <span>Ouvrir l'appareil photo</span>
          <Camera size={18} className="stroke-[2.5]" />
        </button>

        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={analyzing}
          className="w-full bg-[#222222] hover:bg-[#2c2c2c] text-white py-3 px-6 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <ImageIcon size={15} />
          <span>Importer depuis la galerie</span>
        </button>
      </div>
    </div>
  );
};
