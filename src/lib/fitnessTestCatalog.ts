import type { FitnessTestCategory } from '../types';

// Tests proposés par catégorie (demande d'Anouk, 25/09/2026) : faciles à
// faire seule à la maison avec une barre de traction et le sol, à refaire chaque mois dans les mêmes
// conditions pour que la tendance ait du sens. `better` sert à dire si la
// tendance va dans le bon sens.
/** Illustration d'un test : image ou vidéo sous licence libre trouvée sur
 * Wikimedia Commons, copiée dans public/tests (pas de dépendance au site ni
 * fuite d'adresse IP) — auteur + licence + lien d'origine affichés, comme
 * l'exigent CC BY / BY-SA ; ou schéma dessiné pour Kaly quand rien de libre
 * n'existait. */
export type TestIllustration =
  | { kind: 'image'; src: string; page: string; credit: string }
  | { kind: 'video'; src: string; poster: string; page: string; credit: string }
  | { kind: 'drawing'; drawing: 'suspension' | 'genou-mur' | 'chaise' };

export interface TestDefinition {
  /** Nom enregistré (test_name) — « Poids » garde le nom historique. */
  name: string;
  unit: string;
  how: string;
  better: 'plus' | 'moins' | 'neutre';
  illustration?: TestIllustration;
}

const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/File:';

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
      { name: 'Tractions max', unit: 'répétitions', how: "D'affilée, départ bras tendus, menton au-dessus de la barre (avec élastique si besoin — note-le et garde la même aide).", better: 'plus', illustration: { kind: 'image', src: '/tests/Girl_doing_pull_up_top_position.jpg', page: `${COMMONS_FILE}Girl_doing_pull_up_top_position.jpg`, credit: 'PTPioneer, CC BY 2.0' } },
      { name: 'Suspension à la barre', unit: 's', how: 'Bras tendus, prise pronation, le plus longtemps possible.', better: 'plus', illustration: { kind: 'drawing', drawing: 'suspension' } },
      { name: 'Pompes max', unit: 'répétitions', how: "D'affilée, poitrine proche du sol (sur les genoux si besoin — note-le et garde la même version).", better: 'plus', illustration: { kind: 'image', src: '/tests/Push-up-2.png', page: `${COMMONS_FILE}Push-up-2.png`, credit: 'Everkinetic, CC BY-SA 3.0' } },
      { name: 'Gainage planche', unit: 's', how: 'Sur les avant-bras, corps aligné, jusqu’à ce que les hanches tombent.', better: 'plus', illustration: { kind: 'image', src: '/tests/Plank.jpg', page: `${COMMONS_FILE}Plank.jpg`, credit: 'Jaykayfit, CC BY-SA 3.0' } },
    ],
  },
  {
    value: 'souplesse',
    label: 'Souplesse',
    intro: "Échauffée, sans à-coups, garde la meilleure de 2 tentatives.",
    tests: [
      { name: 'Flexion avant assise', unit: 'cm', how: 'Assise jambes tendues, pieds contre un mur : distance doigts–pieds (négatif si tu ne les touches pas, positif au-delà).', better: 'plus', illustration: { kind: 'image', src: '/tests/Paschimotanasana_Yoga-Asana_Nina-Mel.jpg', page: `${COMMONS_FILE}Paschimotanasana_Yoga-Asana_Nina-Mel.jpg`, credit: 'Kennguru, CC BY 3.0' } },
      { name: 'Mains dans le dos', unit: 'cm', how: "Une main par-dessus l'épaule, l'autre par le bas : écart entre les doigts (0 si elles se touchent).", better: 'moins', illustration: { kind: 'image', src: '/tests/Gomukhasana_Yoga-Asana_Nina-Mel.jpg', page: `${COMMONS_FILE}Gomukhasana_Yoga-Asana_Nina-Mel.jpg`, credit: 'Kennguru, CC BY 3.0 (posture de yoga « tête de vache » : même position des bras)' } },
      { name: 'Genou au mur (cheville)', unit: 'cm', how: 'En fente, talon au sol, genou touchant le mur : distance max orteil–mur.', better: 'plus', illustration: { kind: 'drawing', drawing: 'genou-mur' } },
    ],
  },
  {
    value: 'endurance',
    label: 'Endurance',
    intro: "À la maison, au calme et reposée — pas juste après une grosse séance.",
    tests: [
      { name: 'Pouls au repos', unit: 'bpm', how: 'Le matin au réveil, allongée, sur 60 secondes.', better: 'moins', illustration: { kind: 'image', src: '/tests/Measurement_of_radial_pulse.jpg', page: `${COMMONS_FILE}Measurement_of_radial_pulse.jpg`, credit: 'Pöllö, CC BY 3.0' } },
      { name: 'Test de Ruffier', unit: 'indice', how: 'Calculé à partir de 3 pouls (voir ci-dessous) : plus il est bas, meilleure est ta récupération.', better: 'moins', illustration: { kind: 'image', src: '/tests/Exercise_Chair_Squat.png', page: `${COMMONS_FILE}Exercise_Chair_Squat.png`, credit: 'BruceBlaus, CC BY-SA 4.0 (le mouvement de squat, sans chaise pour le test)' } },
      { name: 'Burpees en 3 min', unit: 'répétitions', how: 'Le plus possible en 3 minutes, poitrine au sol et saut bras tendus à chaque fois.', better: 'plus', illustration: { kind: 'video', src: '/tests/Burpee_How_To.webm', poster: '/tests/Burpee_5_Thrust.jpg', page: `${COMMONS_FILE}Burpee_How_To.webm`, credit: 'Gyglim, CC BY-SA 3.0' } },
      { name: 'Chaise contre le mur', unit: 's', how: 'Dos au mur, cuisses parallèles au sol, genoux à 90°, le plus longtemps possible.', better: 'plus', illustration: { kind: 'drawing', drawing: 'chaise' } },
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
