import type { RecipeIngredient } from '../types';

const INGREDIENTS_HEADER = /^[^\p{L}]*ingr[ée]dients?\s*:?\s*$/iu;
const STEPS_HEADER = /^[^\p{L}]*(?:[ée]tapes?|pr[ée]paration|instructions)\s*:?\s*$/iu;
const HASHTAG_LINE = /^(?:\s*#\S+\s*)+$/;
const LEADING_BULLET = /^[\s*•\-–—▪️➡️✅✔️]+/u;
const LEADING_EMOJI = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}️\s]+/gu;

// Formes longues avant les abréviations : l'alternation regex prend la première
// qui matche, une forme courte passée avant une longue coupperait celle-ci trop tôt.
const UNIT_WORDS = [
  'cuillères? à soupe',
  'c\\.?à\\.?s\\.?',
  'cas\\b',
  'cs\\b',
  'cuillères? à café',
  'c\\.?à\\.?c\\.?',
  'cac\\b',
  'cc\\b',
  'pincées?',
  'tasses?',
  'verres?',
  'tranches?',
  'gousses?',
  'poignées?',
  'unités?',
  'pièces?',
  'sachets?',
  'boîtes?',
  'bottes?',
  'feuilles?',
  'brins?',
  'kg',
  'g',
  'mg',
  'ml',
  'cl',
  'l',
];

const UNIT_GROUP = `(${UNIT_WORDS.join('|')})`;

// Cas standard : "150g de quinoa", "2 cuillères à soupe d'huile".
const INGREDIENT_LINE_WITH_QUANTITY = new RegExp(
  `^(\\d+(?:[.,]\\d+)?)\\s*${UNIT_GROUP}?\\s*(?:de\\s+|d['’])?\\s*(.+)$`,
  'i',
);

// Cas sans chiffre explicite : "une cuillère à soupe de miel", "cs de miel".
const INGREDIENT_LINE_WITHOUT_QUANTITY = new RegExp(
  `^(?:une?\\s+)?${UNIT_GROUP}\\s*(?:de\\s+|d['’])?\\s*(.+)$`,
  'i',
);

function stripBulletAndEmoji(line: string): string {
  return line.replace(LEADING_BULLET, '').replace(LEADING_EMOJI, '').trim();
}

export function parseIngredientLine(rawLine: string): RecipeIngredient | null {
  const line = stripBulletAndEmoji(rawLine);
  if (!line) return null;

  const withQuantity = line.match(INGREDIENT_LINE_WITH_QUANTITY);
  if (withQuantity) {
    const [, quantity, unit, ingredient] = withQuantity;
    return { quantity, unit: unit ?? '', ingredient: ingredient.trim() };
  }

  const withoutQuantity = line.match(INGREDIENT_LINE_WITHOUT_QUANTITY);
  if (withoutQuantity) {
    const [, unit, ingredient] = withoutQuantity;
    const hadArticle = /^une?\s+/i.test(line);
    return { quantity: hadArticle ? '1' : '', unit, ingredient: ingredient.trim() };
  }

  return { quantity: '', unit: '', ingredient: line };
}

export interface ParsedCaption {
  title: string;
  ingredients: RecipeIngredient[];
  steps: string;
}

/**
 * Découpe une légende Instagram collée en titre / ingrédients / étapes.
 * Best-effort : si les en-têtes "Ingrédients" / "Étapes" ne sont pas trouvés,
 * tout le texte (hashtags retirés) atterrit dans "steps" pour édition manuelle.
 */
export function parseCaption(rawCaption: string): ParsedCaption {
  const lines = rawCaption
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !HASHTAG_LINE.test(l));

  if (lines.length === 0) {
    return { title: '', ingredients: [], steps: '' };
  }

  const title = stripBulletAndEmoji(lines[0]).slice(0, 200);

  const ingredientsStart = lines.findIndex((l) => INGREDIENTS_HEADER.test(l));
  const stepsStart = lines.findIndex((l) => STEPS_HEADER.test(l));

  if (ingredientsStart === -1 && stepsStart === -1) {
    return { title, ingredients: [], steps: lines.slice(1).join('\n') };
  }

  const ingredientLines =
    ingredientsStart === -1
      ? []
      : lines.slice(
          ingredientsStart + 1,
          stepsStart > ingredientsStart ? stepsStart : undefined,
        );

  const stepLines =
    stepsStart === -1 ? [] : lines.slice(stepsStart + 1);

  const ingredients = ingredientLines
    .map(parseIngredientLine)
    .filter((i): i is RecipeIngredient => i !== null);

  return { title, ingredients, steps: stepLines.join('\n') };
}
