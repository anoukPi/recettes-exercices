// Valeurs MET (equivalent metabolique) issues du Compendium of Physical
// Activities (référence scientifique publique, régulièrement mise à jour).
// 1 MET = dépense énergétique au repos. La formule standard est :
// kcal = MET × poids(kg) × durée(heures) — une estimation, pas une mesure
// exacte (voir FR-31).
export const MET_VALUES: Record<string, number> = {
  'Marche modérée': 3.5,
  'Marche rapide': 4.3,
  'Course à pied (lente)': 8.3,
  'Course à pied (rapide)': 9.8,
  'Vélo modéré': 6.8,
  'Vélo intense': 10.0,
  'Natation modérée': 6.0,
  'Natation intense': 9.8,
  Yoga: 2.5,
  'Étirements': 2.3,
  'Musculation modérée': 3.5,
  'Musculation intense': 6.0,
  Danse: 4.8,
  Randonnée: 6.0,
  Football: 7.0,
  Tennis: 7.3,
  Basketball: 6.5,
  'HIIT / Circuit training': 8.0,
  Ski: 7.0,
};

// Utilisée quand l'activité saisie n'est pas dans la liste ci-dessus —
// une intensité générique "modérée", à ajuster si besoin.
export const DEFAULT_MET = 4.0;

export function metForActivity(activityType: string): number {
  return MET_VALUES[activityType] ?? DEFAULT_MET;
}

export function estimateCaloriesBurned(met: number, weightKg: number, durationMinutes: number): number {
  return met * weightKg * (durationMinutes / 60);
}
