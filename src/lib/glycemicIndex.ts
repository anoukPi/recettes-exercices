// Indices glycémiques (échelle glucose = 100), repris du tableau de référence
// fourni par l'utilisatrice (guide "Pilote Automatique", classification par
// catégories d'aliments). Comme le rappelle ce document : l'IG varie d'une
// source à l'autre selon la variété, la maturité et la cuisson d'un aliment —
// à prendre comme un ordre de grandeur. Volontairement incomplet : les
// aliments sans IG bien établi (la plupart des viandes, poissons, corps gras,
// herbes et épices, dont les glucides sont nuls ou non significatifs) ne sont
// pas listés — leur charge glycémique est de toute façon nulle.
export const GI_VALUES: Record<string, number> = {
  // Légumes
  avocat: 10, artichaut: 20, asperge: 15, aubergine: 20, betterave: 65,
  blette: 15, brocoli: 15, carotte: 50, 'céleri branche': 15, 'céleri rave': 35,
  champignon: 15, 'champignon de paris': 15, 'champignon shiitake': 15,
  chou: 15, 'chou blanc': 15, 'chou chinois': 15, 'chou de bruxelles': 15,
  'chou frisé': 15, 'chou rouge': 15, 'chou-fleur': 15, citrouille: 70,
  concombre: 15, cornichon: 15, courge: 70, 'courge butternut': 70,
  'courge spaghetti': 70, courgette: 15, cresson: 15, échalote: 15,
  endive: 15, épinard: 15, fenouil: 15, ail: 30, haricot: 30,
  'haricot beurre': 15, 'haricot rouge': 35, 'haricot vert': 30, igname: 50,
  laitue: 15, maïs: 65, navet: 30, oignon: 15, 'oignon blanc': 15,
  'oignon jaune': 15, 'oignon rouge': 15, 'olive noire': 15, 'olive verte': 15,
  oseille: 15, panais: 85, 'patate douce': 50, 'petit pois': 35, poireau: 15,
  'pois mange-tout': 15, 'poivron jaune': 15, 'poivron rouge': 15,
  'poivron vert': 15, 'pomme de terre': 65, potimarron: 70, potiron: 70,
  radis: 15, 'radis noir': 15, roquette: 15, rutabaga: 70,
  'salade batavia': 15, 'salade iceberg': 15, 'salade romaine': 15,
  salsifis: 30, tomate: 30, 'tomate cerise': 30, topinambour: 50,

  // Fruits frais & séchés
  cassis: 15, rhubarbe: 15, citron: 20, 'citron vert': 20, cerise: 25,
  fraise: 25, framboise: 25, groseille: 25, mûre: 25, myrtille: 25,
  abricot: 30, pamplemousse: 30, mandarine: 40, 'fruit de la passion': 30,
  coing: 35, figue: 35, grenade: 35, pêche: 35, nectarine: 35, prune: 35,
  quetsche: 35, clémentine: 40, 'noix de coco': 40, pruneau: 40, pomme: 40,
  poire: 40, orange: 40, raisin: 45, banane: 50, kaki: 50, litchi: 50,
  mangue: 50, kiwi: 53, papaye: 55, ananas: 60, châtaigne: 60, melon: 65,
  pastèque: 76, datte: 70, 'raisin sec': 65,

  // Oléagineux & graines
  amandes: 15, noisettes: 15, 'noix de cajou': 15, noix: 15,
  'noix de pécan': 15, 'noix de macadamia': 15,
  pistaches: 15, 'pignons de pin': 15, cacahuètes: 25, 'graines de courge': 25,
  'graines de lin': 35, tahini: 25,

  // Légumineuses
  'pois cassés': 25, 'lentilles vertes': 25, 'lentilles corail': 30,
  'lentilles blondes': 30, 'pois chiches': 30,

  // Céréales, féculents, pâtes, pain
  spaghetti: 40, pâtes: 55, penne: 55, macaroni: 50, tagliatelles: 55,
  fusilli: 55, linguine: 55, nouilles: 65, vermicelle: 35, quinoa: 35,
  couscous: 65, semoule: 65, riz: 70, 'riz basmati': 50, 'riz complet': 50,
  'riz rond': 70, avoine: 40, "flocons d'avoine": 40, orge: 25,
  'orge perlé': 30, boulgour: 45, sarrasin: 40, épeautre: 35,
  farine: 75, 'farine complète': 60, 'farine de blé': 75,
  'farine de châtaigne': 65, 'farine de maïs': 70, 'farine de riz': 95,
  'farine de sarrasin': 40, 'fécule de maïs': 85, pain: 70,
  // Hors guide de référence (demandées par Anouk pour la page Comparer) :
  // valeurs courantes des tables d'IG françaises, même prudence que le reste.
  "farine de pois chiche": 35, "farine d'avoine": 45, 'farine de patate douce': 50,
  'pain complet': 65, 'pain de mie': 85, lasagne: 65,

  // Sucres, sucreries & condiments sucrés
  sucre: 70, 'sucre glace': 70, 'sucre roux': 70, 'sucre vanillé': 70,
  miel: 60, "sirop d'érable": 65, "sirop d'agave": 15, 'chocolat noir': 25,
  'chocolat au lait': 45, 'pâte à tartiner': 55, confiture: 65,
  ketchup: 50, 'sauce tomate': 40, 'sauce soja': 20,

  // Produits laitiers
  lait: 30, 'lait entier': 30, 'lait demi-écrémé': 30, "lait d'amande": 30,
  'lait de coco': 40, yaourt: 20, 'yaourt nature': 20, 'yaourt grec': 12,
  'fromage blanc': 20, 'petit-suisse': 20,

  // Protéines végétales
  tofu: 15, 'tofu fumé': 15,

  // Autres
  'levure de boulanger': 35, 'levure chimique': 35, levure: 35,
  moutarde: 35, 'moutarde à l\'ancienne': 35, 'vinaigre blanc': 5,
  'vinaigre de cidre': 5, 'vinaigre de vin': 5, 'vinaigre balsamique': 5,
};

export function giFor(ingredientName: string): number | null {
  const gi = GI_VALUES[ingredientName.trim().toLowerCase()];
  return gi ?? null;
}
