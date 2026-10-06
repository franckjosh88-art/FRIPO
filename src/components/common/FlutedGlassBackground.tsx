import React, { useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { LOCAL_BACKGROUND_IMAGES, getOptimizedBackgroundImageUrl } from '../../backgrounds';

// Décalages et rotations déterministes (-4° à 4°) pour créer un collage où certaines photos se chevauchent
const COLLAGE_SLOTS = [
  { rotation: -3.2, offsetX: '-2px', offsetY: '0px', zIndex: 1, scale: 1.08 },
  { rotation: 2.4, offsetX: '-14px', offsetY: '12px', zIndex: 4, scale: 1.12 },
  { rotation: -2.0, offsetX: '-24px', offsetY: '-6px', zIndex: 2, scale: 1.06 },
  { rotation: 3.5, offsetX: '4px', offsetY: '-8px', zIndex: 3, scale: 1.09 },
  { rotation: -1.8, offsetX: '-12px', offsetY: '-16px', zIndex: 5, scale: 1.14 },
  { rotation: 2.2, offsetX: '-20px', offsetY: '-10px', zIndex: 2, scale: 1.07 },
];

export const FlutedGlassBackground: React.FC = () => {
  const items = useStore((state) => state.items);
  const activeTab = useStore((state) => state.activeTab);
  const currentUser = useStore((state) => state.currentUser);
  const viewingUserId = useStore((state) => state.viewingUserId);

  // Cache mémoire des images pour éviter les rechargements inutiles
  const cachedImagesRef = useRef<Record<string, string[]>>({});

  // 1. Détermination de la source d'images selon la priorité demandée
  const backgroundImages = useMemo(() => {
    const isClosetScreen = activeTab === 'closet' || viewingUserId !== null;
    const targetUserId = viewingUserId || currentUser?.id;

    // Priorité 1 : Photos réelles d'articles actifs Firestore
    let realPhotos: string[] = [];
    if (isClosetScreen && targetUserId) {
      realPhotos = items
        .filter((i) => i.sellerId === targetUserId && i.status === 'active' && i.images && i.images.length > 0)
        .map((i) => i.images[0]);
    } else {
      realPhotos = items
        .filter((i) => i.status === 'active' && i.images && i.images.length > 0)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((i) => i.images[0]);
    }

    // Priorité 2 : Si moins de 4 articles, compléter avec /public/backgrounds/
    let combined = [...realPhotos];
    if (combined.length < 4 && LOCAL_BACKGROUND_IMAGES.length > 0) {
      combined = [...combined, ...LOCAL_BACKGROUND_IMAGES];
    }

    // Garder entre 4 et 6 images maximum
    const finalSet = combined.slice(0, 6);

    // Mise en cache
    const cacheKey = isClosetScreen ? `closet-${targetUserId}` : 'feed';
    if (finalSet.length >= 4) {
      cachedImagesRef.current[cacheKey] = finalSet;
      return finalSet;
    }

    // Si on avait déjà des images en cache pour cet écran, les conserver
    if (cachedImagesRef.current[cacheKey] && cachedImagesRef.current[cacheKey].length >= 4) {
      return cachedImagesRef.current[cacheKey];
    }

    return finalSet;
  }, [items, activeTab, currentUser?.id, viewingUserId]);

  const hasEnoughImages = backgroundImages.length >= 4;

  return (
    <div
      className="absolute top-0 inset-x-0 h-[45%] max-h-[380px] overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* 3. Dégradé de base / repli (bleu #0A84FF vers violet #A66CFF) toujours présent en fond immédiat */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0A84FF 0%, #A66CFF 100%)',
        }}
      />

      {/* Mosaïque de 4 à 6 photos de vêtements si disponibles */}
      {hasEnoughImages && (
        <div className="absolute inset-x-[-8%] top-[-8%] w-[116%] h-[116%] animate-fluted-drift">
          <div className="grid grid-cols-3 gap-2.5 p-2 h-full w-full">
            {backgroundImages.map((imgUrl, index) => {
              const slot = COLLAGE_SLOTS[index % COLLAGE_SLOTS.length];
              const optimizedUrl = getOptimizedBackgroundImageUrl(imgUrl, 400);

              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className="relative rounded-[22px] overflow-hidden shadow-2xl bg-[#141416] border border-white/10"
                  style={{
                    transform: `translate(${slot.offsetX}, ${slot.offsetY}) rotate(${slot.rotation}deg) scale(${slot.scale})`,
                    transformOrigin: 'center center',
                    zIndex: slot.zIndex,
                    willChange: 'transform',
                  }}
                >
                  <img
                    src={optimizedUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calque unique de verre cannelé par-dessus la mosaïque entière :
          - Voile sombre rgba(11,11,12,0.48) pour assurer contraste AA sur texte blanc
          - Flou d'arrière-plan de 16 px (une seule passe pour la performance 60fps)
          - Bandes cannelées en repeating-linear-gradient de 8px (opacité 6-7%)
          - Dégradé progressif vers #0B0B0C en bas du calque
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11, 11, 12, 0.48) 0%, rgba(11, 11, 12, 0.72) 65%, #0B0B0C 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Rayures cannelées (bandes verticales de 8px avec 6-7% d'opacité) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.07) 0px, rgba(255, 255, 255, 0.07) 4px, rgba(0, 0, 0, 0.04) 4px, rgba(0, 0, 0, 0.04) 8px)',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    </div>
  );
};
