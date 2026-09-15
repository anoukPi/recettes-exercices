import { pieceWeight } from './pieceWeights';

// Conversion approximative d'une quantité + mesure vers des grammes.
// Ces valeurs sont des moyennes générales (ex: 1 càs ≈ 15g) — elles ne tiennent
// pas compte de la densité spécifique de chaque ingrédient. Les mesures sans
// équivalent fiable (ex: "au goût") renvoient null : le calcul nutritionnel de
// la ligne concernée est alors indisponible.
const GRAMS_PER_UNIT: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  ml: 1,
  cl: 10,
  l: 1000,
  'cuillère à soupe': 15,
  'cuillère à café': 5,
  pincée: 1,
  tasse: 240,
  verre: 200,
  tranche: 30,
  gousse: 5,
  poignée: 30,
};

// Ces unités n'ont pas de poids fixe : ça dépend totalement de l'ingrédient
// (1 oeuf ≠ 1 pastèque, 1 sachet de levure ≠ 1 sachet de sucre vanillé). On
// regarde plutôt src/lib/pieceWeights.ts.
const PIECE_UNIT_NAMES = new Set(['unité', 'pièce', 'sachet', 'boîte', 'botte', 'feuille', 'brin']);

// Ces unités de masse se convertissent exactement, quel que soit l'ingrédient.
// Toutes les autres (volume, cuillères, tranches, pièces...) reposent sur une
// moyenne générale et peuvent s'écarter significativement de la réalité.
const EXACT_UNITS = new Set(['g', 'kg', 'mg']);

export function gramsForQuantity(quantity: number, unit: string, ingredientName?: string): number | null {
  if (!Number.isFinite(quantity)) return null;
  const key = unit.trim().toLowerCase();

  if (PIECE_UNIT_NAMES.has(key)) {
    if (!ingredientName) return null;
    const weight = pieceWeight(ingredientName, key);
    return weight === null ? null : quantity * weight;
  }

  const perUnit = GRAMS_PER_UNIT[key];
  if (perUnit === undefined) return null;
  return quantity * perUnit;
}

/** true si l'unité est convertible mais seulement via une moyenne approximative
 * (poids au litre supposé, taille de pièce standard, cuillère moyenne...). */
export function isApproxUnit(unit: string): boolean {
  const key = unit.trim().toLowerCase();
  if (PIECE_UNIT_NAMES.has(key)) return true;
  return key in GRAMS_PER_UNIT && !EXACT_UNITS.has(key);
}
