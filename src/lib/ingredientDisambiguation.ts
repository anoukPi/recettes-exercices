// Ingrédients français courants dont le nom générique recouvre des aliments
// aux valeurs nutritionnelles très différentes — la recherche USDA sur le nom
// générique donnerait un résultat approximatif/arbitraire. On propose de
// préciser avant de chercher, plutôt que de laisser un choix USDA silencieux.
// Chaque variante doit avoir une source nutritionnelle (ingredientPins.ts,
// referenceNutrition.ts ou ingredientTranslations.ts) — vérifié par
// scripts/refresh-nutrition.mjs.
export const AMBIGUOUS_INGREDIENTS: Record<string, string[]> = {
  poulet: ['Blanc de poulet', 'Cuisse de poulet', 'Cuisse de poulet sans peau', 'Poulet pané', 'Aile de poulet', 'Poulet entier'],
  'cuisse de poulet': ['Cuisse de poulet', 'Cuisse de poulet sans peau'],
  boeuf: ['Steak haché 5%', 'Steak haché 15%', 'Entrecôte', 'Bourguignon (à braiser)', 'Filet de bœuf', 'Bavette'],
  'steak haché': ['Steak haché 5%', 'Steak haché 10%', 'Steak haché 15%', 'Steak haché 20%'],
  'boeuf haché': ['Steak haché 5%', 'Steak haché 10%', 'Steak haché 15%', 'Steak haché 20%'],
  'bœuf haché': ['Steak haché 5%', 'Steak haché 10%', 'Steak haché 15%', 'Steak haché 20%'],
  porc: ['Côte de porc', 'Filet mignon de porc', 'Poitrine de porc', 'Jambon blanc', 'Rôti de porc'],
  saucisse: ['Saucisse de Toulouse', 'Chipolata', 'Saucisse fumée', 'Merguez'],
  poisson: ['Saumon', 'Cabillaud', 'Thon', 'Truite', 'Poisson pané'],
  saumon: ["Saumon d'élevage", 'Saumon sauvage', 'Saumon fumé'],
  thon: ['Thon au naturel', "Thon à l'huile", 'Thon frais'],

  fromage: ['Emmental', 'Comté', 'Chèvre', 'Mozzarella', 'Camembert', 'Fromage blanc', 'Feta'],
  chèvre: ['Chèvre frais', 'Bûche de chèvre', 'Chèvre sec'],
  'fromage de chèvre': ['Chèvre frais', 'Bûche de chèvre', 'Chèvre sec'],
  mozzarella: ['Mozzarella', 'Mozzarella light', 'Mozzarella di bufala'],
  'fromage blanc': ['Fromage blanc 0%', 'Fromage blanc 3%', 'Fromage blanc 7%'],
  yaourt: ['Yaourt nature', 'Yaourt grec', 'Yaourt aux fruits', 'Yaourt 0%'],
  'yaourt grec': ['Yaourt grec', 'Yaourt grec 0%', 'Yaourt à la grecque'],
  'crème fraîche': ['Crème fraîche épaisse 30%', 'Crème fraîche légère 15%', 'Crème fraîche liquide', 'Crème liquide légère 12%'],
  lait: ['Lait entier', 'Lait demi-écrémé', 'Lait écrémé', "Lait d'amande", 'Lait de soja', "Lait d'avoine"],
  'lait de coco': ['Lait de coco', 'Lait de coco light', 'Boisson coco'],

  riz: ['Riz blanc', 'Riz complet', 'Riz basmati', 'Riz rond', 'Riz cuit', 'Riz complet cuit'],
  'riz basmati': ['Riz basmati', 'Riz basmati cuit'],
  pâtes: ['Pâtes', 'Pâtes cuites'],
  quinoa: ['Quinoa', 'Quinoa cuit'],
  lentilles: ['Lentilles vertes', 'Lentilles corail', 'Lentilles cuites'],
  'pois chiches': ['Pois chiches en conserve', 'Pois chiches secs'],
  'haricot blanc': ['Haricots blancs en conserve', 'Haricots blancs secs'],
  pain: ['Pain blanc', 'Pain complet', 'Pain de seigle', 'Baguette', 'Pain de mie'],
  maïs: ['Maïs doux', 'Maïs en grain (sec)'],

  'chocolat noir': ['Chocolat noir 50%', 'Chocolat noir 60%', 'Chocolat noir 70%', 'Chocolat noir 85%'],
  'noix de coco': ['Noix de coco râpée', 'Noix de coco fraîche'],
  tofu: ['Tofu ferme', 'Tofu soyeux', 'Tofu fumé'],
  levure: ['Levure chimique', 'Levure fraîche', 'Levure sèche'],
  citron: ['Citron', 'Jus de citron', 'Zeste de citron'],
};

export function disambiguationFor(name: string): string[] | null {
  return AMBIGUOUS_INGREDIENTS[name.trim().toLowerCase()] ?? null;
}
