// Ingrédients français courants dont le nom générique recouvre des aliments
// aux valeurs nutritionnelles très différentes — la recherche USDA sur le nom
// générique donnerait un résultat approximatif/arbitraire. On propose de
// préciser avant de chercher, plutôt que de laisser un choix USDA silencieux.
export const AMBIGUOUS_INGREDIENTS: Record<string, string[]> = {
  poulet: ['Blanc de poulet', 'Cuisse de poulet', 'Poulet pané', 'Aile de poulet', 'Poulet entier'],
  boeuf: ['Steak haché', 'Entrecôte', 'Bourguignon (à braiser)', 'Filet de bœuf', 'Bavette'],
  porc: ['Côte de porc', 'Filet mignon de porc', 'Poitrine de porc', 'Jambon', 'Rôti de porc'],
  fromage: ['Emmental', 'Comté', 'Chèvre', 'Mozzarella', 'Camembert', 'Fromage blanc', 'Feta'],
  riz: ['Riz blanc', 'Riz complet', 'Riz basmati', 'Riz rond'],
  pain: ['Pain blanc', 'Pain complet', 'Pain de seigle', 'Baguette'],
  saucisse: ['Saucisse de Toulouse', 'Chipolata', 'Saucisse fumée', 'Merguez'],
  yaourt: ['Yaourt nature', 'Yaourt grec', 'Yaourt aux fruits', 'Yaourt 0%'],
  lait: ['Lait entier', 'Lait demi-écrémé', 'Lait écrémé', 'Lait végétal (amande/soja/avoine)'],
  poisson: ['Saumon', 'Cabillaud', 'Thon', 'Truite', 'Poisson pané'],
};

export function disambiguationFor(name: string): string[] | null {
  return AMBIGUOUS_INGREDIENTS[name.trim().toLowerCase()] ?? null;
}
