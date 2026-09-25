import type { FitnessTestCategory } from '../types';

// Tests proposés par catégorie (demande d'Anouk, 25/09/2026) : faciles à
// faire seule à la maison avec une barre de traction et le sol, à refaire chaque mois dans les mêmes
// conditions pour que la tendance ait du sens. `better` sert à dire si la
// tendance va dans le bon sens.
export interface TestDefinition {
  /** Nom enregistré (test_name) — « Poids » garde le nom historique. */
  name: string;
  unit: string;
  how: string;
  better: 'plus' | 'moins' | 'neutre';
}

export interface TestCategory {
  value: FitnessTestCategory;
  label: string;
  intro: string;
  tests: TestDefinition[];
}

export const TEST_CATEGORIES: TestCategory[] = [
  {
    value: 'mesures',
    label: 'Mesures corporelles',
    intro: "Le matin à jeun, après être allée aux toilettes, mètre ruban bien à plat sans serrer.",
    tests: [
      { name: 'Poids', unit: 'kg', how: 'Même balance, même heure, sans vêtements ou presque.', better: 'neutre' },
      { name: 'Tour de taille', unit: 'cm', how: 'Au plus étroit, entre les côtes et le nombril.', better: 'neutre' },
      { name: 'Tour de ventre', unit: 'cm', how: 'Au niveau du nombril, ventre relâché.', better: 'neutre' },
      { name: 'Tour de hanches', unit: 'cm', how: 'Au plus large des fesses, pieds joints.', better: 'neutre' },
      { name: 'Tour de buste', unit: 'cm', how: 'Au niveau de la pointe des seins, bras le long du corps.', better: 'neutre' },
      { name: 'Tour de cuisse', unit: 'cm', how: 'Au plus large, en haut de la cuisse droite.', better: 'neutre' },
      { name: 'Tour de bras', unit: 'cm', how: "Au milieu entre l'épaule et le coude, bras relâché.", better: 'neutre' },
    ],
  },
  {
    value: 'force',
    label: 'Force',
    intro: "À la maison avec ta barre de traction et le sol. Échauffe-toi 5 minutes, arrête-toi quand la technique se dégrade.",
    tests: [
      { name: 'Tractions max', unit: 'répétitions', how: "D'affilée, départ bras tendus, menton au-dessus de la barre (avec élastique si besoin — note-le et garde la même aide).", better: 'plus' },
      { name: 'Suspension à la barre', unit: 's', how: 'Bras tendus, prise pronation, le plus longtemps possible.', better: 'plus' },
      { name: 'Pompes max', unit: 'répétitions', how: "D'affilée, poitrine proche du sol (sur les genoux si besoin — note-le et garde la même version).", better: 'plus' },
      { name: 'Gainage planche', unit: 's', how: 'Sur les avant-bras, corps aligné, jusqu’à ce que les hanches tombent.', better: 'plus' },
    ],
  },
  {
    value: 'souplesse',
    label: 'Souplesse',
    intro: "Échauffée, sans à-coups, garde la meilleure de 2 tentatives.",
    tests: [
      { name: 'Flexion avant assise', unit: 'cm', how: 'Assise jambes tendues, pieds contre un mur : distance doigts–pieds (négatif si tu ne les touches pas, positif au-delà).', better: 'plus' },
      { name: 'Mains dans le dos', unit: 'cm', how: "Une main par-dessus l'épaule, l'autre par le bas : écart entre les doigts (0 si elles se touchent).", better: 'moins' },
      { name: 'Genou au mur (cheville)', unit: 'cm', how: 'En fente, talon au sol, genou touchant le mur : distance max orteil–mur.', better: 'plus' },
    ],
  },
  {
    value: 'endurance',
    label: 'Endurance',
    intro: "À la maison, au calme et reposée — pas juste après une grosse séance.",
    tests: [
      { name: 'Pouls au repos', unit: 'bpm', how: 'Le matin au réveil, allongée, sur 60 secondes.', better: 'moins' },
      { name: 'Test de Ruffier', unit: 'indice', how: 'Calculé à partir de 3 pouls (voir ci-dessous) : plus il est bas, meilleure est ta récupération.', better: 'moins' },
      { name: 'Burpees en 3 min', unit: 'répétitions', how: 'Le plus possible en 3 minutes, poitrine au sol et saut bras tendus à chaque fois.', better: 'plus' },
      { name: 'Chaise contre le mur', unit: 's', how: 'Dos au mur, cuisses parallèles au sol, genoux à 90°, le plus longtemps possible.', better: 'plus' },
    ],
  },
];

export const RUFFIER_TEST_NAME = 'Test de Ruffier';

/** Indice de Ruffier : (P0 + P1 + P2 − 200) / 10, avec P0 = pouls au repos,
 * P1 = juste après 30 squats en 45 s, P2 = 1 minute après. < 0 très bon,
 * 0-5 bon, 5-10 moyen, 10-15 faible, > 15 à retravailler. */
export function ruffierIndex(p0: number, p1: number, p2: number): number {
  return Math.round(((p0 + p1 + p2 - 200) / 10) * 10) / 10;
}

export function definitionFor(testName: string): TestDefinition | undefined {
  for (const c of TEST_CATEGORIES) {
    const found = c.tests.find((t) => t.name.toLowerCase() === testName.trim().toLowerCase());
    if (found) return found;
  }
  return undefined;
}

// Rappel mensuel : au-delà de ce délai depuis le dernier test, l'app propose
// d'en refaire un à l'ouverture.
export const TEST_REMINDER_DAYS = 30;
