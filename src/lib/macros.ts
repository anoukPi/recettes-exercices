export type DominantMacro = 'proteines' | 'glucides' | 'lipides';

/** Macronutriment qui apporte le plus de calories (en % des kcal), ou null. */
export function dominantMacro(proteinPct: number, carbsPct: number, fatPct: number): DominantMacro | null {
  const max = Math.max(proteinPct, carbsPct, fatPct);
  if (!(max > 0)) return null;
  if (max === proteinPct) return 'proteines';
  if (max === carbsPct) return 'glucides';
  return 'lipides';
}
