import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EmptyPlaceholderImage } from '../common/EmptyPlaceholderImage';
import type { ClothingItem } from '../../types';

interface ItemDetailViewProps {
  item: ClothingItem;
  onBack: () => void;
  onOpenSellerCloset: (sellerId: string) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  onBack,
  onOpenSellerCloset,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const isFav = favorites.includes(item.id);
  const currentUser = useStore((state) => state.currentUser);
  const startOrOpenConversation = useStore((state) => state.startOrOpenConversation);
  const reportEntity = useStore((state) => state.reportEntity);
  const [reported, setReported] = useState(false);

  const images = item.images && item.images.length > 0 ? item.images : [];
  const isOwner = currentUser?.id === item.sellerId;

  const handleContactSeller = async () => {
    await startOrOpenConversation(item);
  };

  const handleConfirmBuy = async () => {
    setShowBuyModal(false);
    await startOrOpenConversation(item);
  };

  const handleReport = async () => {
    await reportEntity(item.id, 'Article signalé par un utilisateur');
    setReported(true);
    setTimeout(() => setReported(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-[#111111] pb-28 select-none animate-in fade-in">
      {/* Barre supérieure flottante */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#ECECE9] flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 rounded-full bg-[#F3F3F0] flex items-center justify-center text-[#111111] active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
        </button>

        <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#666666]">
          {item.category}
        </span>

        <button
          onClick={() => toggleFavorite(item.id)}
          aria-label="Favori"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
            isFav ? 'bg-[#111111] text-white' : 'bg-[#F3F3F0] text-[#111111]'
          }`}
        >
          <Heart size={16} className={isFav ? 'fill-current stroke-current' : 'stroke-[2.2]'} />
        </button>
      </div>

      {/* Galerie de photos avec swipe ou flèches */}
      <div className="relative aspect-square w-full bg-[#F3F3F0] overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[selectedPhotoIndex] || images[0]}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-200"
          />
        ) : (
          <EmptyPlaceholderImage
            className="w-full h-full rounded-none"
            iconSize={32}
            text="Photo à ajouter par le vendeur"
          />
        )}

        {/* Flèches de navigation */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
            <button
              onClick={() =>
                setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto active:scale-90"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setSelectedPhotoIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto active:scale-90"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Statut vendu */}
        {item.status === 'sold' && (
          <div className="absolute top-3 left-3 bg-[#111111] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
            Article vendu
          </div>
        )}
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPhotoIndex(idx)}
              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                selectedPhotoIndex === idx ? 'border-[#111111] scale-105' : 'border-transparent opacity-60'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Détails du vêtement */}
      <div className="px-5 pt-4 space-y-4">
        {/* Titre et Prix */}
        <div>
          <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-[#111111] leading-tight">
            {item.title}
          </h1>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading font-black text-3xl text-[#111111]">
              {item.price} {item.currency}
            </span>
            {item.negotiable ? (
              <span className="text-[11px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full">
                Prix négociable
              </span>
            ) : (
              <span className="text-[11px] font-bold text-[#666666] bg-[#F3F3F0] px-2 py-0.5 rounded-full">
                Prix ferme
              </span>
            )}
          </div>
        </div>

        {/* Fiche d'attributs streetwear */}
        <div className="grid grid-cols-2 gap-2 bg-[#F6F6F4] p-3.5 rounded-[22px] border border-[#ECECE9] text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
              Taille
            </span>
            <span className="font-heading font-bold text-[#111111]">{item.size}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
              État
            </span>
            <span className="font-heading font-bold text-[#111111] capitalize">
              {item.condition}
            </span>
          </div>

          <div className="pt-2 border-t border-[#EAEAE7]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
              Marque
            </span>
            <span className="font-heading font-bold text-[#111111]">
              {item.brand || 'Non spécifiée'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#EAEAE7]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
              Époque
            </span>
            <span className="font-heading font-bold text-[#111111]">{item.era}</span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div>
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#777777] mb-1">
              Description
            </h3>
            <p className="text-xs text-[#333333] leading-relaxed whitespace-pre-line bg-[#FAF9F7] p-3.5 rounded-2xl border border-[#ECECE9]">
              {item.description}
            </p>
          </div>
        )}

        {/* Carte Vendeur (cliquable vers son closet) */}
        <div
          onClick={() => onOpenSellerCloset(item.sellerId)}
          className="cursor-pointer bg-white hover:bg-[#F9F9F7] border border-[#ECECE9] hover:border-[#111111] p-3.5 rounded-[22px] flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EAEAE7] overflow-hidden flex items-center justify-center font-heading font-black text-sm">
              {item.sellerPhotoUrl ? (
                <img
                  src={item.sellerPhotoUrl}
                  alt={item.sellerUsername}
                  className="w-full h-full object-cover"
                />
              ) : (
                item.sellerUsername.substring(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
                Vendu par
              </span>
              <h4 className="font-heading font-black text-xs text-[#111111]">
                @{item.sellerUsername}
              </h4>

              {/* Note et étoiles masquées si aucune note */}
              {item.sellerRatingCount && item.sellerRatingCount > 0 ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF9500] mt-0.5">
                  <Star size={12} className="fill-current" />
                  <span>{item.sellerRatingAvg?.toFixed(1)}</span>
                  <span className="text-[#888888]">({item.sellerRatingCount})</span>
                </div>
              ) : null}
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#0A84FF]">
            Voir le closet →
          </span>
        </div>

        {/* Bouton signaler */}
        <div className="pt-2 text-center">
          <button
            onClick={handleReport}
            className="text-[11px] font-semibold text-[#888888] hover:text-red-600 flex items-center justify-center gap-1 mx-auto"
          >
            <AlertTriangle size={12} />
            <span>{reported ? 'Article signalé. Merci !' : 'Signaler cet article'}</span>
          </button>
        </div>
      </div>

      {/* Barre d'action fixe en bas */}
      {!isOwner && item.status !== 'sold' && (
        <div className="fixed bottom-0 inset-x-0 max-w-[390px] mx-auto z-40 bg-white/95 backdrop-blur-md p-4 border-t border-[#ECECE9] flex gap-2.5">
          <button
            onClick={handleContactSeller}
            className="flex-1 bg-[#F3F3F0] hover:bg-[#EAEAE7] text-[#111111] py-3.5 px-4 rounded-[22px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <MessageSquare size={16} />
            <span>Écrire</span>
          </button>

          <button
            onClick={() => setShowBuyModal(true)}
            className="flex-1 bg-[#111111] hover:bg-black text-white py-3.5 px-4 rounded-[22px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <ShoppingBag size={16} />
            <span>Acheter</span>
          </button>
        </div>
      )}

      {/* Modal Achat et Négociation */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-[28px] p-5 shadow-2xl animate-in slide-in-from-bottom-4">
            <h3 className="font-heading font-black text-base uppercase text-[#111111]">
              Acheter cette pièce
            </h3>
            <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
              Sur Fripo, la commande se concrétise directement avec le vendeur (remise en main propre ou Mobile Money).
            </p>

            <div className="my-4 bg-[#F6F6F4] p-3 rounded-2xl border border-[#ECECE9]">
              <div className="flex justify-between text-xs font-bold">
                <span>{item.title}</span>
                <span>{item.price} {item.currency}</span>
              </div>
              <span className="text-[10px] text-[#777777] block mt-1">
                Vendeur : @{item.sellerUsername}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmBuy}
                className="w-full bg-[#111111] text-white py-3.5 rounded-[20px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Contacter pour finaliser l'achat</span>
              </button>
              <button
                onClick={() => setShowBuyModal(false)}
                className="w-full py-2.5 text-xs font-bold text-[#666666]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
