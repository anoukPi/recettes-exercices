// Ingrédients épinglés sur une fiche USDA précise (fdcId), vérifiée à la main
// avec scripts/usda-probe.mjs. Prioritaire sur la recherche texte
// (ingredientTranslations.ts), dont l'heuristique tombait trop souvent à côté
// (ex: "eau" → un légume, "tofu" → yaourt au tofu, "porc" → lard salé).
// Clés en minuscules. Convention : poids cru / sec, sauf mention contraire
// dans le nom ("cuit", "en conserve"…).
export const INGREDIENT_FDC_ID: Record<string, number> = {
  // Légumes
  'champignon de paris': 169251, // Mushrooms, white, raw
  châtaigne: 170575, // Nuts, chestnuts, european, raw, peeled
  cornichon: 324653, // Pickles, cucumber, dill or kosher dill
  'épinard congelé': 169287, // Spinach, frozen, chopped or leaf, unprepared
  'haricot beurre': 169320, // Beans, snap, yellow, raw
  'haricot rouge': 174285, // Beans, kidney, red, canned, drained solids
  'haricot blanc': 175204, // Beans, white, mature seeds, canned
  'haricots blancs en conserve': 175204,
  'haricots blancs secs': 175202, // Beans, white, mature seeds, raw
  maïs: 169214, // Corn, sweet, yellow, canned, whole kernel, drained solids
  'maïs doux': 169214,
  'maïs en grain (sec)': 170288, // Corn grain, yellow
  'olive noire': 169094, // Olives, ripe, canned
  oseille: 170076, // Dock, raw
  'patate douce': 168482, // Sweet potato, raw, unprepared
  'persil plat': 170416, // Parsley, fresh
  'pois mange-tout': 170010, // Peas, edible-podded, raw
  potimarron: 168475, // Squash, winter, hubbard, raw (courge proche)
  radis: 169276, // Radishes, raw
  'radis noir': 169276,
  'tomate cerise': 321360, // Tomatoes, grape, raw
  topinambour: 169236, // Jerusalem-artichokes, raw

  // Fruits
  citron: 167746, // Lemons, raw, without peel
  'jus de citron': 167747, // Lemon juice, raw
  'zeste de citron': 167749, // Lemon peel, raw
  'fruit de la passion': 169108, // Passion-fruit, purple, raw
  kiwi: 327046, // Kiwifruit, green, raw
  orange: 169097, // Oranges, raw, all commercial varieties
  pêche: 325430, // Peaches, yellow, raw
  physalis: 173043, // Groundcherries, raw
  pruneau: 168162, // Plums, dried (prunes), uncooked
  raisin: 174683, // Grapes, red or green, raw
  'noix de coco': 170170, // Nuts, coconut meat, dried (desiccated), not sweetened
  'noix de coco râpée': 170170,
  'noix de coco fraîche': 170169, // Nuts, coconut meat, raw

  // Viandes
  agneau: 172479, // Lamb, composite of trimmed retail cuts, lean and fat, raw
  mouton: 172479,
  bacon: 168277, // Pork, cured, bacon, unprepared
  pancetta: 168277,
  'boeuf haché': 171796, // Beef, ground, 85% lean / 15% fat, raw
  'bœuf haché': 171796,
  'steak haché': 171796,
  'steak haché 5%': 171790, // Beef, ground, 95% lean / 5% fat, raw
  'boeuf haché light': 171790,
  'bœuf haché light': 171790,
  'steak haché 10%': 174030, // Beef, ground, 90% lean / 10% fat, raw
  'steak haché 15%': 171796,
  'steak haché 20%': 174036, // Beef, ground, 80% lean / 20% fat, raw
  'bourguignon (à braiser)': 171206, // Beef, chuck for stew, lean and fat, raw
  'filet de bœuf': 173109, // Beef, tenderloin, separable lean and fat, raw
  bavette: 169563, // Beef, flank, steak, lean and fat, raw
  entrecôte: 173402, // Beef, rib eye steak, lean and fat, raw
  'rôti de boeuf': 173983, // Beef, round, top round roast, lean and fat, raw
  canard: 172410, // Duck, domesticated, meat only, raw
  oie: 172413, // Goose, domesticated, meat only, raw
  dinde: 171480, // Turkey, whole, meat only, raw
  poulet: 171052, // Chicken, broilers or fryers, meat only, raw
  'poulet entier': 171447, // Chicken, broilers or fryers, meat and skin, raw
  'cuisse de poulet': 172385, // Chicken, thigh, meat and skin, raw
  'cuisse de poulet sans peau': 173627, // Chicken, thigh, meat only, raw
  'aile de poulet': 172390, // Chicken, wing, meat and skin, raw
  'poulet pané': 171515, // Chicken breast tenders, breaded, uncooked
  porc: 167818, // Pork, fresh, loin, whole, lean and fat, raw
  'rôti de porc': 168314, // Pork, top loin (roasts), lean and fat, raw
  'filet mignon de porc': 168312, // Pork, tenderloin, lean and fat, raw
  'poitrine de porc': 167812, // Pork, fresh, belly, raw
  'chair à saucisse': 167902, // Pork, fresh, ground, raw
  'jambon blanc': 167874, // Pork, cured, ham, boneless, extra lean, unheated
  jambon: 167874,
  saucisse: 171631, // Sausage, Italian, pork, mild, raw
  'saucisse de toulouse': 171631,
  chipolata: 171631,
  'saucisse fumée': 174584, // Sausage, smoked link sausage, pork
  saucisson: 172938, // Salami, dry or hard, pork
  veau: 173815, // Veal, composite of trimmed retail cuts, lean and fat, raw

  // Poissons & fruits de mer
  colin: 173713, // Fish, whiting, raw (poisson blanc maigre proche)
  merlan: 173713,
  dorade: 175141, // Fish, scup, raw (sparidé proche)
  flétan: 174200, // Fish, halibut, Atlantic and Pacific, raw
  huître: 171978, // Mollusks, oyster, eastern, wild, raw
  langoustine: 174208, // Crustaceans, lobster, northern, raw
  limande: 174196, // Fish, flatfish (flounder and sole), raw
  morue: 174190, // Fish, cod, Atlantic, dried and salted
  poulpe: 174218, // Mollusks, octopus, common, raw
  rouget: 175123, // Fish, mullet, striped, raw
  'saint-jacques': 174220, // Mollusks, scallop, raw
  sardine: 175139, // Fish, sardine, Atlantic, canned in oil, drained
  saumon: 175167, // Fish, salmon, Atlantic, farmed, raw
  "saumon d'élevage": 175167,
  'saumon sauvage': 173686, // Fish, salmon, Atlantic, wild, raw
  thon: 334194, // Fish, tuna, light, canned in water, drained solids
  'thon au naturel': 334194,
  "thon à l'huile": 173708, // Fish, tuna, light, canned in oil, drained solids
  'thon frais': 173706, // Fish, tuna, fresh, bluefin, raw
  'poisson pané': 174195, // Fish, fish sticks, frozen, prepared

  // Produits laitiers
  beurre: 173430, // Butter, without salt
  chèvre: 173433, // Cheese, goat, semisoft type (bûche)
  'fromage de chèvre': 173433,
  'fromage chèvre': 173433,
  'bûche de chèvre': 173433,
  'chèvre frais': 173435, // Cheese, goat, soft type
  'chèvre sec': 172197, // Cheese, goat, hard type
  comté: 171242, // Cheese, gruyere (pâte pressée cuite proche)
  emmental: 171251, // Cheese, swiss
  parmesan: 170848, // Cheese, parmesan, hard
  'fromage râpé': 171251,
  faisselle: 172179, // Cheese, cottage, creamed
  'crème fraîche liquide': 170858, // Cream, fluid, light whipping (~30 %)
  'lait écrémé': 746776, // Milk, nonfat, fluid
  'lait ribot': 170874, // Milk, buttermilk, cultured, lowfat
  yaourt: 171284, // Yogurt, plain, whole milk
  'yaourt 0%': 170887, // Yogurt, plain, skim milk
  'yaourt aux fruits': 170889, // Yogurt, fruit, low fat
  'yaourt grec': 171304, // Yogurt, Greek, plain, whole milk
  'yaourt grec 0%': 330137, // Yogurt, Greek, plain, nonfat

  // Féculents
  "flocons d'avoine": 173904, // Cereals, oats, regular and quick, dry
  farine: 169761, // Wheat flour, white, all-purpose, unenriched
  'farine de blé': 169761,
  boulgour: 170688, // Bulgur, dry
  couscous: 169699, // Couscous, dry
  épeautre: 169745, // Spelt, uncooked
  'orge perlé': 170284, // Barley, pearled, raw
  lasagne: 169736, // Pasta, dry, enriched
  linguine: 169736,
  macaroni: 169736,
  spaghetti: 169736,
  vermicelle: 169736,
  'pâtes cuites': 169737, // Pasta, cooked, without added salt
  nouilles: 169731, // Noodles, egg, dry
  tagliatelles: 169731,
  pain: 172675, // Bread, french or vienna (includes sourdough)
  baguette: 172675,
  'pain blanc': 172675,
  'pain de mie': 174924, // Bread, white, commercially prepared
  'pain de seigle': 172684, // Bread, rye
  'pois chiches': 173800, // Chickpeas, canned, drained solids
  'pois chiches en conserve': 173800,
  'pois chiches secs': 173756, // Chickpeas, mature seeds, raw
  quinoa: 168874, // Quinoa, uncooked
  'quinoa cuit': 168917, // Quinoa, cooked
  'riz basmati': 168877, // Rice, white, long-grain, raw
  'riz blanc': 168877,
  'riz cuit': 168878, // Rice, white, long-grain, cooked
  'riz blanc cuit': 168878,
  'riz basmati cuit': 168878,
  'riz complet cuit': 169704, // Rice, brown, long-grain, cooked
  'lentilles cuites': 172421, // Lentils, cooked, boiled, without salt
  'pâte à tarte': 175065, // Pie crust, standard-type, frozen, ready-to-bake
  'pâte brisée': 175065,
  'pâte sablée': 175065,

  // Épices, herbes & condiments
  'herbes de provence': 170938, // Spices, thyme, dried
  zaatar: 170938,
  menthe: 173474, // Peppermint, fresh
  citronnelle: 168573, // Lemon grass, raw
  "piment d'espelette": 170932, // Spices, pepper, red or cayenne
  'poivre rose': 170931, // Spices, pepper, black
  'sel de mer': 173468, // Salt, table
  vanille: 173471, // Vanilla extract
  'essence amande amer': 173471, // extrait alcoolique, proche de l'extrait de vanille
  "extrait d'amande amère": 173471,
  'bouillon de boeuf': 171538, // Soup, beef broth, ready-to-serve
  'bouillon de poulet': 174536, // Soup, chicken broth, ready-to-serve
  mayonnaise: 171009, // Salad dressing, mayonnaise, regular
  "moutarde à l'ancienne": 326698, // Mustard, prepared, yellow
  'sauce barbecue': 174523, // Sauce, barbecue
  'sauce tomate': 170054, // Tomato products, canned, sauce
  tabasco: 174528, // Sauce, pepper, TABASCO
  "sirop d'agave": 170277, // Sweetener, syrup, agave
  'vinaigre blanc': 172237, // Vinegar, distilled
  vinaigrette: 171417, // Salad dressing, home recipe, vinegar and oil

  // Sucré, graines & oléagineux
  cacao: 169593, // Cocoa, dry powder, unsweetened
  'cacao en poudre': 169593,
  'chocolat au lait': 167587, // Candies, milk chocolate
  'chocolat noir': 170273, // Chocolate, dark, 70-85% cacao solids
  'chocolat noir 70%': 170273,
  'chocolat noir 85%': 170273,
  'chocolat noir 60%': 170272, // Chocolate, dark, 60-69% cacao solids
  'chocolat noir 50%': 170271, // Chocolate, dark, 45-59% cacao solids
  'pépite chocolat': 167976, // Candies, semisweet chocolate
  'pépites de chocolat': 167976,
  'graines de chia': 170554, // Seeds, chia seeds, dried
  'graines de courge': 170556, // Seeds, pumpkin and squash seed kernels, dried
  'graines de lin': 169414, // Seeds, flaxseed
  'graines de sésame': 170150, // Seeds, sesame seeds, whole, dried
  'graine de chanvre': 170148, // Seeds, hemp seed, hulled
  'graines de chanvre': 170148,
  'graine de tournesol': 170562, // Seeds, sunflower seed kernels, dried
  'graines de tournesol': 170562,
  gélatine: 169599, // Gelatins, dry powder, unsweetened
  levure: 172803, // Leavening agents, baking powder, double-acting
  'levure chimique': 172803,
  'poudre à lever': 172803,
  'bicarbonate de soude': 175040, // Leavening agents, baking soda
  'levure fraîche': 175042, // Leavening agents, yeast, baker's, compressed
  'levure sèche': 175043, // Leavening agents, yeast, baker's, active dry
  noisettes: 170581, // Nuts, hazelnuts or filberts
  'pignons de pin': 170591, // Nuts, pine nuts, dried
  sucre: 169655, // Sugars, granulated
  'sucre vanillé': 169655,
  protéine: 173180, // Beverages, Protein powder whey based
  'protéine whey': 173180,

  // Boissons végétales & divers
  "lait d'amande": 174832, // Beverages, almond milk, unsweetened, shelf stable
  'lait de soja': 175215, // Soymilk, unsweetened, with added calcium
  'lait de coco': 170173, // Nuts, coconut milk, canned
  'lait coco': 170173,
  tofu: 172475, // Tofu, raw, firm, prepared with calcium sulfate
  'tofu ferme': 172475,
  'tofu fumé': 172475,
  'tofu soyeux': 172461, // Tofu, silken, firm
  'algues nori': 168458, // Seaweed, laver, raw
};
