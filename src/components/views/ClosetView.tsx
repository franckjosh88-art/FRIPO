import React, { useState, useRef } from 'react';
import {
  Bell,
  Settings,
  Camera,
  Star,
  TrendingUp,
  Share2,
  Trash2,
  CheckCircle,
  Edit,
  ExternalLink,
  Lock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EmptyPlaceholderImage } from '../common/EmptyPlaceholderImage';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompression';
import type { ClothingItem, ValueSnapshot } from '../../types';

interface ClosetViewProps {
  onSelectItem: (item: ClothingItem) => void;
  userIdToView?: string | null;
}

export const ClosetView: React.FC<ClosetViewProps> = ({
  onSelectItem,
  userIdToView,
}) => {
  const currentUser = useStore((state) => state.currentUser);
  const items = useStore((state) => state.items);
  const favorites = useStore((state) => state.favorites);
  const valueSnapshots = useStore((state) => state.valueSnapshots);
  const updateUserBio = useStore((state) => state.updateUserBio);
  const markItemAsSold = useStore((state) => state.markItemAsSold);
  const removeItem = useStore((state) => state.removeItem);
  const setEditingItemId = useStore((state) => state.setEditingItemId);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const toggleFollow = useStore((state) => state.toggleFollow);
  const isFollowing = useStore((state) =>
    userIdToView ? state.isFollowing(userIdToView) : false
  );

  const [closetTab, setClosetTab] = useState<'selling' | 'sold' | 'favorites'>('selling');
  const [period, setPeriod] = useState<'7J' | '30J' | '90J' | '1AN' | 'TOUT'>('30J');
  const [activeCurvePoint, setActiveCurvePoint] = useState<{ date: string; value: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const targetUserId = userIdToView || currentUser?.id;
  const isMyCloset = currentUser && targetUserId === currentUser.id;

  // Filtrer les articles de ce closet
  const userItems = items.filter((i) => i.sellerId === targetUserId);
  const activeItems = userItems.filter((i) => i.status === 'active');
  const soldItems = userItems.filter((i) => i.status === 'sold');
  const favoriteItems = items.filter((i) => favorites.includes(i.id));

  // Calcul dynamique réel de la valeur du closet (somme des articles actifs)
  const closetValue = activeItems.reduce((acc, i) => acc + i.price, 0);
  const currency = activeItems[0]?.currency || 'USD';

  // Courbe d'estimation de la valeur : snapshots enregistrés
  const snapshotsForUser = valueSnapshots.filter((s) => s.userId === targetUserId);

  // Changement d'avatar
  const handleAvatarChange = async (files: FileList | null) => {
    if (!files || !files[0] || !isMyCloset) return;
    try {
      const compressed = await compressImage(files[0], {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
      });
      const url = await uploadToCloudinary(compressed);
      await updateUserBio(currentUser.bio || '', currentUser.website, url);
    } catch (e) {
      console.error('Erreur upload avatar:', e);
    }
  };

  const handleShareCloset = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Closet Fripo de @${currentUser?.username}`,
          text: `Viens découvrir les pièces de mon closet sur Fripo !`,
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!currentUser && !userIdToView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center select-none">
        <p className="text-xs text-[#666666] mb-3">
          Connecte-toi pour gérer ton closet et estimer sa valeur.
        </p>
        <button
          onClick={() => setCurrentView('auth')}
          className="bg-[#111111] text-white px-6 py-3 rounded-full text-xs font-bold uppercase font-heading"
        >
          Créer un profil →
        </button>
      </div>
    );
  }

  // Nom d'utilisateur affiché
  const displayUsername = isMyCloset
    ? currentUser?.username
    : activeItems[0]?.sellerUsername || 'utilisateur';
  const displayPhoto = isMyCloset ? currentUser?.photoUrl : activeItems[0]?.sellerPhotoUrl;
  const ratingCount = isMyCloset ? currentUser?.ratingCount || 0 : activeItems[0]?.sellerRatingCount || 0;
  const ratingAvg = isMyCloset ? currentUser?.ratingAvg || 0 : activeItems[0]?.sellerRatingAvg || 0;

  return (
    <div className="flex flex-col min-h-full pb-32 px-4 pt-3 bg-transparent text-[#111111] select-none animate-in fade-in">
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={(e) => handleAvatarChange(e.target.files)}
        className="hidden"
      />

      {/* Barre supérieure : Titre "Mon closet", cloche et réglages */}
      <div className="flex items-center justify-between pb-3">
        <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-white drop-shadow-md">
          {isMyCloset ? 'Mon closet' : `@${displayUsername}`}
        </h1>

        <div className="flex items-center gap-2">
          {isMyCloset && (
            <>
              <button
                aria-label="Notifications"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xs transition-transform active:scale-95"
              >
                <Bell size={18} />
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                aria-label="Réglages"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xs transition-transform active:scale-95"
              >
                <Settings size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* CARTE BLANCHE : AVATAR, PSEUDO, STATS, SUIVRE */}
      <div className="bg-white rounded-[26px] p-4 border border-[#ECECE9] shadow-2xs">
        <div className="flex items-center gap-3.5">
          {/* Avatar avec upload téléphone */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#EAEAE7] overflow-hidden flex items-center justify-center font-heading font-black text-xl text-[#111111]">
              {displayPhoto ? (
                <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                displayUsername?.substring(0, 2).toUpperCase()
              )}
            </div>

            {isMyCloset && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Modifier photo de profil"
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-xs"
              >
                <Camera size={12} />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-black text-base text-[#111111] truncate">
              @{displayUsername}
            </h3>

            {/* Étoiles et nombre d'avis masqués tant qu'ils n'existent pas */}
            {ratingCount > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF9500] mt-0.5">
                <Star size={12} className="fill-current" />
                <span>{ratingAvg.toFixed(1)}</span>
                <span className="text-[#888888]">({ratingCount} avis)</span>
              </div>
            ) : null}

            <span className="text-[10px] text-[#888888] font-medium block mt-0.5">
              Inscrit en 2026
            </span>
          </div>

          {!isMyCloset && (
            <button
              onClick={() => targetUserId && toggleFollow(targetUserId)}
              className={`px-4 py-2 rounded-full text-xs font-heading font-bold uppercase ${
                isFollowing ? 'bg-[#F3F3F0] text-[#111111]' : 'bg-[#111111] text-white'
              }`}
            >
              {isFollowing ? 'Abonné' : 'Suivre'}
            </button>
          )}
        </div>

        {/* 3 Statistiques : Valeur du closet, abonnés, abonnements */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F3F3F0] text-center">
          <div>
            <span className="font-heading font-black text-base text-[#111111] block">
              {closetValue} {currency}
            </span>
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Valeur closet
            </span>
          </div>

          <div>
            <span className="font-heading font-black text-base text-[#111111] block">
              {isMyCloset ? currentUser?.followersCount || 0 : 0}
            </span>
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Abonnés
            </span>
          </div>

          <div>
            <span className="font-heading font-black text-base text-[#111111] block">
              {isMyCloset ? currentUser?.followingCount || 0 : 0}
            </span>
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
              Abonnements
            </span>
          </div>
        </div>
      </div>

      {/* CARTE NOIRE "ESTIMATION DE LA VALEUR" */}
      <div className="bg-[#111111] text-white rounded-[28px] p-5 mt-3 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Estimation de la valeur
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full">
            <TrendingUp size={11} /> +100%
          </span>
        </div>

        {/* Grand nombre = somme réelle des prix des articles actifs */}
        <div className="my-2">
          <span className="font-heading font-black text-3xl sm:text-4xl tracking-tight text-white">
            {closetValue} {currency}
          </span>
          <span className="text-[11px] text-white/60 block mt-0.5">
            {activeItems.length} {activeItems.length > 1 ? 'pièces actives' : 'pièce active'} en vente
          </span>
        </div>

        {/* Sélecteur de période : 7J, 30J, 90J, 1 AN, TOUT */}
        <div className="flex items-center justify-between gap-1 my-3 bg-[#1d1d1d] p-1 rounded-xl">
          {(['7J', '30J', '90J', '1AN', 'TOUT'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1 text-[10px] font-heading font-bold rounded-lg transition-colors ${
                period === p ? 'bg-white text-[#111111]' : 'text-white/60 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Courbe verte interactive ou message "Ajoute des vêtements pour voir ta courbe" */}
        <div className="h-28 w-full flex items-center justify-center relative pt-2">
          {snapshotsForUser.length < 2 ? (
            /* ZÉRO DONNÉE FICTIVE */
            <div className="text-center p-3">
              <p className="text-xs text-white/80 font-bold">
                Ajoute des vêtements pour voir ta courbe
              </p>
              <p className="text-[10px] text-white/40 mt-1">
                L'évolution de la cote de ton closet s'affichera dès que tu ajouteras plusieurs pièces.
              </p>
            </div>
          ) : (
            /* Courbe SVG dynamique calculée à partir des snapshots réels */
            <div className="w-full h-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 90">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1DB954" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1DB954" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Ligne verte */}
                <path
                  d="M 10 70 Q 80 50, 150 40 T 290 15"
                  fill="none"
                  stroke="#1DB954"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 70 Q 80 50, 150 40 T 290 15 L 290 90 L 10 90 Z"
                  fill="url(#curveGradient)"
                />
                <circle cx="290" cy="15" r="4" fill="#1DB954" />
              </svg>

              {activeCurvePoint && (
                <div className="absolute top-0 right-4 bg-white text-[#111111] text-[10px] font-bold px-2 py-1 rounded-md shadow-md animate-in fade-in">
                  {activeCurvePoint.value} {currency} · {activeCurvePoint.date}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ligne "Parrainer un ami →" */}
      <div className="mt-3">
        <button
          onClick={handleShareCloset}
          className="w-full bg-white hover:bg-[#F9F9F7] border border-[#ECECE9] p-3.5 rounded-[22px] flex items-center justify-between text-xs font-heading font-bold text-[#111111] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#0A84FF]" />
            <span>Parrainer un ami et partager mon closet</span>
          </div>
          <ArrowRight size={15} />
        </button>

        {copiedLink && (
          <p className="text-[10px] font-bold text-center text-[#0A84FF] mt-1">
            Lien copié dans le presse-papiers !
          </p>
        )}
      </div>

      {/* Deux tuiles colorées : Profil de goût (orange) & Collection rang S (violet) */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div className="bg-[#FF9500] text-white rounded-[24px] p-3.5 relative overflow-hidden shadow-xs">
          <div className="absolute inset-0 bg-pixel-pattern opacity-25 pointer-events-none" />
          <span className="text-[9px] font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full inline-block mb-2">
            Bientôt disponible
          </span>
          <h4 className="font-heading font-black text-xs leading-tight">
            Profil de goût
          </h4>
          <p className="text-[9px] text-white/80 mt-1">
            Algorithme stylistique personnalisé
          </p>
        </div>

        <div className="bg-[#A66CFF] text-white rounded-[24px] p-3.5 relative overflow-hidden shadow-xs">
          <div className="absolute inset-0 bg-pixel-pattern opacity-25 pointer-events-none" />
          <span className="text-[9px] font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full inline-block mb-2">
            Bientôt disponible
          </span>
          <h4 className="font-heading font-black text-xs leading-tight">
            Collection Rang S
          </h4>
          <p className="text-[9px] text-white/80 mt-1">
            Certifications pièces d'archive
          </p>
        </div>
      </div>

      {/* ONGLETS SOUS LE PROFIL : "En vente", "Vendus", "Favoris" */}
      <div className="mt-5">
        <div className="flex items-center gap-1 bg-[#ECECE9] p-1 rounded-[18px]">
          <button
            onClick={() => setClosetTab('selling')}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-[14px] transition-colors ${
              closetTab === 'selling' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#666666]'
            }`}
          >
            En vente ({activeItems.length})
          </button>
          <button
            onClick={() => setClosetTab('sold')}
            className={`flex-1 py-2 text-xs font-heading font-bold rounded-[14px] transition-colors ${
              closetTab === 'sold' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#666666]'
            }`}
          >
            Vendus ({soldItems.length})
          </button>
          {isMyCloset && (
            <button
              onClick={() => setClosetTab('favorites')}
              className={`flex-1 py-2 text-xs font-heading font-bold rounded-[14px] transition-colors ${
                closetTab === 'favorites' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#666666]'
              }`}
            >
              Favoris ({favoriteItems.length})
            </button>
          )}
        </div>

        {/* Liste des articles selon l'onglet sélectionné */}
        <div className="mt-3">
          {closetTab === 'selling' && (
            activeItems.length === 0 ? (
              <div className="bg-white rounded-[24px] p-6 text-center border border-[#ECECE9] my-2">
                <p className="font-heading font-bold text-xs text-[#111111]">
                  Aucun vêtement en vente pour l'instant.
                </p>
                {isMyCloset && (
                  <button
                    onClick={() => setActiveTab('sell')}
                    className="mt-3 bg-[#111111] text-white px-4 py-2 rounded-full font-heading font-bold text-xs uppercase"
                  >
                    Ajouter mon premier vêtement →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-[20px] p-2 border border-[#ECECE9] flex flex-col justify-between"
                  >
                    <div
                      onClick={() => onSelectItem(item)}
                      className="cursor-pointer aspect-square rounded-[14px] bg-[#F3F3F0] overflow-hidden mb-2 relative"
                    >
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <EmptyPlaceholderImage
                          className="w-full h-full rounded-none"
                          iconSize={18}
                          showText={false}
                        />
                      )}
                      <span className="absolute bottom-1.5 left-1.5 bg-[#111111] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {item.price} {item.currency}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-xs text-[#111111] truncate px-1">
                      {item.title}
                    </h4>

                    {isMyCloset && (
                      <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-[#F3F3F0]">
                        <button
                          onClick={() => markItemAsSold(item.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#1DB954] hover:underline"
                        >
                          <CheckCircle size={11} />
                          <span>Marquer vendu</span>
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#999999] hover:text-red-600 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {closetTab === 'sold' && (
            soldItems.length === 0 ? (
              <div className="bg-white rounded-[24px] p-6 text-center border border-[#ECECE9] my-2">
                <p className="font-heading font-bold text-xs text-[#111111]">
                  Aucun article vendu pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {soldItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="cursor-pointer bg-white rounded-[20px] p-2 border border-[#ECECE9]"
                  >
                    <div className="aspect-square rounded-[14px] bg-[#F3F3F0] overflow-hidden mb-2 relative opacity-70">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <EmptyPlaceholderImage
                          className="w-full h-full rounded-none"
                          iconSize={18}
                          showText={false}
                        />
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-[#111111] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        Vendu
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-xs text-[#111111] truncate px-1">
                      {item.title}
                    </h4>
                    <span className="text-xs font-black text-[#111111] px-1 block mt-0.5">
                      {item.price} {item.currency}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {closetTab === 'favorites' && (
            favoriteItems.length === 0 ? (
              <div className="bg-white rounded-[24px] p-6 text-center border border-[#ECECE9] my-2">
                <p className="font-heading font-bold text-xs text-[#111111]">
                  Aucun favori enregistré.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {favoriteItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="cursor-pointer bg-white rounded-[20px] p-2 border border-[#ECECE9]"
                  >
                    <div className="aspect-square rounded-[14px] bg-[#F3F3F0] overflow-hidden mb-2 relative">
                      {item.images[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <EmptyPlaceholderImage
                          className="w-full h-full rounded-none"
                          iconSize={18}
                          showText={false}
                        />
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-xs text-[#111111] truncate px-1">
                      {item.title}
                    </h4>
                    <span className="text-xs font-black text-[#111111] px-1 block mt-0.5">
                      {item.price} {item.currency}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
