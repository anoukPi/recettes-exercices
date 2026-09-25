// Une entrée de repas « recette » stocke la fraction de la recette entière
// mangée (quantity : 0,25 = un quart). À l'écran, on parle en parts dès que
// la recette a un nombre de parts : 2 parts sur 8 = 0,25. Les entrées déjà
// notées gardent donc exactement les mêmes calories.

export function partsToFraction(parts: number, servings: number): number {
  return Math.round((parts / servings) * 10000) / 10000;
}

export function fractionToParts(fraction: number, servings: number): number {
  return Math.round(fraction * servings * 100) / 100;
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 2 });
}

export function formatPercentOfRecipe(fraction: number): string {
  const pct = fraction * 100;
  return `${pct.toLocaleString('fr-CH', { maximumFractionDigits: pct < 10 ? 1 : 0 })} %`;
}

/** « 2 parts sur 8 » si la recette a un nombre de parts, sinon « 25 % de la recette ». */
export function describeRecipeQuantity(fraction: number, servings: number | null | undefined): string {
  if (servings) {
    const parts = fractionToParts(fraction, servings);
    return `${formatNumber(parts)} part${parts > 1 ? 's' : ''} sur ${servings}`;
  }
  return `${formatPercentOfRecipe(fraction)} de la recette`;
}
