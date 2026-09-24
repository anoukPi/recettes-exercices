// Grandes familles d'aliments pour la page Comparer. Classement par début de
// nom (sans accents) plutôt que par liste fermée, pour que les ingrédients
// ajoutés à la main (« Skyr », « Filet sandre »…) tombent aussi dans la bonne
// famille. La première règle qui correspond gagne : l'ordre compte
// (« farine de riz » est une farine avant d'être du riz, « beurre de
// cacahuète » un oléagineux avant d'être une matière grasse).

export const FOOD_CATEGORIES = [
  'Céréales & féculents',
  'Farines',
  'Légumineuses',
  'Viandes',
  'Poissons & fruits de mer',
  'Œufs & produits laitiers',
  'Alternatives végétales',
  'Oléagineux & graines',
  'Fruits',
  'Légumes',
  'Matières grasses',
  'Sucres & sucré',
  'Condiments, épices & boissons',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

const RULES: [FoodCategory, string[]][] = [
  ['Farines', ['farine', 'fecule', 'chapelure', 'gomme de guar', 'psyllium']],
  ['Alternatives végétales', [
    'tofu', 'seitan', 'tempeh', 'lait de soja', "lait d amande", "lait d avoine", 'boisson coco', 'yaourt soja',
    'proteine', 'collagene', 'lait de coco', 'lait coco',
  ]],
  ['Oléagineux & graines', [
    'amande', 'poudre amande', 'poudre d amande', 'noisette', 'noix', 'cacahuete', 'pistache', 'pignon', 'graine', 'tahini',
    'beurre de cacahuete', 'puree cacahuete', 'noix de coco',
  ]],
  ['Sucres & sucré', [
    'sucre', 'miel', 'sirop', 'chocolat', 'pepite', 'cacao', 'pate a tartiner', 'confiture', 'lait concentre',
  ]],
  ['Matières grasses', ['huile', 'beurre', 'creme', 'mayonnaise', 'lard', 'mascarpone', 'vinaigrette']],
  ['Légumineuses', [
    'lentille', 'pois chiche', 'pois casse', 'haricot rouge', 'haricot blanc', 'haricots blancs', 'feve', 'aquafaba',
  ]],
  ['Céréales & féculents', [
    'riz', 'quinoa', 'pates', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'linguine', 'lasagne', 'tagliatelle',
    'nouilles', 'vermicelle', 'couscous', 'semoule', 'boulgour', 'epeautre', 'orge', 'sarrasin', 'avoine', 'flocons',
    'ble', 'mais en grain', 'pain', 'baguette', 'croissant', 'feuille de riz', 'pomme de terre', 'patate douce',
    'igname', 'manioc', 'chataigne', 'crepe', 'pate a', 'pate brisee', 'pate feuilletee', 'pate sablee', 'konjac',
  ]],
  ['Viandes', [
    'poulet', 'blanc de poulet', 'cuisse', 'aile de poulet', 'dinde', 'boeuf', 'bœuf', 'steak', 'entrecote',
    'bavette', 'filet de boeuf', 'bourguignon', 'roti', 'porc', 'cote de porc', 'filet mignon', 'poitrine',
    'jambon', 'bacon', 'pancetta', 'lardons', 'veau', 'escalope', 'agneau', 'gigot', 'mouton', 'canard', 'magret',
    'oie', 'pintade', 'lapin', 'saucisse', 'chipolata', 'saucisson', 'merguez', 'chorizo', 'chair a saucisse',
    'boudin', 'andouillette', 'foie gras', 'viande',
  ]],
  ['Poissons & fruits de mer', [
    'saumon', 'thon', 'cabillaud', 'colin', 'merlan', 'lieu', 'truite', 'sandre', 'filet sandre', 'maquereau',
    'sardine', 'hareng', 'anchois', 'bar', 'dorade', 'sole', 'limande', 'fletan', 'lotte', 'rouget', 'espadon',
    'morue', 'poisson', 'crevette', 'crabe', 'homard', 'langouste', 'langoustine', 'ecrevisse', 'moule', 'huitre',
    'palourde', 'saint jacques', 'calamar', 'encornet', 'seiche', 'poulpe', 'raie', 'oursin',
  ]],
  ['Œufs & produits laitiers', [
    'oeuf', 'œuf', "blanc d oeuf", "jaune d oeuf", 'lait', 'yaourt', 'skyr', 'fromage', 'faisselle', 'petit suisse',
    'emmental', 'comte', 'gruyere', 'parmesan', 'mozzarella', 'feta', 'ricotta', 'chevre', 'buche de chevre',
    'brie', 'camembert', 'roquefort',
  ]],
  // Avant Fruits/Légumes : « piment d'Espelette » est une épice, pas un légume.
  ['Condiments, épices & boissons', [
    'piment d espelette', 'piment de cayenne', 'sel', 'poivre', 'vinaigre', 'moutarde', 'ketchup', 'sauce', 'bouillon', 'pesto', 'harissa', 'tabasco',
    'nuoc mam', 'capres', 'levure', 'bicarbonate', 'poudre a lever', 'gelatine', 'agar', 'vanille', 'essence',
    'extrait', 'cannelle', 'cumin', 'curcuma', 'curry', 'paprika', 'muscade', 'herbes', 'thym', 'romarin', 'basilic',
    'persil', 'coriandre', 'menthe', 'aneth', 'ciboulette', 'origan', 'laurier', 'sauge', 'estragon', 'cerfeuil',
    'marjolaine', 'sarriette', 'safran', 'cardamome', 'clou', 'anis', 'fenugrec', 'quatre epices', 'zaatar',
    'wasabi', 'citronnelle', 'eau', 'cafe', 'matcha',
  ]],
  ['Fruits', [
    'abricot', 'ananas', 'avocat', 'banane', 'cassis', 'cerise', 'citron', 'clementine', 'coing', 'corossol', 'datte',
    'figue', 'fraise', 'framboise', 'fruit', 'goyave', 'grenade', 'groseille', 'kaki', 'kiwi', 'kumquat', 'litchi',
    'mandarine', 'mangue', 'melon', 'mirabelle', 'mure', 'myrtille', 'nectarine', 'orange', 'pamplemousse', 'papaye',
    'pasteque', 'peche', 'physalis', 'poire', 'pomme', 'prune', 'pruneau', 'quetsche', 'raisin', 'tamarin',
    'cranberries', 'rhubarbe', 'jus de citron', 'zeste', 'bergamote',
  ]],
  ['Légumes', [
    'ail', 'artichaut', 'asperge', 'aubergine', 'betterave', 'blette', 'brocoli', 'carotte', 'celeri', 'champignon',
    'chou', 'ciboule', 'bolet', 'citrouille', 'concombre', 'cornichon', 'courge', 'courgette', 'cresson',
    'echalote', 'endive', 'epinard', 'fenouil', 'gingembre', 'haricot', 'laitue', 'mais', 'navet', 'oignon', 'olive',
    'oseille', 'panais', 'petit pois', 'piment', 'poireau', 'pois mange tout', 'poivron', 'potimarron', 'potiron',
    'radis', 'raifort', 'roquette', 'rutabaga', 'salade', 'salsifis', 'tomate', 'topinambour', 'truffe', 'algues',
  ]],
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/['’-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_RULES = RULES.map(([category, prefixes]) => [category, prefixes.map(normalize)] as const);

/** Famille d'un aliment d'après son nom, ou null si aucune règle ne s'applique. */
export function categoryFor(name: string): FoodCategory | null {
  const n = normalize(name);
  for (const [category, prefixes] of NORMALIZED_RULES) {
    // Le nom commence par le mot-clé (ou son pluriel en -s) suivi d'une fin de
    // mot : « riz » → « riz basmati », « lentille » → « lentilles vertes », mais
    // « citron » ne capture pas « citronnelle ».
    if (prefixes.some((p) => n === p || n === `${p}s` || n.startsWith(`${p} `) || n.startsWith(`${p}s `))) {
      return category;
    }
  }
  return null;
}

// Nom de base pour l'IG : « riz basmati cuit » → « riz basmati », « pois
// chiches en conserve » → « pois chiches » (l'IG du guide ne distingue pas).
const GI_SUFFIXES = [' cuit', ' cuite', ' cuites', ' cuits', ' en conserve', ' secs', ' sec', ' seches', ' frais avec noyau'];

export function baseNameForGi(name: string): string {
  let n = name.trim().toLowerCase();
  for (const suffix of GI_SUFFIXES) {
    if (n.endsWith(suffix)) n = n.slice(0, -suffix.length);
  }
  return n;
}
