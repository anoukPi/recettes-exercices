// La base USDA FoodData Central est indexée en anglais uniquement.
// Cette table traduit nos noms d'ingrédients français vers un terme de
// recherche anglais, pour permettre le calcul nutritionnel.
// Les ingrédients épinglés sur une fiche précise (ingredientPins.ts) ou dotés
// d'une valeur de référence (referenceNutrition.ts) n'ont pas besoin d'entrée ici.
// Clés en minuscules — la recherche se fait insensible à la casse.
export const INGREDIENT_EN: Record<string, string> = {
  // Légumes
  ail: 'garlic', artichaut: 'artichoke', asperge: 'asparagus', aubergine: 'eggplant',
  betterave: 'beet', blette: 'chard', brocoli: 'broccoli', carotte: 'carrot',
  'céleri branche': 'celery', 'céleri rave': 'celeriac',
  'champignon shiitake': 'shiitake mushroom', chou: 'cabbage',
  'chou blanc': 'white cabbage', 'chou chinois': 'chinese cabbage',
  'chou de bruxelles': 'brussels sprouts', 'chou frisé': 'kale', 'chou rouge': 'red cabbage',
  'chou-fleur': 'cauliflower', ciboule: 'scallion', citrouille: 'pumpkin', concombre: 'cucumber',
  'courge butternut': 'butternut squash', 'courge spaghetti': 'spaghetti squash',
  courgette: 'zucchini', cresson: 'watercress', échalote: 'shallot', endive: 'endive',
  épinard: 'spinach', fenouil: 'fennel', gingembre: 'ginger',
  'haricot vert': 'green bean',
  igname: 'yam', laitue: 'lettuce',
  manioc: 'cassava', navet: 'turnip', oignon: 'onion', 'oignon blanc': 'white onion',
  'oignon jaune': 'yellow onion', 'oignon rouge': 'red onion',
  'olive verte': 'green olive', panais: 'parsnip',
  'petit pois': 'green peas', piment: 'chili pepper',
  'piment doux': 'sweet pepper', poireau: 'leek',
  'poivron jaune': 'sweet pepper yellow raw', 'poivron rouge': 'sweet pepper red raw',
  'poivron vert': 'sweet pepper green raw', 'pomme de terre': 'potato flesh and skin raw',
  potiron: 'pumpkin', raifort: 'horseradish',
  rhubarbe: 'rhubarb', roquette: 'arugula', rutabaga: 'rutabaga', 'salade batavia': 'batavia lettuce',
  'salade iceberg': 'iceberg lettuce', 'salade romaine': 'romaine lettuce', salsifis: 'salsify',
  tomate: 'tomatoes red ripe raw',

  // Fruits
  abricot: 'apricot', ananas: 'pineapple', avocat: 'avocado', banane: 'banana',
  cassis: 'black currant', cerise: 'cherry',
  'citron vert': 'lime', clémentine: 'clementine', coing: 'quince', corossol: 'soursop',
  datte: 'date', figue: 'fig', fraise: 'strawberry', framboise: 'raspberry',
  goyave: 'guava', grenade: 'pomegranate',
  groseille: 'red currant', kaki: 'persimmon', kumquat: 'kumquat',
  litchi: 'lychee', mandarine: 'mandarin orange', mangue: 'mango', 'mangue séchée': 'mango dried',
  'mangue sechée': 'mango dried', melon: 'melon',
  mirabelle: 'mirabelle plum', mûre: 'blackberry', myrtille: 'blueberry', nectarine: 'nectarine',
  pamplemousse: 'grapefruit', papaye: 'papaya',
  pastèque: 'watermelon', poire: 'pear',
  pomme: 'apple', prune: 'plum', quetsche: 'damson plum',
  'raisin sec': 'raisin', tamarin: 'tamarind',

  // Viandes
  'blanc de poulet': 'chicken breast boneless skinless', 'boudin noir': 'blood sausage',
  chorizo: 'chorizo',
  'côte de porc': 'pork chop',
  'escalope de veau': 'veal cutlet', 'foie gras': 'foie gras',
  "gigot d'agneau": 'leg of lamb',
  lapin: 'rabbit', lard: 'pork fat',
  'magret de canard': 'duck breast',
  pintade: 'guinea fowl',

  // Poissons & fruits de mer
  anchois: 'anchovy', bar: 'sea bass', cabillaud: 'cod', calamar: 'squid',
  crabe: 'crab', crevette: 'shrimp', écrevisse: 'crayfish',
  encornet: 'squid', espadon: 'swordfish', hareng: 'herring',
  homard: 'lobster', langouste: 'spiny lobster',
  lieu: 'pollock', lotte: 'monkfish', maquereau: 'mackerel',
  moule: 'mussel',
  palourde: 'clam',
  sandre: 'walleye', seiche: 'cuttlefish', 'filet sandre': 'walleye',
  sole: 'sole', truite: 'trout',

  // Produits laitiers & oeufs
  'beurre demi-sel': 'salted butter', "blanc d'oeuf": 'egg white',
  brie: 'brie cheese', camembert: 'camembert cheese',
  feta: 'feta cheese',
  gruyère: 'gruyere cheese', "jaune d'oeuf": 'egg yolk',
  'lait concentré': 'condensed milk',
  'lait entier': 'milk whole 3.25',
  oeuf: 'egg whole',
  ricotta: 'ricotta',
  roquefort: 'roquefort cheese',
  'yaourt nature': 'plain yogurt',

  // Féculents & céréales
  avoine: 'oats regular quick not fortified dry', blé: 'wheat',
  'farine complète': 'whole wheat flour',
  'farine de maïs': 'corn flour',
  'farine de riz': 'rice flour', 'farine de sarrasin': 'buckwheat flour',
  'farine de pois chiche': 'chickpea flour', chapelure: 'dry bread crumbs',
  fusilli: 'fusilli pasta',
  'lentilles blondes': 'yellow lentils', 'lentilles corail': 'red lentils',
  'lentilles vertes': 'green lentils',
  'feuille de riz': 'rice noodles dry', orge: 'barley',
  'pain complet': 'whole wheat bread', pâtes: 'pasta',
  penne: 'penne pasta', 'pois cassés': 'split peas',
  riz: 'white rice',
  'riz complet': 'brown rice long-grain raw',
  'riz rond': 'short grain rice', sarrasin: 'buckwheat', semoule: 'semolina',

  // Épices & herbes
  aneth: 'dill', 'anis étoilé': 'star anise', basilic: 'basil', cannelle: 'cinnamon',
  cardamome: 'cardamom', cerfeuil: 'chervil', ciboulette: 'chives',
  'clou de girofle': 'clove', coriandre: 'coriander', cumin: 'cumin', curcuma: 'turmeric',
  curry: 'curry powder', estragon: 'tarragon', fenugrec: 'fenugreek',
  laurier: 'bay leaf', marjolaine: 'marjoram',
  muscade: 'nutmeg', origan: 'oregano', paprika: 'paprika', persil: 'parsley',
  'piment de cayenne': 'cayenne pepper',
  'poivre blanc': 'white pepper', 'poivre noir': 'black pepper',
  'quatre-épices': 'allspice', romarin: 'rosemary', safran: 'saffron', sarriette: 'savory',
  sauge: 'sage', sel: 'salt', 'sel fin': 'fine salt', thym: 'thyme',
  wasabi: 'wasabi',

  // Condiments, sauces & huiles
  'bouillon de légumes': 'vegetable broth',
  câpres: 'capers',
  "huile d'arachide": 'peanut oil', 'huile de colza': 'canola oil', 'huile de noix': 'walnut oil',
  'huile de sésame': 'sesame oil', 'huile de tournesol': 'sunflower oil', 'huile de coco': 'coconut oil',
  "huile d'olive": 'olive oil', ketchup: 'ketchup', miel: 'honey',
  moutarde: 'mustard prepared yellow', 'nuoc-mâm': 'fish sauce',
  pesto: 'pesto', 'sauce hoisin': 'hoisin sauce',
  'sauce soja': 'soy sauce',
  'sauce worcestershire': 'worcestershire sauce',
  "sirop d'érable": 'maple syrup', tahini: 'tahini',
  'vinaigre balsamique': 'balsamic vinegar',
  'vinaigre de cidre': 'cider vinegar', 'vinaigre de vin': 'wine vinegar',

  // Fruits secs, oléagineux & sucré
  amandes: 'almonds', 'poudre amande': 'almonds', "poudre d'amande": 'almonds',
  cacahuètes: 'peanuts', café: 'coffee brewed prepared with tap water',
  'café déca': 'coffee brewed prepared with tap water decaffeinated',
  'cranberries séchées': 'cranberries dried sweetened',
  'farine de patate douce': 'flour potato', 'gomme de guar': 'guar gum',
  'tomate séchée': 'tomatoes sun dried', 'beurre de cacahuète': 'peanut butter smooth without salt',
  'chocolat blanc': 'white chocolate',
  'graines de pavot': 'poppy seeds',
  'levure de boulanger': "baker's yeast",
  noix: 'walnuts', 'noix de cajou': 'cashews',
  'noix de macadamia': 'macadamia nuts', 'noix de pécan': 'pecans',
  pistaches: 'pistachios', 'pâte à tartiner': 'chocolate spread',
  'sucre glace': 'powdered sugar', 'sucre roux': 'brown sugar',

  // Autres
  'fécule de maïs': 'cornstarch',
  'agar-agar': 'agar agar',

  // Pâtes à tarte / pâtisserie
  'pâte feuilletée': 'puff pastry dough',
};
