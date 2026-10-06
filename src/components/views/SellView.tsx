import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompression';
import type { ClothingItem, Currency, ItemCondition } from '../../types';

const CATEGORIES = ['Hauts', 'Bas', 'Vestes & Manteaux', 'Chaussures', 'Accessoires', 'Streetwear', 'Vintage'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', 'Unique'];
const CONDITIONS: { id: ItemCondition; label: string }[] = [
  { id: 'neuf', label: 'Neuf' },
  { id: 'très bon', label: 'Très bon état' },
  { id: 'bon', label: 'Bon état' },
  { id: 'usé', label: 'Usé' },
];
const ERAS = ['Années 70', 'Années 80', 'Années 90', 'Années 2000', 'Vintage', 'Contemporain'];

export const SellView: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const createItem = useStore((state) => state.createItem);
  const updateItem = useStore((state) => state.updateItem);
  const editingItemId = useStore((state) => state.editingItemId);
  const items = useStore((state) => state.items);
  const lensDraftPhoto = useStore((state) => state.lensDraftPhoto);
  const setLensDraftPhoto = useStore((state) => state.setLensDraftPhoto);

  const existingItem = editingItemId ? items.find((i) => i.id === editingItemId) : null;

  // Form State
  const [title, setTitle] = useState(existingItem?.title || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [category, setCategory] = useState(existingItem?.category || 'Hauts');
  const [size, setSize] = useState(existingItem?.size || 'M');
  const [condition, setCondition] = useState<ItemCondition>(existingItem?.condition || 'très bon');
  const [brand, setBrand] = useState(existingItem?.brand || '');
  const [era, setEra] = useState(existingItem?.era || 'Années 90');
  const [price, setPrice] = useState(existingItem ? String(existingItem.price) : '');
  const [currency, setCurrency] = useState<Currency>(existingItem?.currency || 'USD');
  const [negotiable, setNegotiable] = useState(existingItem ? existingItem.negotiable : true);
  const [isDraft, setIsDraft] = useState(existingItem ? existingItem.status === 'draft' : false);

  // Photos
  const [images, setImages] = useState<string[]>(existingItem?.images || []);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Si on arrive depuis Fripo Lens avec une photo
  useEffect(() => {
    if (lensDraftPhoto && images.length === 0) {
      setImages([lensDraftPhoto]);
      setLensDraftPhoto(null);
    }
  }, [lensDraftPhoto, images.length, setLensDraftPhoto]);

  // Gestion de l'upload des photos
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setActivePhotoModal(null);
    setErrorMsg(null);

    const filesArray = Array.from(files);
    const remaining = 5 - images.length;
    const toProcess = filesArray.slice(0, remaining);

    if (toProcess.length === 0) {
      setErrorMsg('La limite maximale est de 5 photos par vêtement.');
      return;
    }

    try {
      setUploadProgress(10);
      const newUrls: string[] = [];

      for (let i = 0; i < toProcess.length; i++) {
        const file = toProcess[i];
        // Compression navigateur avant envoi (max 1200px, 0.8)
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
        });

        const url = await uploadToCloudinary(compressed, undefined, undefined, (progress) => {
          const overall = Math.round(((i + progress / 100) / toProcess.length) * 100);
          setUploadProgress(overall);
        });

        newUrls.push(url);
      }

      setImages((prev) => [...prev, ...newUrls].slice(0, 5));
      setUploadProgress(null);
    } catch (err) {
      console.error("Erreur d'upload photo:", err);
      setErrorMsg("Impossible d'ajouter la photo. Veuillez réessayer.");
      setUploadProgress(null);
    }
  };

  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setAsMainPhoto = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const movePhoto = (index: number, dir: 'left' | 'right') => {
    setImages((prev) => {
      const copy = [...prev];
      const target = dir === 'left' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const tmp = copy[index];
      copy[index] = copy[target];
      copy[target] = tmp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setCurrentView('auth');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Veuillez donner un titre à votre vêtement.');
      return;
    }

    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Veuillez indiquer un prix valide supérieur à 0.');
      return;
    }

    setSubmitting(true);

    const payload: ClothingItem = {
      id: existingItem?.id || `ITEM-${Date.now().toString(36).toUpperCase()}`,
      sellerId: currentUser.id,
      sellerUsername: currentUser.username,
      sellerPhotoUrl: currentUser.photoUrl,
      sellerRatingAvg: currentUser.ratingAvg,
      sellerRatingCount: currentUser.ratingCount,
      title: title.trim(),
      description: description.trim(),
      category,
      size,
      condition,
      brand: brand.trim(),
      era,
      price: numPrice,
      currency,
      negotiable,
      images,
      status: isDraft ? 'draft' : 'active',
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (existingItem) {
        await updateItem(payload);
      } else {
        await createItem(payload);
      }
      setActiveTab('closet');
    } catch (err: any) {
      console.error('Erreur publication:', err);
      setErrorMsg("Erreur lors de l'enregistrement de l'annonce.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-32 px-4 pt-3 bg-transparent text-[#111111] select-none animate-in fade-in">
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />

      {/* Titre */}
      <div className="mb-4">
        <h1 className="font-heading font-black text-2xl uppercase tracking-tight text-white drop-shadow-md">
          {existingItem ? 'Modifier la pièce' : 'Mettre en vente'}
        </h1>
        <p className="text-xs text-white/80 font-medium">
          Renseigne ta pièce pour l'ajouter à ton closet et la vendre à la communauté.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. GRILLE DE 5 PHOTOS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111111]">
              1. Photos ({images.length}/5)
            </label>
            {uploadProgress !== null && (
              <span className="text-[10px] font-bold text-[#0A84FF]">
                Compression : {uploadProgress}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((idx) => {
              const img = images[idx];
              if (img) {
                return (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-[16px] overflow-hidden bg-[#F1F1EE] border-2 border-[#111111] shadow-2xs group"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />

                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#111111] text-white text-[7px] font-black px-1 rounded-sm flex items-center gap-0.5">
                        <Star size={6} className="fill-current" /> Principale
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-xs flex items-center justify-around py-0.5">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => movePhoto(idx, 'left')}
                          className="text-white hover:text-neutral-300"
                        >
                          <ChevronLeft size={12} />
                        </button>
                      )}
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsMainPhoto(idx)}
                          className="text-amber-400"
                        >
                          <Star size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="text-red-400"
                      >
                        <Trash2 size={11} />
                      </button>
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => movePhoto(idx, 'right')}
                          className="text-white hover:text-neutral-300"
                        >
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoModal(idx)}
                  className="aspect-square rounded-[16px] bg-[#F3F3F0] hover:bg-[#EAEAE7] border border-dashed border-[#D2D2CC] flex flex-col items-center justify-center p-1 text-[#444444] transition-all active:scale-95"
                >
                  <Camera size={14} className="stroke-[2] text-[#222222]" />
                  <span className="text-[8px] font-bold text-[#666666] mt-0.5">
                    + Photo
                  </span>
                </button>
              );
            })}
          </div>

          {/* Modal choix appareil photo ou galerie */}
          {activePhotoModal !== null && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-[340px] rounded-[28px] p-5 shadow-2xl animate-in slide-in-from-bottom-4">
                <h3 className="font-heading font-black text-sm uppercase text-center mb-1">
                  Ajouter une photo
                </h3>
                <p className="text-[11px] text-[#777777] text-center mb-4">
                  Compressée automatiquement à 1200 px pour économiser vos données
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-[#111111] text-white py-3 rounded-[20px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    <span>Prendre une photo (Appareil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full bg-[#F3F3F0] text-[#111111] py-3 rounded-[20px] font-heading font-bold text-xs uppercase flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={16} />
                    <span>Choisir dans la galerie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePhotoModal(null)}
                    className="w-full py-2 text-xs font-bold text-[#888888]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. TITRE & DESCRIPTION */}
        <div>
          <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111111] block mb-1">
            2. Titre du vêtement *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Veste bomber en cuir vintage 90s"
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] focus:border-[#111111] rounded-[18px] px-3.5 py-2.5 text-xs text-[#111111] font-semibold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111111] block mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails, matière, coupe, imperfections éventuelles..."
            className="w-full bg-[#F9F9F7] border border-[#E2E2DC] focus:border-[#111111] rounded-[18px] px-3.5 py-2 text-xs text-[#111111] focus:outline-none"
          />
        </div>

        {/* 3. CARACTÉRISTIQUES STREETWEAR */}
        <div className="grid grid-cols-2 gap-3 bg-[#F6F6F4] p-3.5 rounded-[24px] border border-[#ECECE9]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-[#E2E2DC] rounded-xl px-2.5 py-2 text-xs font-bold text-[#111111] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
              Taille
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-white border border-[#E2E2DC] rounded-xl px-2.5 py-2 text-xs font-bold text-[#111111] focus:outline-none"
            >
              {SIZES.filter((s) => s !== 'all').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
              Marque
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ex: Nike, Carhartt, Levi's"
              className="w-full bg-white border border-[#E2E2DC] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
              Époque
            </label>
            <select
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="w-full bg-white border border-[#E2E2DC] rounded-xl px-2.5 py-2 text-xs font-bold text-[#111111] focus:outline-none"
            >
              {ERAS.filter((e) => e !== 'all').map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ÉTAT */}
        <div>
          <label className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111111] block mb-1.5">
            État du vêtement
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CONDITIONS.map((cond) => (
              <button
                key={cond.id}
                type="button"
                onClick={() => setCondition(cond.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                  condition === cond.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#F9F9F7] text-[#444444] border-[#E2E2DC]'
                }`}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. PRIX & NÉGOCIATION */}
        <div className="bg-[#F6F6F4] p-3.5 rounded-[24px] border border-[#ECECE9] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
                Prix souhaité *
              </label>
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex : 45"
                className="w-full bg-white border border-[#E2E2DC] rounded-xl px-3 py-2 text-sm font-black text-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] block mb-1">
                Devise
              </label>
              <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-[#E2E2DC]">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-1 text-xs font-black rounded-lg ${
                    currency === 'USD' ? 'bg-[#111111] text-white' : 'text-[#666666]'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('CDF')}
                  className={`py-1 text-xs font-black rounded-lg ${
                    currency === 'CDF' ? 'bg-[#111111] text-white' : 'text-[#666666]'
                  }`}
                >
                  CDF (FC)
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#EAEAE7]">
            <span className="text-xs font-bold text-[#111111]">Prix négociable</span>
            <button
              type="button"
              onClick={() => setNegotiable(!negotiable)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                negotiable ? 'bg-[#0A84FF]' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  negotiable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. BROUILLON / PUBLIÉ */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-xs font-bold text-[#111111] block">
              Publier immédiatement dans le fil
            </span>
            <span className="text-[10px] text-[#777777]">
              Si désactivé, l'article sera sauvegardé en brouillon dans ton closet
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDraft(!isDraft)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              !isDraft ? 'bg-[#1DB954]' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !isDraft ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#111111] hover:bg-black text-white py-4 px-6 rounded-[22px] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span>
            {existingItem
              ? 'Enregistrer les modifications'
              : isDraft
              ? 'Enregistrer le brouillon'
              : 'Publier la pièce →'}
          </span>
          <ArrowRight size={16} className="stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
