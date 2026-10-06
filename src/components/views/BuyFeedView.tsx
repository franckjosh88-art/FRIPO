import React, { useState } from 'react';
import { Heart, Share2, Sparkles, X, ArrowRight, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EmptyPlaceholderImage } from '../common/EmptyPlaceholderImage';
import type { ClothingItem } from '../../types';

interface BuyFeedViewProps {
  onSelectItem: (item: ClothingItem) => void;
}

const CATEGORIES = ['all', 'Hauts', 'Bas', 'Vestes & Manteaux', 'Chaussures', 'Accessoires', 'Streetwear', 'Vintage'];
const SIZES = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', 'Unique'];
const CONDITIONS = ['all', 'neuf', 'très bon', 'bon', 'usé'];
const ERAS = ['all', 'Années 70', 'Années 80', 'Années 90', 'Années 2000', 'Vintage', 'Contemporain'];

export const BuyFeedView: React.FC<BuyFeedViewProps> = ({ onSelectItem }) => {
  const items = useStore((state) => state.items);
  const currentUser = useStore((state) => state.currentUser);
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const isFilterSheetOpen = useStore((state) => state.isFilterSheetOpen);
  const setIsFilterSheetOpen = useStore((state) => state.setIsFilterSheetOpen);
  const filters = useStore((state) => state.filters);
  const setFilters = useStore((state) => state.setFilters);
  const resetFilters = useStore((state) => state.resetFilters);

  const [shareFeedback, setShareFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // Copie de repli dans le presse-papiers
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setShareFeedback({
        show: true,
        message: 'Lien de parrainage copié dans le presse-papiers !',
        type: 'success',
      });
    } catch {
      setShareFeedback({
        show: true,
        message: 'Impossible de copier automatiquement le lien.',
        type: 'error',
      });
    } finally {
      setTimeout(() => setShareFeedback({ show: false, message: '', type: 'success' }), 2500);
    }
  };

  // Partage via Web Share API native de l'appareil
  const handleInviteFriends = async () => {
    const referralCode = currentUser?.username || (currentUser?.id ? `user-${currentUser.id.slice(0, 6)}` : '');
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const referralUrl = referralCode
      ? `${origin}${pathname}?ref=${encodeURIComponent(referralCode)}`
      : `${origin}${pathname}`;

    const shareData = {
      title: 'Fripo - Marketplace Vintage & Streetwear',
      text: referralCode
        ? `Rejoins-moi sur Fripo avec mon lien parrain @${referralCode} ! Découvre ce que valent tes habits et chine des pièces vintage.`
        : 'Découvre ce que valent tes habits et chine des pépites vintage sur Fripo !',
      url: referralUrl,
    };

    // Vérifie la disponibilité de l'API de partage natif (Web Share API)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (navigator.canShare && !navigator.canShare(shareData)) {
          // Si le navigateur ne peut pas partager tous les champs, on tente titre + URL
          await navigator.share({
            title: shareData.title,
            url: shareData.url,
          });
        } else {
          await navigator.share(shareData);
        }
        setShareFeedback({
          show: true,
          message: 'Lien de parrainage partagé !',
          type: 'success',
        });
        setTimeout(() => setShareFeedback({ show: false, message: '', type: 'success' }), 2500);
      } catch (err: any) {
        // Si l'utilisateur a simplement fermé la boîte de dialogue native
        if (err && (err.name === 'AbortError' || err.code === 20)) {
          return;
        }
        // Pour toute autre erreur inattendue, bascule sur la copie automatique du lien
        await copyToClipboard(referralUrl);
      }
    } else {
      // Navigateur ou environnement sans Web Share API (ex. bureau) : copie directe
      await copyToClipboard(referralUrl);
    }
  };

  // Filtrage des articles (seuls les articles actifs ou vendus visibles dans le fil, draft exclus)
  const activeItems = items.filter((item) => item.status !== 'draft');

  const filteredItems = activeItems.filter((item) => {
    // Recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchCat && !matchDesc) return false;
    }

    // Catégorie
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    // Taille
    if (filters.size !== 'all' && item.size !== filters.size) {
      return false;
    }

    // État
    if (filters.condition !== 'all' && item.condition !== filters.condition) {
      return false;
    }

    // Époque
    if (filters.era !== 'all' && item.era !== filters.era) {
      return false;
    }

    // Marque
    if (filters.brand.trim() && !item.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }

    // Prix min/max
    if (filters.minPrice && item.price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && item.price > parseFloat(filters.maxPrice)) return false;

    return true;
  });

  // Tri
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (filters.sortBy === 'price_asc') return a.price - b.price;
    if (filters.sortBy === 'price_desc') return b.price - a.price;
    return b.createdAt - a.createdAt; // recent
  });

  return (
    <div className="flex flex-col min-h-full pb-24 bg-transparent select-none">
      {/* Barre de recherche discrète */}
      <div className="px-4 pt-2 pb-1">
        <input
          id="fripo-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une pièce, marque, époque..."
          className="w-full bg-white/95 backdrop-blur-md focus:bg-white border border-white/20 focus:border-white rounded-[20px] px-4 py-2.5 text-xs text-[#111111] font-semibold focus:outline-none transition-all placeholder:text-[#666666] shadow-xs"
        />
      </div>

      {/* Bannière violette : "Gagne des récompenses avec tes amis" */}
      <div className="px-4 py-2">
        <div className="bg-[#A66CFF] text-white rounded-[24px] p-4 relative overflow-hidden shadow-sm flex items-center justify-between">
          <div className="absolute inset-0 bg-pixel-pattern opacity-25 pointer-events-none" />
          <div className="z-10 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                Parrainage Fripo
              </span>
              {currentUser?.username && (
                <span className="text-[9px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-mono font-bold text-white">
                  @{currentUser.username}
                </span>
              )}
            </div>
            <h3 className="font-heading font-black text-sm tracking-tight leading-tight mt-0.5">
              Gagne des récompenses avec tes amis
            </h3>
            <p className="text-[10px] text-white/85 font-medium mt-0.5">
              Partage ton lien pour inviter tes proches
            </p>
          </div>
          <button
            onClick={handleInviteFriends}
            aria-label="Inviter des amis via le partage natif"
            className="z-10 bg-white hover:bg-neutral-100 text-[#111111] px-3.5 py-2 rounded-full font-heading font-bold text-xs shrink-0 shadow-xs active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Share2 size={13} className="stroke-[2.5]" />
            <span>Inviter</span>
          </button>
        </div>

        {shareFeedback.show && (
          <div className="mt-2 flex items-center justify-center gap-1.5 bg-[#111111] text-white text-[11px] font-bold py-1.5 px-3 rounded-full animate-in fade-in shadow-md">
            <Check size={12} className="text-[#1DB954] stroke-[3]" />
            <span>{shareFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Grille 2 colonnes ou État vide */}
      <div className="px-4 mt-2">
        {items.length === 0 ? (
          /* ÉCRAN VIDE CONFORME AUX DIRECTIVES (AUCUNE DONNÉE FICTIVE) */
          <div className="bg-[#F6F6F4] rounded-[28px] border border-[#ECECE9] p-7 text-center my-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#EAEAE7] flex items-center justify-center text-[#111111] mb-3 shadow-2xs">
              <Sparkles size={28} className="stroke-[2]" />
            </div>
            <h2 className="font-heading font-black text-base text-[#111111] uppercase tracking-tight">
              Aucun vêtement pour l'instant
            </h2>
            <p className="text-xs text-[#666666] font-medium mt-1.5 max-w-[240px] leading-relaxed">
              Sois le premier à vendre ! Mets une pièce en vente et découvre sa valeur.
            </p>
            <button
              onClick={() => setActiveTab('sell')}
              className="mt-6 w-full max-w-[240px] bg-[#111111] hover:bg-black text-white py-3.5 px-5 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <span>Mettre en vente</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-heading font-bold text-xs text-[#111111]">
              Aucun résultat pour cette recherche ou ces filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                resetFilters();
              }}
              className="mt-3 text-xs font-bold text-[#0A84FF] underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {sortedItems.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <article
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="cursor-pointer group flex flex-col bg-white rounded-[22px] overflow-hidden border border-[#ECECE9] hover:border-[#D0D0CB] transition-all"
                >
                  {/* Photo carrée sur fond gris clair */}
                  <div className="relative aspect-square w-full bg-[#F3F3F0] overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <EmptyPlaceholderImage
                        className="w-full h-full rounded-none"
                        iconSize={22}
                        text="Photo à ajouter"
                      />
                    )}

                    {/* Cœur favori */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      aria-label="Favori"
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-xs backdrop-blur-xs transition-transform active:scale-90 ${
                        isFav
                          ? 'bg-[#111111] text-white'
                          : 'bg-white/90 text-[#111111] hover:bg-white'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={isFav ? 'fill-current stroke-current' : 'stroke-[2.2]'}
                      />
                    </button>

                    {/* Statut vendu */}
                    {item.status === 'sold' && (
                      <div className="absolute bottom-2 left-2 bg-[#111111] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Vendu
                      </div>
                    )}
                  </div>

                  {/* Infos vêtement */}
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-heading font-bold text-xs text-[#111111] line-clamp-1 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-[#888888] font-medium mt-0.5">
                        Taille {item.size}, {item.era}
                      </p>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-[#F3F3F0]">
                      <span className="font-heading font-black text-sm text-[#111111]">
                        {item.price} {item.currency}
                      </span>
                      {item.negotiable && (
                        <span className="text-[9px] font-bold text-[#0A84FF]">
                          Négociable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* FEUILLE DE FILTRES (Bottom sheet qui monte du bas) */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-[390px] rounded-t-[32px] p-5 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECE9]">
              <h3 className="font-heading font-black text-lg uppercase tracking-tight">
                Filtres
              </h3>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F3F3F0] flex items-center justify-center text-[#111111]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* Tri */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  Trier par
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'recent', label: 'Récents' },
                    { id: 'price_asc', label: 'Prix croissant' },
                    { id: 'price_desc', label: 'Prix décroissant' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFilters({ sortBy: s.id as any })}
                      className={`py-2 px-1 text-[11px] font-heading font-bold rounded-[14px] border ${
                        filters.sortBy === s.id
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#F9F9F7] text-[#444444] border-[#E8E8E4]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégories */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  Catégorie
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilters({ category: cat })}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold ${
                        filters.category === cat
                          ? 'bg-[#111111] text-white'
                          : 'bg-[#F3F3F0] text-[#555555]'
                      }`}
                    >
                      {cat === 'all' ? 'Toutes' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tailles */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  Taille
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFilters({ size: sz })}
                      className={`min-w-[36px] py-1 px-2.5 rounded-xl text-xs font-bold ${
                        filters.size === sz
                          ? 'bg-[#111111] text-white'
                          : 'bg-[#F3F3F0] text-[#555555]'
                      }`}
                    >
                      {sz === 'all' ? 'Toutes' : sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* État */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  État
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setFilters({ condition: cond })}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold capitalize ${
                        filters.condition === cond
                          ? 'bg-[#111111] text-white'
                          : 'bg-[#F3F3F0] text-[#555555]'
                      }`}
                    >
                      {cond === 'all' ? 'Tous' : cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Époque / Décennie */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  Époque / Décennie
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ERAS.map((era) => (
                    <button
                      key={era}
                      onClick={() => setFilters({ era })}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold ${
                        filters.era === era
                          ? 'bg-[#111111] text-white'
                          : 'bg-[#F3F3F0] text-[#555555]'
                      }`}
                    >
                      {era === 'all' ? 'Toutes' : era}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix min - max */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1.5">
                  Fourchette de prix
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ minPrice: e.target.value })}
                    placeholder="Min"
                    className="w-1/2 bg-[#F3F3F0] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ maxPrice: e.target.value })}
                    placeholder="Max"
                    className="w-1/2 bg-[#F3F3F0] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions de validation des filtres */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#ECECE9]">
              <button
                onClick={resetFilters}
                className="w-1/3 py-3 rounded-[20px] text-xs font-bold text-[#666666] hover:bg-[#F3F3F0]"
              >
                Effacer
              </button>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-2/3 bg-[#111111] text-white py-3 rounded-[20px] font-heading font-bold text-xs uppercase"
              >
                Appliquer ({sortedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
