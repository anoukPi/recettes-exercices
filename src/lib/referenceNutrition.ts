import type { NutritionPer100g } from '../types';

// Valeurs de référence pour 100 g, pour les aliments dont l'équivalent USDA
// n'existe pas ou ne correspond pas au produit vendu en France/Suisse (fromage
// blanc, crème fraîche 30 %, yaourt « à la grecque »…). Ordres de grandeur
// CIQUAL / étiquettes courantes — seuls les nutriments connus sont renseignés,
// le reste reste null plutôt qu'inventé. Prioritaire sur l'USDA.
export interface ReferenceNutrition {
  label: string;
  values: Partial<NutritionPer100g>;
}

const ZERO: Partial<NutritionPer100g> = {
  calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0,
};

const FROMAGE_BLANC_3: ReferenceNutrition = {
  label: 'Fromage blanc nature 3 % MG',
  values: { calories_kcal: 73, protein_g: 7.4, carbs_g: 3.6, fat_g: 3.2, fat_saturated_g: 2.1, sugar_g: 3.6, calcium_mg: 110 },
};
const CREME_30: ReferenceNutrition = {
  label: 'Crème fraîche épaisse 30 % MG',
  values: { calories_kcal: 292, protein_g: 2.2, carbs_g: 2.8, fat_g: 30, fat_saturated_g: 20, sugar_g: 2.8, calcium_mg: 80 },
};
const LAIT_DEMI: ReferenceNutrition = {
  label: 'Lait demi-écrémé 1,5 % MG',
  values: { calories_kcal: 46, protein_g: 3.3, carbs_g: 4.8, fat_g: 1.6, fat_saturated_g: 1, sugar_g: 4.8, calcium_mg: 120, sodium_mg: 44 },
};
const JAMBON_CRU: ReferenceNutrition = {
  label: 'Jambon cru (type Serrano / Parme)',
  values: { calories_kcal: 240, protein_g: 26, carbs_g: 0.5, fat_g: 15, fat_saturated_g: 5, sodium_mg: 1900 },
};
const VIANDE_SECHEE: ReferenceNutrition = {
  label: 'Viande séchée (type viande des Grisons)',
  values: { calories_kcal: 180, protein_g: 38, carbs_g: 1, fat_g: 2.5, sodium_mg: 2000 },
};
const SUCRE_DATTE: ReferenceNutrition = {
  label: 'Sucre de datte (dattes séchées moulues)',
  values: { calories_kcal: 345, protein_g: 2.5, carbs_g: 80, fat_g: 0.4, fiber_g: 9, sugar_g: 70, potassium_mg: 800 },
};

export const REFERENCE_NUTRITION: Record<string, ReferenceNutrition> = {
  eau: { label: 'Eau', values: { ...ZERO, sodium_mg: 0 } },
  "eau de fleur d'oranger": { label: "Eau de fleur d'oranger", values: ZERO },

  'fromage blanc': FROMAGE_BLANC_3,
  'fromage blanc 3%': FROMAGE_BLANC_3,
  'fromage blanc 0%': {
    label: 'Fromage blanc nature 0 % MG',
    values: { calories_kcal: 47, protein_g: 7.9, carbs_g: 3.8, fat_g: 0.1, fat_saturated_g: 0.1, sugar_g: 3.8, calcium_mg: 120 },
  },
  'fromage blanc 7%': {
    label: 'Fromage blanc nature 7-8 % MG (40 % MG/ES)',
    values: { calories_kcal: 110, protein_g: 6.5, carbs_g: 3.2, fat_g: 7.8, fat_saturated_g: 5.2, sugar_g: 3.2, calcium_mg: 100 },
  },
  'yaourt à la grecque': {
    label: 'Yaourt nature « à la grecque » ~10 % MG',
    values: { calories_kcal: 128, protein_g: 3.3, carbs_g: 4.4, fat_g: 10.8, fat_saturated_g: 7.2, sugar_g: 4.4, calcium_mg: 110 },
  },

  'crème fraîche': CREME_30,
  'crème épaisse': CREME_30,
  'crème fraîche épaisse 30%': CREME_30,
  'crème fraîche légère 15%': {
    label: 'Crème fraîche légère 15 % MG',
    values: { calories_kcal: 162, protein_g: 2.8, carbs_g: 4, fat_g: 15, fat_saturated_g: 10, sugar_g: 4 },
  },
  'crème liquide légère 12%': {
    label: 'Crème liquide légère 12 % MG',
    values: { calories_kcal: 134, protein_g: 2.6, carbs_g: 4, fat_g: 12, fat_saturated_g: 8, sugar_g: 4 },
  },

  lait: LAIT_DEMI,
  'lait demi-écrémé': LAIT_DEMI,
  "lait d'avoine": {
    label: "Boisson à l'avoine nature",
    values: { calories_kcal: 46, protein_g: 1, carbs_g: 6.7, fat_g: 1.5, fat_saturated_g: 0.2, fiber_g: 0.8, sugar_g: 4 },
  },
  'boisson coco': {
    label: 'Boisson coco en brique (non sucrée)',
    values: { calories_kcal: 20, protein_g: 0.1, carbs_g: 2.7, fat_g: 0.9, fat_saturated_g: 0.9, sugar_g: 1.9 },
  },
  'lait de coco light': {
    label: 'Lait de coco allégé (conserve)',
    values: { calories_kcal: 75, protein_g: 0.7, carbs_g: 1.5, fat_g: 7.3, fat_saturated_g: 6.5, sugar_g: 1 },
  },

  mozzarella: {
    label: 'Mozzarella fraîche (lait de vache)',
    values: { calories_kcal: 247, protein_g: 18, carbs_g: 1, fat_g: 19, fat_saturated_g: 12.5, calcium_mg: 350, sodium_mg: 200 },
  },
  'mozzarella light': {
    label: 'Mozzarella fraîche allégée',
    values: { calories_kcal: 163, protein_g: 19, carbs_g: 1.5, fat_g: 9, fat_saturated_g: 6, calcium_mg: 400, sodium_mg: 200 },
  },
  'mozzarella di bufala': {
    label: 'Mozzarella di bufala',
    values: { calories_kcal: 288, protein_g: 17, carbs_g: 0.5, fat_g: 24, fat_saturated_g: 16, calcium_mg: 210 },
  },
  mascarpone: {
    label: 'Mascarpone',
    values: { calories_kcal: 430, protein_g: 4.5, carbs_g: 3.5, fat_g: 44, fat_saturated_g: 30, sugar_g: 3.5 },
  },

  'saumon fumé': {
    label: 'Saumon atlantique fumé',
    values: { calories_kcal: 180, protein_g: 22, carbs_g: 0, fat_g: 10, fat_saturated_g: 2, sodium_mg: 1100 },
  },
  'jambon cru': JAMBON_CRU,
  'jambon serrano': JAMBON_CRU,
  lardons: {
    label: 'Lardons fumés',
    values: { calories_kcal: 282, protein_g: 16, carbs_g: 0.5, fat_g: 24, fat_saturated_g: 9, sodium_mg: 1100 },
  },
  merguez: {
    label: 'Merguez crue',
    values: { calories_kcal: 298, protein_g: 15, carbs_g: 1, fat_g: 26, fat_saturated_g: 10, sodium_mg: 900 },
  },
  'viande séchée': VIANDE_SECHEE,
  'viande sechée': VIANDE_SECHEE,
  'viande des grisons': VIANDE_SECHEE,

  'farine de châtaigne': {
    label: 'Farine de châtaigne',
    values: { calories_kcal: 360, protein_g: 6, carbs_g: 70, fat_g: 3.7, fiber_g: 11, sugar_g: 20 },
  },
  'fécule de pomme de terre': {
    label: 'Fécule de pomme de terre',
    values: { calories_kcal: 335, protein_g: 0.1, carbs_g: 83, fat_g: 0.1, fiber_g: 0, sugar_g: 0 },
  },
  matcha: {
    label: 'Thé matcha en poudre',
    values: { calories_kcal: 324, protein_g: 29.6, carbs_g: 39.5, fat_g: 5.3, fiber_g: 38.5 },
  },
  aquafaba: {
    label: 'Aquafaba (jus de pois chiches en conserve)',
    values: { calories_kcal: 20, protein_g: 1.1, carbs_g: 3.3, fat_g: 0.3 },
  },
  'sucre datte': SUCRE_DATTE,
  'sucre de datte': SUCRE_DATTE,
};

export function referenceNutritionFor(name: string): ReferenceNutrition | null {
  return REFERENCE_NUTRITION[name.trim().toLowerCase()] ?? null;
}
