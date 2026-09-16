// La base USDA FoodData Central est indexée en anglais uniquement.
// Cette table traduit nos noms d'ingrédients français vers un terme de
// recherche anglais, pour permettre le calcul nutritionnel.
// Clés en minuscules — la recherche se fait insensible à la casse.
export const INGREDIENT_EN: Record<string, string> = {
  // Légumes
  ail: 'garlic', artichaut: 'artichoke', asperge: 'asparagus', aubergine: 'eggplant',
  betterave: 'beet', blette: 'chard', brocoli: 'broccoli', carotte: 'carrot',
  'céleri branche': 'celery', 'céleri rave': 'celeriac', 'champignon de paris': 'button mushroom',
  'champignon shiitake': 'shiitake mushroom', châtaigne: 'chestnut', chou: 'cabbage',
  'chou blanc': 'white cabbage', 'chou chinois': 'chinese cabbage',
  'chou de bruxelles': 'brussels sprouts', 'chou frisé': 'kale', 'chou rouge': 'red cabbage',
  'chou-fleur': 'cauliflower', ciboule: 'scallion', citrouille: 'pumpkin', concombre: 'cucumber',
  cornichon: 'pickle', 'courge butternut': 'butternut squash', 'courge spaghetti': 'spaghetti squash',
  courgette: 'zucchini', cresson: 'watercress', échalote: 'shallot', endive: 'endive',
  épinard: 'spinach', 'épinard congelé': 'spinach frozen', fenouil: 'fennel', gingembre: 'ginger', 'haricot beurre': 'wax bean',
  'haricot rouge': 'kidney bean', 'haricot vert': 'green bean', igname: 'yam', laitue: 'lettuce',
  maïs: 'corn', manioc: 'cassava', navet: 'turnip', oignon: 'onion', 'oignon blanc': 'white onion',
  'oignon jaune': 'yellow onion', 'oignon rouge': 'red onion', 'olive noire': 'black olive',
  'olive verte': 'green olive', oseille: 'sorrel', panais: 'parsnip', 'patate douce': 'sweet potato',
  'persil plat': 'flat leaf parsley', 'petit pois': 'green peas', piment: 'chili pepper',
  'piment doux': 'sweet pepper', poireau: 'leek', 'pois mange-tout': 'snow peas',
  'poivron jaune': 'sweet pepper yellow raw', 'poivron rouge': 'sweet pepper red raw',
  'poivron vert': 'sweet pepper green raw', 'pomme de terre': 'potato flesh and skin raw', potimarron: 'red kuri squash',
  potiron: 'pumpkin', radis: 'radish', 'radis noir': 'black radish', raifort: 'horseradish',
  rhubarbe: 'rhubarb', roquette: 'arugula', rutabaga: 'rutabaga', 'salade batavia': 'batavia lettuce',
  'salade iceberg': 'iceberg lettuce', 'salade romaine': 'romaine lettuce', salsifis: 'salsify',
  tomate: 'tomatoes red ripe raw', 'tomate cerise': 'cherry tomato', topinambour: 'jerusalem artichoke',
  truffe: 'truffle',

  // Fruits
  abricot: 'apricot', ananas: 'pineapple', avocat: 'avocado', banane: 'banana',
  bergamote: 'bergamot', cassis: 'black currant', cerise: 'cherry', citron: 'lemon',
  'citron vert': 'lime', clémentine: 'clementine', coing: 'quince', corossol: 'soursop',
  datte: 'date', figue: 'fig', fraise: 'strawberry', framboise: 'raspberry',
  'fruit de la passion': 'passion fruit', goyave: 'guava', grenade: 'pomegranate',
  groseille: 'red currant', kaki: 'persimmon', kiwi: 'kiwi', kumquat: 'kumquat',
  litchi: 'lychee', mandarine: 'mandarin orange', mangue: 'mango', 'mangue séchée': 'mango dried',
  'mangue sechée': 'mango dried', melon: 'melon',
  mirabelle: 'mirabelle plum', mûre: 'blackberry', myrtille: 'blueberry', nectarine: 'nectarine',
  'noix de coco': 'coconut', orange: 'orange', pamplemousse: 'grapefruit', papaye: 'papaya',
  pastèque: 'watermelon', pêche: 'peach', physalis: 'ground cherry', poire: 'pear',
  pomme: 'apple', prune: 'plum', pruneau: 'prune', quetsche: 'damson plum', raisin: 'grape',
  'raisin sec': 'raisin', tamarin: 'tamarind',

  // Viandes
  agneau: 'lamb', andouillette: 'andouillette sausage', bacon: 'bacon',
  'blanc de poulet': 'chicken breast boneless skinless', 'boeuf haché': 'ground beef', 'boudin noir': 'blood sausage',
  canard: 'duck', 'chair à saucisse': 'sausage meat', chorizo: 'chorizo',
  'côte de porc': 'pork chop', 'cuisse de poulet': 'chicken thigh', dinde: 'turkey',
  entrecôte: 'ribeye steak', 'escalope de veau': 'veal cutlet', 'foie gras': 'foie gras',
  "gigot d'agneau": 'leg of lamb', 'jambon blanc': 'ham', 'jambon cru': 'prosciutto',
  'jambon serrano': 'serrano ham', lapin: 'rabbit', lard: 'pork fat', lardons: 'bacon bits',
  'magret de canard': 'duck breast', merguez: 'merguez sausage', mouton: 'mutton', oie: 'goose',
  pancetta: 'pancetta', pintade: 'guinea fowl', porc: 'pork', poulet: 'chicken',
  'rôti de boeuf': 'beef roast', saucisse: 'sausage', saucisson: 'dry sausage',
  'steak haché': 'ground beef patty', veau: 'veal',

  // Poissons & fruits de mer
  anchois: 'anchovy', bar: 'sea bass', cabillaud: 'cod', calamar: 'squid', colin: 'hake',
  crabe: 'crab', crevette: 'shrimp', dorade: 'sea bream', écrevisse: 'crayfish',
  encornet: 'squid', espadon: 'swordfish', flétan: 'halibut', hareng: 'herring',
  homard: 'lobster', huître: 'oyster', langouste: 'spiny lobster', langoustine: 'langoustine',
  lieu: 'pollock', limande: 'lemon sole', lotte: 'monkfish', maquereau: 'mackerel',
  merlan: 'whiting', morue: 'salted cod', moule: 'mussel', oursin: 'sea urchin',
  palourde: 'clam', poulpe: 'octopus', raie: 'skate', rouget: 'red mullet',
  'saint-jacques': 'scallop', sardine: 'sardine', saumon: 'salmon', 'saumon fumé': 'smoked salmon',
  sandre: 'walleye', seiche: 'cuttlefish', 'filet sandre': 'walleye',
  sole: 'sole', thon: 'tuna', truite: 'trout',

  // Produits laitiers & oeufs
  beurre: 'butter', 'beurre demi-sel': 'salted butter', "blanc d'oeuf": 'egg white',
  brie: 'brie cheese', camembert: 'camembert cheese', chèvre: 'goat cheese', comté: 'comte cheese',
  'crème épaisse': 'heavy cream', 'crème fraîche': 'sour cream',
  'crème fraîche liquide': 'liquid cream', emmental: 'emmental cheese', faisselle: 'cottage cheese',
  feta: 'feta cheese', 'fromage blanc': 'quark cheese', 'fromage de chèvre': 'goat cheese',
  'fromage râpé': 'shredded cheese', gruyère: 'gruyere cheese', "jaune d'oeuf": 'egg yolk',
  lait: 'milk', 'lait concentré': 'condensed milk', 'lait de coco': 'coconut milk',
  "lait d'amande": 'almond milk', 'lait demi-écrémé': 'semi skimmed milk',
  'lait entier': 'milk whole 3.25',
  'lait ribot': 'buttermilk', mascarpone: 'mascarpone', mozzarella: 'mozzarella', oeuf: 'egg whole',
  parmesan: 'parmesan grated', 'petit-suisse': 'fromage frais', ricotta: 'ricotta',
  roquefort: 'roquefort cheese', yaourt: 'yogurt', 'yaourt grec': 'greek yogurt',
  'yaourt nature': 'plain yogurt',

  // Féculents & céréales
  avoine: 'oats regular quick not fortified dry', blé: 'wheat', boulgour: 'bulgur', couscous: 'couscous', épeautre: 'spelt',
  farine: 'flour', 'farine complète': 'whole wheat flour', 'farine de blé': 'wheat flour',
  'farine de châtaigne': 'chestnut flour', 'farine de maïs': 'corn flour',
  'farine de riz': 'rice flour', 'farine de sarrasin': 'buckwheat flour',
  "flocons d'avoine": 'oatmeal', fusilli: 'fusilli pasta', lasagne: 'lasagna',
  'lentilles blondes': 'yellow lentils', 'lentilles corail': 'red lentils',
  'lentilles vertes': 'green lentils', linguine: 'linguine', macaroni: 'macaroni',
  nouilles: 'noodles', orge: 'barley', 'orge perlé': 'pearl barley', pain: 'bread',
  'pain complet': 'whole wheat bread', 'pain de mie': 'sandwich bread', pâtes: 'pasta',
  penne: 'penne pasta', 'pois cassés': 'split peas', 'pois chiches': 'chickpeas',
  quinoa: 'quinoa', riz: 'white rice', 'riz basmati': 'basmati rice',
  'riz complet': 'brown rice long-grain raw',
  'riz rond': 'short grain rice', sarrasin: 'buckwheat', semoule: 'semolina',
  spaghetti: 'spaghetti', tagliatelles: 'tagliatelle', vermicelle: 'vermicelli',

  // Épices & herbes
  aneth: 'dill', 'anis étoilé': 'star anise', basilic: 'basil', cannelle: 'cinnamon',
  cardamome: 'cardamom', cerfeuil: 'chervil', ciboulette: 'chives', citronnelle: 'lemongrass',
  'clou de girofle': 'clove', coriandre: 'coriander', cumin: 'cumin', curcuma: 'turmeric',
  curry: 'curry powder', estragon: 'tarragon', fenugrec: 'fenugreek',
  'herbes de provence': 'herbes de provence', laurier: 'bay leaf', marjolaine: 'marjoram',
  menthe: 'mint', muscade: 'nutmeg', origan: 'oregano', paprika: 'paprika', persil: 'parsley',
  'piment de cayenne': 'cayenne pepper', "piment d'espelette": 'espelette pepper',
  'poivre blanc': 'white pepper', 'poivre noir': 'black pepper', 'poivre rose': 'pink peppercorn',
  'quatre-épices': 'allspice', romarin: 'rosemary', safran: 'saffron', sarriette: 'savory',
  sauge: 'sage', sel: 'salt', 'sel fin': 'fine salt', 'sel de mer': 'sea salt', thym: 'thyme',
  vanille: 'vanilla', wasabi: 'wasabi', zaatar: "za'atar",

  // Condiments, sauces & huiles
  'bouillon de boeuf': 'beef broth', 'bouillon de légumes': 'vegetable broth',
  'bouillon de poulet': 'chicken broth', câpres: 'capers', harissa: 'harissa',
  "huile d'arachide": 'peanut oil', 'huile de colza': 'canola oil', 'huile de noix': 'walnut oil',
  'huile de sésame': 'sesame oil', 'huile de tournesol': 'sunflower oil',
  "huile d'olive": 'olive oil', ketchup: 'ketchup', mayonnaise: 'mayonnaise', miel: 'honey',
  moutarde: 'mustard prepared yellow', "moutarde à l'ancienne": 'whole grain mustard', 'nuoc-mâm': 'fish sauce',
  pesto: 'pesto', 'sauce barbecue': 'barbecue sauce', 'sauce hoisin': 'hoisin sauce',
  'sauce soja': 'soy sauce', 'sauce tomate': 'tomato sauce',
  'sauce worcestershire': 'worcestershire sauce', "sirop d'agave": 'agave syrup',
  "sirop d'érable": 'maple syrup', tabasco: 'hot sauce', tahini: 'tahini',
  'vinaigre balsamique': 'balsamic vinegar', 'vinaigre blanc': 'white vinegar',
  'vinaigre de cidre': 'cider vinegar', 'vinaigre de vin': 'wine vinegar', vinaigrette: 'vinaigrette',

  // Fruits secs, oléagineux & sucré
  amandes: 'almonds', cacahuètes: 'peanuts', cacao: 'cocoa', 'chocolat au lait': 'milk chocolate',
  'chocolat blanc': 'white chocolate', 'chocolat noir': 'dark chocolate',
  'graines de chia': 'chia seeds', 'graines de courge': 'pumpkin seeds',
  'graines de lin': 'flax seeds', 'graines de pavot': 'poppy seeds',
  'graines de sésame': 'sesame seeds', gélatine: 'gelatin', levure: 'yeast',
  'levure chimique': 'baking powder', 'levure de boulanger': "baker's yeast",
  noisettes: 'hazelnuts', noix: 'walnuts', 'noix de cajou': 'cashews',
  'noix de macadamia': 'macadamia nuts', 'noix de pécan': 'pecans', 'pignons de pin': 'pine nuts',
  pistaches: 'pistachios', 'pâte à tartiner': 'chocolate spread', sucre: 'sugar',
  'sucre glace': 'powdered sugar', 'sucre roux': 'brown sugar', 'sucre vanillé': 'vanilla sugar',

  // Autres
  eau: 'water', "eau de fleur d'oranger": 'orange blossom water', 'fécule de maïs': 'cornstarch',
  tofu: 'tofu', 'tofu fumé': 'smoked tofu', seitan: 'seitan', 'algues nori': 'nori seaweed',
  'agar-agar': 'agar agar',

  // Pâtes à tarte / pâtisserie
  'pâte à gâteau': 'pie crust dough', 'pâte à tarte': 'pie crust dough',
  'pâte brisée': 'pie crust dough', 'pâte feuilletée': 'puff pastry dough',
  'pâte sablée': 'shortbread pastry dough',
};

export function toSearchQuery(frenchName: string): string {
  const key = frenchName.trim().toLowerCase();
  return INGREDIENT_EN[key] ?? frenchName;
}

/** true si on a une traduction anglaise connue pour cet ingrédient — sinon la
 * recherche USDA se fait avec le nom français tel quel, ce qui échoue souvent
 * ou peut tomber sur un mauvais résultat. */
export function hasKnownTranslation(frenchName: string): boolean {
  return frenchName.trim().toLowerCase() in INGREDIENT_EN;
}
