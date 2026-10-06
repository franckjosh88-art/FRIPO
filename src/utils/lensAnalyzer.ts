/**
 * Analyseur d'image Fripo Lens
 * Fonction isolée prête pour le branchement futur à une API de vision / IA
 * IMPORTANT : Ne génère aucun résultat inventé. Renvoie des champs vides par défaut.
 */

export interface LensGarmentAnalysis {
  category: string;
  brand: string;
  color: string;
  suggestedTitle: string;
  suggestedEra: string;
}

export async function analyzeGarment(_imageBase64OrUrl: string): Promise<LensGarmentAnalysis> {
  // Prêt pour une intégration IA future (Gemini Vision ou modèle dédié).
  // Actuellement, renvoie des champs vierges selon les directives strictes du projet (aucune donnée fictive).
  return {
    category: '',
    brand: '',
    color: '',
    suggestedTitle: '',
    suggestedEra: '',
  };
}
