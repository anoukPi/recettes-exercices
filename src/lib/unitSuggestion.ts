import { PIECE_WEIGHTS_G } from './pieceWeights';

const TABLESPOON_PATTERNS = /huile|vinaigre|sauce soja|miel|moutarde|crème fraîche|mayonnaise|ketchup|beurre de cacahuète/;
const TEASPOON_PATTERNS = /levure|bicarbonate|extrait de vanille/;
const PINCH_PATTERNS = /sel|poivre|épice|cannelle|curry|paprika|cumin|muscade|piment|persil séché|origan|thym séché/;
const LIQUID_ML_PATTERNS = /lait|eau|jus|bouillon|vin(?!aigre)|crème liquide|café|thé(?!s)/;

/** Best-effort : propose une mesure logique selon le nom de l'ingrédient. Ne
 * remplace jamais un choix déjà fait par l'utilisatrice — juste une suggestion
 * de départ, éditable comme le reste. */
export function suggestUnit(ingredientName: string): string | null {
  const name = ingredientName.trim().toLowerCase();
  if (!name) return null;

  if (name in PIECE_WEIGHTS_G) return 'unité';
  if (TABLESPOON_PATTERNS.test(name)) return 'cuillère à soupe';
  if (TEASPOON_PATTERNS.test(name)) return 'cuillère à café';
  if (PINCH_PATTERNS.test(name)) return 'pincée';
  if (LIQUID_ML_PATTERNS.test(name)) return 'ml';

  return 'g';
}
