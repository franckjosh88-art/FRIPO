/**
 * backgrounds.ts
 *
 * Liste des images de fond locales fournies par l'utilisateur dans /public/backgrounds/.
 * L'utilisateur peut ajouter ses propres photos de vêtements libres de droits dans /public/backgrounds/
 * et compléter ou modifier la liste ci-dessous.
 *
 * RÈGLE STRICTE :
 * Si ce dossier est vide et que moins de 4 articles existent dans Firestore,
 * l'application affiche le dégradé bleu #0A84FF vers violet #A66CFF avec bandes cannelées.
 * Aucune image codée en dur dans les composants ni URL externe aléatoire.
 */

// Détection automatique par Vite des images ajoutées dans /public/backgrounds/
const globMatches = import.meta.glob('/public/backgrounds/*.{jpg,jpeg,png,webp,avif,svg}', {
  eager: true,
});

const autoDetectedPaths = Object.keys(globMatches).map((p) => p.replace('/public', ''));

// Liste manuelle optionnelle si besoin d'ajouter des chemins spécifiques
const MANUAL_LOCAL_BACKGROUNDS: string[] = [];

// Export unique sans images codées en dur dans les composants
export const LOCAL_BACKGROUND_IMAGES: string[] = [
  ...autoDetectedPaths,
  ...MANUAL_LOCAL_BACKGROUNDS,
];

/**
 * Optimise l'URL d'une image pour le fond :
 * - Pour Cloudinary : injecte w_400,c_fill,q_auto:eco,f_auto pour limiter la largeur à 400px et économiser la bande passante.
 * - Pour les images locales ou autres : retourne l'URL intacte.
 */
export function getOptimizedBackgroundImageUrl(url: string, maxWidth = 400): string {
  if (!url) return '';

  // Transformation Cloudinary si l'image est hébergée sur Cloudinary
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Évite de doubler la transformation si déjà présente
    if (url.includes('/upload/w_')) {
      return url;
    }
    return url.replace('/upload/', `/upload/w_${maxWidth},c_fill,q_auto:eco,f_auto/`);
  }

  return url;
}
