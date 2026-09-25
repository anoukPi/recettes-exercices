// Poids moyen (en grammes) d'"1 pièce"/"1 unité" standard, pour les ingrédients
// où ça a du sens (un oeuf, une banane, un blanc de poulet...). Ce sont des
// moyennes générales — la vraie taille d'une pièce varie beaucoup en pratique.
export const PIECE_WEIGHTS_G: Record<string, number> = {
  // Viandes & poissons (portion individuelle typique)
  'blanc de poulet': 150,
  'cuisse de poulet': 120,
  'escalope de veau': 120,
  'steak haché': 125,
  'côte de porc': 150,
  saucisse: 75,
  merguez: 50,
  'magret de canard': 200,
  saumon: 150,
  thon: 150,
  truite: 200,
  crevette: 10,
  'saint-jacques': 30,
  huître: 15,
  moule: 10,

  // Oeufs & laitages
  oeuf: 50,
  "blanc d'oeuf": 33,
  "jaune d'oeuf": 17,
  yaourt: 125,
  'yaourt nature': 125,
  'yaourt grec': 150,

  // Fruits
  banane: 120,
  pomme: 180,
  poire: 160,
  orange: 130,
  citron: 60,
  'citron vert': 65,
  pêche: 150,
  nectarine: 140,
  abricot: 40,
  kiwi: 75,
  mandarine: 75,
  clémentine: 70,
  pamplemousse: 250,
  figue: 50,
  datte: 8,
  pruneau: 10,
  'pruneau sec': 10,
  'pruneau frais avec noyau': 40, // pesé entier, noyau compris (déduit dans le calcul)
  prune: 40,
  kaki: 170,
  grenade: 250,
  mangue: 200,
  avocat: 200,
  ananas: 900,
  melon: 1200,
  pastèque: 4000,

  // Légumes
  tomate: 120,
  'tomate cerise': 15,
  oignon: 110,
  'oignon rouge': 110,
  'oignon blanc': 90,
  'oignon jaune': 110,
  échalote: 25,
  'pomme de terre': 150,
  'patate douce': 130,
  courgette: 200,
  aubergine: 250,
  concombre: 300,
  'poivron rouge': 180,
  'poivron vert': 160,
  'poivron jaune': 180,
  carotte: 60,
  navet: 90,
  betterave: 100,
  panais: 100,
  'champignon de paris': 15,
  radis: 10,
  poireau: 150,
  artichaut: 120,
  'chou-fleur': 600,
  chou: 900,
  brocoli: 400,
  fenouil: 150,
  'pâte à gâteau': 230,
  'pâte à tarte': 230,
  'pâte brisée': 230,
  'pâte feuilletée': 230,
  'pâte sablée': 230,
  baguette: 250,
  'baguette pain blanc': 250,
  'feuille de riz': 9,
  // Produits préparés (USDA : 1 bâtonnet ≈ 28 g, 1 donut moyen ≈ 60 g)
  'poisson pané': 28,
  'poissons panés': 28,
  'bâtonnet de poisson': 28,
  'bâtonnets de poisson': 28,
  donut: 60,
  donuts: 60,
  'donut chocolat': 60,
  'donuts chocolat': 60,
  'donut au chocolat': 60,
};

// Poids qui dépendent à la fois de l'unité ET de l'ingrédient — un "sachet" ou
// une "boîte" n'a pas du tout le même poids selon ce qu'il contient. Clé :
// "unité:ingrédient" (en minuscules).
export const UNIT_INGREDIENT_WEIGHTS_G: Record<string, number> = {
  'cube:épinard congelé': 18,

  'sachet:levure': 11,
  'sachet:levure chimique': 11,
  'sachet:levure de boulanger': 7,
  'sachet:sucre vanillé': 7.5,
  'sachet:agar-agar': 2,
  'sachet:thé': 2,

  'boîte:tomate': 400,
  'boîte:thon': 140,
  'boîte:maïs': 140,
  'boîte:lait de coco': 400,
  'boîte:lait concentré': 397,
  'boîte:pois chiches': 240,
  'boîte:haricot rouge': 240,
  'boîte:lentilles corail': 240,
  'boîte:petit pois': 265,

  'botte:radis': 150,
  'botte:persil': 100,
  'botte:asperge': 500,
  'botte:oignon': 200,
  'botte:carotte': 400,

  'feuille:laurier': 0.2,
  'feuille:basilic': 0.3,
  'feuille:menthe': 0.2,
  'feuille:salade batavia': 15,
  'feuille:salade iceberg': 15,
  'feuille:salade romaine': 15,
  'feuille:endive': 10,

  'brin:thym': 1,
  'brin:romarin': 2,
  'brin:persil': 3,
  'brin:menthe': 1,
  'brin:coriandre': 2,
  'brin:aneth': 1,
  'brin:estragon': 1,
};

export function pieceWeight(ingredientName: string, unit?: string): number | null {
  const name = ingredientName.trim().toLowerCase();
  if (unit) {
    const specific = UNIT_INGREDIENT_WEIGHTS_G[`${unit.trim().toLowerCase()}:${name}`];
    if (specific !== undefined) return specific;
  }
  return PIECE_WEIGHTS_G[name] ?? null;
}
