import type { NutritionTotals, Profile } from '../types';
import { ageFromBirthDate } from './dailyNeeds';

// Repères nutritionnels pour les enfants (1-17 ans), par tranche d'âge et
// sexe : apports recommandés américains (DRI, Institute of Medicine /
// National Academies — RDA ou AI selon le nutriment, limite 2019 pour le
// sodium). Ce sont des repères pour un enfant en bonne santé, pas une
// prescription : aucune notion de calories n'est affichée.
//
// Lipides : pas de valeur officielle en grammes — 35 % d'un besoin
// énergétique moyen pour l'âge (repère ANSES 35-40 % pour les 3-17 ans),
// saturés ≤ 10 %. Ce besoin moyen sert seulement à ce calcul, il n'est
// jamais montré.

type Sex = 'homme' | 'femme';
type Band = '1-3' | '4-8' | '9-13' | '14-17';

function band(age: number): Band | null {
  if (age < 1 || age >= 18) return null;
  if (age <= 3) return '1-3';
  if (age <= 8) return '4-8';
  if (age <= 13) return '9-13';
  return '14-17';
}

/** Valeur selon le sexe ; sexe inconnu → moyenne des deux. */
type BySex = number | { homme: number; femme: number };
function pick(v: BySex, sex: Sex | null): number {
  if (typeof v === 'number') return v;
  if (sex) return v[sex];
  return (v.homme + v.femme) / 2;
}

interface BandTable {
  energy: BySex; // interne, jamais affiché
  protein_g: BySex;
  carbs_g: BySex;
  fiber_g: BySex;
  omega3_g: BySex;
  omega6_g: BySex;
  calcium_mg: BySex;
  iron_mg: BySex;
  magnesium_mg: BySex;
  zinc_mg: BySex;
  potassium_mg: BySex;
  sodium_mg_max: BySex;
  vitamin_a_mcg: BySex;
  vitamin_c_mg: BySex;
  vitamin_d_mcg: BySex;
  vitamin_e_mg: BySex;
  vitamin_b12_mcg: BySex;
}

const TABLE: Record<Band, BandTable> = {
  '1-3': {
    energy: 1200,
    protein_g: 13,
    carbs_g: 130,
    fiber_g: 19,
    omega3_g: 0.7,
    omega6_g: 7,
    calcium_mg: 700,
    iron_mg: 7,
    magnesium_mg: 80,
    zinc_mg: 3,
    potassium_mg: 2000,
    sodium_mg_max: 1200,
    vitamin_a_mcg: 300,
    vitamin_c_mg: 15,
    vitamin_d_mcg: 15,
    vitamin_e_mg: 6,
    vitamin_b12_mcg: 0.9,
  },
  '4-8': {
    energy: { homme: 1500, femme: 1400 },
    protein_g: 19,
    carbs_g: 130,
    fiber_g: 25,
    omega3_g: 0.9,
    omega6_g: 10,
    calcium_mg: 1000,
    iron_mg: 10,
    magnesium_mg: 130,
    zinc_mg: 5,
    potassium_mg: 2300,
    sodium_mg_max: 1500,
    vitamin_a_mcg: 400,
    vitamin_c_mg: 25,
    vitamin_d_mcg: 15,
    vitamin_e_mg: 7,
    vitamin_b12_mcg: 1.2,
  },
  '9-13': {
    energy: { homme: 2000, femme: 1800 },
    protein_g: 34,
    carbs_g: 130,
    fiber_g: { homme: 31, femme: 26 },
    omega3_g: { homme: 1.2, femme: 1.0 },
    omega6_g: { homme: 12, femme: 10 },
    calcium_mg: 1300,
    iron_mg: 8,
    magnesium_mg: 240,
    zinc_mg: 8,
    potassium_mg: { homme: 2500, femme: 2300 },
    sodium_mg_max: 1800,
    vitamin_a_mcg: 600,
    vitamin_c_mg: 45,
    vitamin_d_mcg: 15,
    vitamin_e_mg: 11,
    vitamin_b12_mcg: 1.8,
  },
  '14-17': {
    energy: { homme: 2600, femme: 2000 },
    protein_g: { homme: 52, femme: 46 },
    carbs_g: 130,
    fiber_g: { homme: 38, femme: 26 },
    omega3_g: { homme: 1.6, femme: 1.1 },
    omega6_g: { homme: 16, femme: 11 },
    calcium_mg: 1300,
    iron_mg: { homme: 11, femme: 15 },
    magnesium_mg: { homme: 410, femme: 360 },
    zinc_mg: { homme: 11, femme: 9 },
    potassium_mg: { homme: 3000, femme: 2300 },
    sodium_mg_max: 2300,
    vitamin_a_mcg: { homme: 900, femme: 700 },
    vitamin_c_mg: { homme: 75, femme: 65 },
    vitamin_d_mcg: 15,
    vitamin_e_mg: 15,
    vitamin_b12_mcg: 2.4,
  },
};

export interface ChildNutrientTarget {
  key: keyof NutritionTotals;
  label: string;
  unit: string;
  target: number;
  /** 'min' : à atteindre (dépasser n'est pas un souci) ; 'max' : à ne pas
   * dépasser ; 'repere' : ordre de grandeur. */
  kind: 'min' | 'max' | 'repere';
}

export interface ChildTargets {
  ageBand: Band;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fat_saturated_max_g: number;
  fiber_g: number;
  omega3_g: number;
  omega6_g: number;
  /** Vitamines et minéraux, dans l'ordre d'affichage. */
  micros: ChildNutrientTarget[];
}

/** Repères du jour pour un profil de moins de 18 ans (null sinon). */
export function childTargets(profile: Pick<Profile, 'birth_date' | 'sex'> | null): ChildTargets | null {
  if (!profile?.birth_date) return null;
  const b = band(ageFromBirthDate(profile.birth_date));
  if (!b) return null;
  const t = TABLE[b];
  const sex = profile.sex;
  const energy = pick(t.energy, sex);
  const v = (x: BySex) => pick(x, sex);
  return {
    ageBand: b,
    protein_g: v(t.protein_g),
    carbs_g: v(t.carbs_g),
    fat_g: (energy * 0.35) / 9,
    fat_saturated_max_g: (energy * 0.1) / 9,
    fiber_g: v(t.fiber_g),
    omega3_g: v(t.omega3_g),
    omega6_g: v(t.omega6_g),
    micros: [
      { key: 'calcium_mg', label: 'Calcium', unit: 'mg', target: v(t.calcium_mg), kind: 'min' },
      { key: 'iron_mg', label: 'Fer', unit: 'mg', target: v(t.iron_mg), kind: 'min' },
      { key: 'magnesium_mg', label: 'Magnésium', unit: 'mg', target: v(t.magnesium_mg), kind: 'min' },
      { key: 'zinc_mg', label: 'Zinc', unit: 'mg', target: v(t.zinc_mg), kind: 'min' },
      { key: 'potassium_mg', label: 'Potassium', unit: 'mg', target: v(t.potassium_mg), kind: 'min' },
      { key: 'vitamin_a_mcg', label: 'Vitamine A', unit: 'µg', target: v(t.vitamin_a_mcg), kind: 'min' },
      { key: 'vitamin_c_mg', label: 'Vitamine C', unit: 'mg', target: v(t.vitamin_c_mg), kind: 'min' },
      { key: 'vitamin_d_mcg', label: 'Vitamine D', unit: 'µg', target: v(t.vitamin_d_mcg), kind: 'min' },
      { key: 'vitamin_e_mg', label: 'Vitamine E', unit: 'mg', target: v(t.vitamin_e_mg), kind: 'min' },
      { key: 'vitamin_b12_mcg', label: 'Vitamine B12', unit: 'µg', target: v(t.vitamin_b12_mcg), kind: 'min' },
      { key: 'sodium_mg', label: 'Sodium (maximum)', unit: 'mg', target: v(t.sodium_mg_max), kind: 'max' },
    ],
  };
}
