import type { RecipeIngredient } from '../types';

const INGREDIENTS_HEADER = /^[^\p{L}]*ingr[ée]dients?\s*:?\s*$/iu;
const STEPS_HEADER = /^[^\p{L}]*(?:[ée]tapes?|pr[ée]paration|instructions)\s*:?\s*$/iu;
const HASHTAG_LINE = /^(?:\s*#\S+\s*)+$/;
const LEADING_BULLET = /^[\s*•\-–—▪️➡️✅✔️]+/u;
const LEADING_EMOJI = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}️\s]+/gu;
// Espaces/joints invisibles (zero-width, word joiner...) — courants dans du
// texte copié depuis certaines apps ou reconnu par OCR, invisibles à l'oeil
// mais ils cassent le "^" des regex suivantes si laissés en tête de ligne.
const INVISIBLE_CHARS = /[​-‍⁠﻿]/g;

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

// Nombres écrits en toutes lettres — très courant à l'oral/dicté ("deux
// tomates", "trois oeufs") plutôt que le chiffre.
const NUMBER_WORDS: Record<string, string> = {
  un: '1', une: '1', deux: '2', trois: '3', quatre: '4', cinq: '5',
  six: '6', sept: '7', huit: '8', neuf: '9', dix: '10', onze: '11',
  douze: '12', treize: '13', quatorze: '14', quinze: '15', seize: '16',
  vingt: '20',
};
const NUMBER_WORD_PATTERN = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join('|');

// Cas "une courgette", "deux tomates" — nombre en toutes lettres (dicté),
// sans mot d'unité explicite.
const NUMBER_WORD_ONLY = new RegExp(`^(${NUMBER_WORD_PATTERN})\\s+(.+)$`, 'i');

function stripBulletAndEmoji(line: string): string {
  return line
    .replace(INVISIBLE_CHARS, '')
    .replace(LEADING_BULLET, '')
    .replace(LEADING_EMOJI, '')
    .trim();
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

  const numberWordOnly = line.match(NUMBER_WORD_ONLY);
  if (numberWordOnly) {
    const [, word, ingredient] = numberWordOnly;
    return { quantity: NUMBER_WORDS[word.toLowerCase()], unit: '', ingredient: ingredient.trim() };
  }

  return { quantity: '', unit: '', ingredient: line };
}

/** Une ligne "ressemble" à un ingrédient si elle commence par une quantité
 * (chiffre ou nombre en toutes lettres), une fois puce/emoji retirés — utilisé
 * quand aucun en-tête "Ingrédients" n'est trouvé (photo de recette sans ce
 * repère textuel, fréquent avec l'OCR ou les recettes de livres). */
function looksLikeIngredientLine(line: string): boolean {
  const stripped = stripBulletAndEmoji(line);
  return /^\d/.test(stripped) || NUMBER_WORD_ONLY.test(stripped);
}

export interface ParsedCaption {
  title: string;
  ingredients: RecipeIngredient[];
  steps: string;
}

/**
 * Découpe une légende Instagram collée (ou un texte reconnu par OCR) en
 * titre / ingrédients / étapes. Repère d'abord les en-têtes "Ingrédients" /
 * "Étapes" ; si "Ingrédients" est absent, repère à la place les lignes qui
 * commencent par une quantité parmi ce qui précède "Étapes" (ou tout le
 * texte si aucun en-tête n'est trouvé) — le reste atterrit dans "steps"
 * pour édition manuelle.
 */
export function parseCaption(rawCaption: string): ParsedCaption {
  const lines = rawCaption
    .split('\n')
    .map((l) => l.replace(INVISIBLE_CHARS, '').trim())
    .filter((l) => l.length > 0 && !HASHTAG_LINE.test(l));

  if (lines.length === 0) {
    return { title: '', ingredients: [], steps: '' };
  }

  const title = stripBulletAndEmoji(lines[0]).slice(0, 200);

  const ingredientsStart = lines.findIndex((l) => INGREDIENTS_HEADER.test(l));
  const stepsStart = lines.findIndex((l) => STEPS_HEADER.test(l));

  let ingredientLines: string[];
  let stepLines: string[];

  if (ingredientsStart === -1) {
    const candidateLines = stepsStart === -1 ? lines.slice(1) : lines.slice(1, stepsStart);
    const afterCandidates = stepsStart === -1 ? [] : lines.slice(stepsStart + 1);
    ingredientLines = candidateLines.filter(looksLikeIngredientLine);
    stepLines = [...candidateLines.filter((l) => !looksLikeIngredientLine(l)), ...afterCandidates];
  } else {
    ingredientLines = lines.slice(
      ingredientsStart + 1,
      stepsStart > ingredientsStart ? stepsStart : undefined,
    );
    stepLines = stepsStart === -1 ? [] : lines.slice(stepsStart + 1);
  }

  const ingredients = ingredientLines
    .map(parseIngredientLine)
    .filter((i): i is RecipeIngredient => i !== null);

  return { title, ingredients, steps: stepLines.join('\n') };
}
