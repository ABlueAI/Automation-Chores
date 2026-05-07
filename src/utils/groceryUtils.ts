export interface GroceryDBItem {
  name: string
  nameEs: string
  category: string
  keywords: string[]
}

export const GROCERY_CATEGORIES_ORDER = [
  'Grocery Store Produce',
  'Grocery Store Meat & Seafood',
  'Grocery Store Deli',
  'Grocery Store Dairy',
  'Grocery Store Bakery',
  'Grocery Store Frozen',
  'Grocery Store Beverages',
  'Grocery Store Pantry',
  'Grocery Store Other',
]

export const CATEGORY_ICONS: Record<string, string> = {
  'Grocery Store Produce': '🥬',
  'Grocery Store Meat & Seafood': '🥩',
  'Grocery Store Deli': '🥓',
  'Grocery Store Dairy': '🥛',
  'Grocery Store Bakery': '🍞',
  'Grocery Store Frozen': '🧊',
  'Grocery Store Beverages': '🥤',
  'Grocery Store Pantry': '🛒',
  'Grocery Store Other': '📦',
}

export const GROCERY_DB: GroceryDBItem[] = [
  // ── BAKERY ──
  { name: 'Bread', nameEs: 'Pan', category: 'Grocery Store Bakery', keywords: ['bread', 'loaf'] },
  { name: 'White Bread', nameEs: 'Pan Blanco', category: 'Grocery Store Bakery', keywords: ['white bread'] },
  { name: 'Whole Wheat Bread', nameEs: 'Pan Integral', category: 'Grocery Store Bakery', keywords: ['wheat bread', 'whole wheat'] },
  { name: 'Sourdough', nameEs: 'Pan de Masa Madre', category: 'Grocery Store Bakery', keywords: ['sourdough'] },
  { name: 'Bagels', nameEs: 'Bagels', category: 'Grocery Store Bakery', keywords: ['bagel', 'bagels'] },
  { name: 'Croissants', nameEs: 'Croissants', category: 'Grocery Store Bakery', keywords: ['croissant'] },
  { name: 'Muffins', nameEs: 'Magdalenas', category: 'Grocery Store Bakery', keywords: ['muffin', 'muffins'] },
  { name: 'Donuts', nameEs: 'Donas', category: 'Grocery Store Bakery', keywords: ['donut', 'doughnut', 'donuts'] },
  { name: 'Cookies', nameEs: 'Galletas', category: 'Grocery Store Bakery', keywords: ['cookie', 'cookies'] },
  { name: 'Cake', nameEs: 'Pastel', category: 'Grocery Store Bakery', keywords: ['cake'] },
  { name: 'Pastries', nameEs: 'Pasteles', category: 'Grocery Store Bakery', keywords: ['pastry', 'pastries'] },
  { name: 'Dinner Rolls', nameEs: 'Panecillos', category: 'Grocery Store Bakery', keywords: ['rolls', 'dinner roll', 'bun', 'buns'] },
  { name: 'Baguette', nameEs: 'Baguette', category: 'Grocery Store Bakery', keywords: ['baguette'] },
  { name: 'Pita Bread', nameEs: 'Pan de Pita', category: 'Grocery Store Bakery', keywords: ['pita'] },
  { name: 'Tortillas', nameEs: 'Tortillas', category: 'Grocery Store Bakery', keywords: ['tortilla', 'tortillas', 'wrap'] },
  { name: 'Brownies', nameEs: 'Brownies', category: 'Grocery Store Bakery', keywords: ['brownie', 'brownies'] },
  { name: 'Pie', nameEs: 'Pay', category: 'Grocery Store Bakery', keywords: ['pie'] },
  { name: 'Cinnamon Rolls', nameEs: 'Roles de Canela', category: 'Grocery Store Bakery', keywords: ['cinnamon roll', 'cinnamon rolls'] },

  // ── DAIRY ──
  { name: 'Milk', nameEs: 'Leche', category: 'Grocery Store Dairy', keywords: ['milk'] },
  { name: 'Whole Milk', nameEs: 'Leche Entera', category: 'Grocery Store Dairy', keywords: ['whole milk'] },
  { name: 'Skim Milk', nameEs: 'Leche Descremada', category: 'Grocery Store Dairy', keywords: ['skim milk', '2% milk', 'low fat milk'] },
  { name: 'Eggs', nameEs: 'Huevos', category: 'Grocery Store Dairy', keywords: ['egg', 'eggs', 'dozen eggs'] },
  { name: 'Butter', nameEs: 'Mantequilla', category: 'Grocery Store Dairy', keywords: ['butter'] },
  { name: 'Cheese', nameEs: 'Queso', category: 'Grocery Store Dairy', keywords: ['cheese'] },
  { name: 'Cheddar Cheese', nameEs: 'Queso Cheddar', category: 'Grocery Store Dairy', keywords: ['cheddar'] },
  { name: 'Mozzarella', nameEs: 'Mozzarella', category: 'Grocery Store Dairy', keywords: ['mozzarella'] },
  { name: 'Parmesan', nameEs: 'Parmesano', category: 'Grocery Store Dairy', keywords: ['parmesan'] },
  { name: 'Cream Cheese', nameEs: 'Queso Crema', category: 'Grocery Store Dairy', keywords: ['cream cheese'] },
  { name: 'Brie', nameEs: 'Brie', category: 'Grocery Store Dairy', keywords: ['brie'] },
  { name: 'Gouda', nameEs: 'Gouda', category: 'Grocery Store Dairy', keywords: ['gouda'] },
  { name: 'Swiss Cheese', nameEs: 'Queso Suizo', category: 'Grocery Store Dairy', keywords: ['swiss cheese', 'swiss'] },
  { name: 'Yogurt', nameEs: 'Yogur', category: 'Grocery Store Dairy', keywords: ['yogurt'] },
  { name: 'Greek Yogurt', nameEs: 'Yogur Griego', category: 'Grocery Store Dairy', keywords: ['greek yogurt'] },
  { name: 'Sour Cream', nameEs: 'Crema Agria', category: 'Grocery Store Dairy', keywords: ['sour cream'] },
  { name: 'Heavy Cream', nameEs: 'Crema para Batir', category: 'Grocery Store Dairy', keywords: ['heavy cream', 'whipping cream'] },
  { name: 'Half and Half', nameEs: 'Mezcla de Crema y Leche', category: 'Grocery Store Dairy', keywords: ['half and half'] },
  { name: 'Cottage Cheese', nameEs: 'Queso Cottage', category: 'Grocery Store Dairy', keywords: ['cottage cheese'] },
  { name: 'Buttermilk', nameEs: 'Suero de Leche', category: 'Grocery Store Dairy', keywords: ['buttermilk'] },
  { name: 'Whipped Cream', nameEs: 'Crema Batida', category: 'Grocery Store Dairy', keywords: ['whipped cream'] },

  // ── DELI ──
  { name: 'Ham', nameEs: 'Jamón', category: 'Grocery Store Deli', keywords: ['ham'] },
  { name: 'Turkey (Deli)', nameEs: 'Pavo (Deli)', category: 'Grocery Store Deli', keywords: ['deli turkey', 'turkey slice', 'sliced turkey'] },
  { name: 'Chicken (Deli)', nameEs: 'Pollo (Deli)', category: 'Grocery Store Deli', keywords: ['deli chicken', 'sliced chicken'] },
  { name: 'Roast Beef', nameEs: 'Rosbif', category: 'Grocery Store Deli', keywords: ['roast beef'] },
  { name: 'Salami', nameEs: 'Salami', category: 'Grocery Store Deli', keywords: ['salami'] },
  { name: 'Pepperoni', nameEs: 'Pepperoni', category: 'Grocery Store Deli', keywords: ['pepperoni'] },
  { name: 'Bologna', nameEs: 'Mortadela', category: 'Grocery Store Deli', keywords: ['bologna'] },
  { name: 'Prosciutto', nameEs: 'Prosciutto', category: 'Grocery Store Deli', keywords: ['prosciutto'] },
  { name: 'Pastrami', nameEs: 'Pastrami', category: 'Grocery Store Deli', keywords: ['pastrami'] },
  { name: 'Corned Beef', nameEs: 'Carne en Conserva', category: 'Grocery Store Deli', keywords: ['corned beef'] },
  { name: 'Bacon', nameEs: 'Tocino', category: 'Grocery Store Deli', keywords: ['bacon'] },

  // ── PRODUCE — Fruits ──
  { name: 'Apples', nameEs: 'Manzanas', category: 'Grocery Store Produce', keywords: ['apple', 'apples'] },
  { name: 'Bananas', nameEs: 'Plátanos', category: 'Grocery Store Produce', keywords: ['banana', 'bananas'] },
  { name: 'Oranges', nameEs: 'Naranjas', category: 'Grocery Store Produce', keywords: ['orange', 'oranges'] },
  { name: 'Grapes', nameEs: 'Uvas', category: 'Grocery Store Produce', keywords: ['grape', 'grapes'] },
  { name: 'Strawberries', nameEs: 'Fresas', category: 'Grocery Store Produce', keywords: ['strawberry', 'strawberries'] },
  { name: 'Blueberries', nameEs: 'Arándanos', category: 'Grocery Store Produce', keywords: ['blueberry', 'blueberries'] },
  { name: 'Raspberries', nameEs: 'Frambuesas', category: 'Grocery Store Produce', keywords: ['raspberry', 'raspberries'] },
  { name: 'Blackberries', nameEs: 'Zarzamoras', category: 'Grocery Store Produce', keywords: ['blackberry', 'blackberries'] },
  { name: 'Mango', nameEs: 'Mango', category: 'Grocery Store Produce', keywords: ['mango', 'mangos'] },
  { name: 'Pineapple', nameEs: 'Piña', category: 'Grocery Store Produce', keywords: ['pineapple'] },
  { name: 'Watermelon', nameEs: 'Sandía', category: 'Grocery Store Produce', keywords: ['watermelon'] },
  { name: 'Peaches', nameEs: 'Duraznos', category: 'Grocery Store Produce', keywords: ['peach', 'peaches'] },
  { name: 'Pears', nameEs: 'Peras', category: 'Grocery Store Produce', keywords: ['pear', 'pears'] },
  { name: 'Lemons', nameEs: 'Limones', category: 'Grocery Store Produce', keywords: ['lemon', 'lemons'] },
  { name: 'Limes', nameEs: 'Limas', category: 'Grocery Store Produce', keywords: ['lime', 'limes'] },
  { name: 'Avocado', nameEs: 'Aguacate', category: 'Grocery Store Produce', keywords: ['avocado', 'avocados'] },
  { name: 'Cherries', nameEs: 'Cerezas', category: 'Grocery Store Produce', keywords: ['cherry', 'cherries'] },
  { name: 'Plums', nameEs: 'Ciruelas', category: 'Grocery Store Produce', keywords: ['plum', 'plums'] },
  { name: 'Kiwi', nameEs: 'Kiwi', category: 'Grocery Store Produce', keywords: ['kiwi'] },
  // ── PRODUCE — Vegetables ──
  { name: 'Tomatoes', nameEs: 'Tomates', category: 'Grocery Store Produce', keywords: ['tomato', 'tomatoes'] },
  { name: 'Lettuce', nameEs: 'Lechuga', category: 'Grocery Store Produce', keywords: ['lettuce'] },
  { name: 'Spinach', nameEs: 'Espinaca', category: 'Grocery Store Produce', keywords: ['spinach'] },
  { name: 'Kale', nameEs: 'Col Rizada', category: 'Grocery Store Produce', keywords: ['kale'] },
  { name: 'Broccoli', nameEs: 'Brócoli', category: 'Grocery Store Produce', keywords: ['broccoli'] },
  { name: 'Cauliflower', nameEs: 'Coliflor', category: 'Grocery Store Produce', keywords: ['cauliflower'] },
  { name: 'Carrots', nameEs: 'Zanahorias', category: 'Grocery Store Produce', keywords: ['carrot', 'carrots'] },
  { name: 'Celery', nameEs: 'Apio', category: 'Grocery Store Produce', keywords: ['celery'] },
  { name: 'Cucumbers', nameEs: 'Pepinos', category: 'Grocery Store Produce', keywords: ['cucumber', 'cucumbers'] },
  { name: 'Onions', nameEs: 'Cebollas', category: 'Grocery Store Produce', keywords: ['onion', 'onions'] },
  { name: 'Red Onion', nameEs: 'Cebolla Roja', category: 'Grocery Store Produce', keywords: ['red onion'] },
  { name: 'Garlic', nameEs: 'Ajo', category: 'Grocery Store Produce', keywords: ['garlic'] },
  { name: 'Potatoes', nameEs: 'Papas', category: 'Grocery Store Produce', keywords: ['potato', 'potatoes'] },
  { name: 'Sweet Potatoes', nameEs: 'Camotes', category: 'Grocery Store Produce', keywords: ['sweet potato', 'yam'] },
  { name: 'Mushrooms', nameEs: 'Champiñones', category: 'Grocery Store Produce', keywords: ['mushroom', 'mushrooms'] },
  { name: 'Bell Peppers', nameEs: 'Pimientos', category: 'Grocery Store Produce', keywords: ['pepper', 'bell pepper', 'bell peppers'] },
  { name: 'Jalapeños', nameEs: 'Jalapeños', category: 'Grocery Store Produce', keywords: ['jalapeno', 'jalapeño'] },
  { name: 'Zucchini', nameEs: 'Calabacín', category: 'Grocery Store Produce', keywords: ['zucchini', 'squash'] },
  { name: 'Asparagus', nameEs: 'Espárragos', category: 'Grocery Store Produce', keywords: ['asparagus'] },
  { name: 'Corn', nameEs: 'Maíz', category: 'Grocery Store Produce', keywords: ['corn'] },
  { name: 'Green Beans', nameEs: 'Ejotes', category: 'Grocery Store Produce', keywords: ['green bean', 'green beans'] },
  { name: 'Cabbage', nameEs: 'Repollo', category: 'Grocery Store Produce', keywords: ['cabbage'] },
  { name: 'Arugula', nameEs: 'Arúgula', category: 'Grocery Store Produce', keywords: ['arugula'] },
  { name: 'Beets', nameEs: 'Betabeles', category: 'Grocery Store Produce', keywords: ['beet', 'beets'] },
  { name: 'Radishes', nameEs: 'Rábanos', category: 'Grocery Store Produce', keywords: ['radish', 'radishes'] },
  { name: 'Ginger', nameEs: 'Jengibre', category: 'Grocery Store Produce', keywords: ['ginger'] },

  // ── MEAT & SEAFOOD ──
  { name: 'Ground Beef', nameEs: 'Carne Molida', category: 'Grocery Store Meat & Seafood', keywords: ['ground beef'] },
  { name: 'Chicken Breast', nameEs: 'Pechuga de Pollo', category: 'Grocery Store Meat & Seafood', keywords: ['chicken breast', 'chicken'] },
  { name: 'Chicken Thighs', nameEs: 'Muslos de Pollo', category: 'Grocery Store Meat & Seafood', keywords: ['chicken thigh', 'chicken thighs'] },
  { name: 'Whole Chicken', nameEs: 'Pollo Entero', category: 'Grocery Store Meat & Seafood', keywords: ['whole chicken', 'rotisserie chicken'] },
  { name: 'Steak', nameEs: 'Bistec', category: 'Grocery Store Meat & Seafood', keywords: ['steak', 'ribeye', 'sirloin', 'tenderloin'] },
  { name: 'Pork Chops', nameEs: 'Chuletas de Cerdo', category: 'Grocery Store Meat & Seafood', keywords: ['pork chop', 'pork chops', 'pork'] },
  { name: 'Ground Turkey', nameEs: 'Pavo Molido', category: 'Grocery Store Meat & Seafood', keywords: ['ground turkey'] },
  { name: 'Turkey', nameEs: 'Pavo', category: 'Grocery Store Meat & Seafood', keywords: ['turkey breast', 'whole turkey'] },
  { name: 'Ribs', nameEs: 'Costillas', category: 'Grocery Store Meat & Seafood', keywords: ['ribs', 'baby back ribs'] },
  { name: 'Lamb', nameEs: 'Cordero', category: 'Grocery Store Meat & Seafood', keywords: ['lamb'] },
  { name: 'Sausage', nameEs: 'Salchicha', category: 'Grocery Store Meat & Seafood', keywords: ['sausage', 'bratwurst', 'hot dog', 'frankfurter'] },
  { name: 'Salmon', nameEs: 'Salmón', category: 'Grocery Store Meat & Seafood', keywords: ['salmon'] },
  { name: 'Tuna (Fresh)', nameEs: 'Atún Fresco', category: 'Grocery Store Meat & Seafood', keywords: ['fresh tuna', 'tuna steak'] },
  { name: 'Shrimp', nameEs: 'Camarones', category: 'Grocery Store Meat & Seafood', keywords: ['shrimp'] },
  { name: 'Tilapia', nameEs: 'Tilapia', category: 'Grocery Store Meat & Seafood', keywords: ['tilapia', 'cod', 'halibut', 'fish fillet'] },
  { name: 'Crab', nameEs: 'Cangrejo', category: 'Grocery Store Meat & Seafood', keywords: ['crab'] },
  { name: 'Lobster', nameEs: 'Langosta', category: 'Grocery Store Meat & Seafood', keywords: ['lobster'] },
  { name: 'Scallops', nameEs: 'Vieiras', category: 'Grocery Store Meat & Seafood', keywords: ['scallop', 'scallops'] },

  // ── FROZEN ──
  { name: 'Ice Cream', nameEs: 'Helado', category: 'Grocery Store Frozen', keywords: ['ice cream', 'gelato'] },
  { name: 'Frozen Pizza', nameEs: 'Pizza Congelada', category: 'Grocery Store Frozen', keywords: ['frozen pizza'] },
  { name: 'Frozen Vegetables', nameEs: 'Verduras Congeladas', category: 'Grocery Store Frozen', keywords: ['frozen vegetables', 'frozen veggies', 'frozen corn', 'frozen peas'] },
  { name: 'Frozen Fruit', nameEs: 'Fruta Congelada', category: 'Grocery Store Frozen', keywords: ['frozen fruit', 'frozen berries', 'frozen mango'] },
  { name: 'Frozen Waffles', nameEs: 'Waffles Congelados', category: 'Grocery Store Frozen', keywords: ['frozen waffle', 'eggo', 'waffles'] },
  { name: 'Popsicles', nameEs: 'Paletas', category: 'Grocery Store Frozen', keywords: ['popsicle', 'ice pop', 'paleta'] },
  { name: 'Frozen Dinners', nameEs: 'Cenas Congeladas', category: 'Grocery Store Frozen', keywords: ['frozen dinner', 'frozen meal', 'tv dinner'] },
  { name: 'Frozen Burritos', nameEs: 'Burritos Congelados', category: 'Grocery Store Frozen', keywords: ['frozen burrito', 'frozen burritos'] },
  { name: 'Frozen Chicken Nuggets', nameEs: 'Nuggets de Pollo Congelados', category: 'Grocery Store Frozen', keywords: ['chicken nugget', 'nuggets'] },
  { name: 'Sorbet', nameEs: 'Sorbete', category: 'Grocery Store Frozen', keywords: ['sorbet'] },
  { name: 'Frozen Yogurt', nameEs: 'Yogur Helado', category: 'Grocery Store Frozen', keywords: ['frozen yogurt', 'fro-yo'] },

  // ── BEVERAGES ──
  { name: 'Orange Juice', nameEs: 'Jugo de Naranja', category: 'Grocery Store Beverages', keywords: ['orange juice', 'oj'] },
  { name: 'Apple Juice', nameEs: 'Jugo de Manzana', category: 'Grocery Store Beverages', keywords: ['apple juice'] },
  { name: 'Grape Juice', nameEs: 'Jugo de Uva', category: 'Grocery Store Beverages', keywords: ['grape juice'] },
  { name: 'Soda', nameEs: 'Refresco', category: 'Grocery Store Beverages', keywords: ['soda', 'cola', 'coke', 'pepsi', 'sprite', 'dr pepper', '7up'] },
  { name: 'Water', nameEs: 'Agua', category: 'Grocery Store Beverages', keywords: ['water', 'bottled water'] },
  { name: 'Sparkling Water', nameEs: 'Agua Mineral', category: 'Grocery Store Beverages', keywords: ['sparkling water', 'seltzer', 'club soda', 'la croix'] },
  { name: 'Coffee', nameEs: 'Café', category: 'Grocery Store Beverages', keywords: ['coffee', 'espresso', 'coffee grounds', 'coffee beans'] },
  { name: 'Tea', nameEs: 'Té', category: 'Grocery Store Beverages', keywords: ['tea', 'green tea', 'herbal tea', 'black tea', 'chamomile'] },
  { name: 'Almond Milk', nameEs: 'Leche de Almendra', category: 'Grocery Store Beverages', keywords: ['almond milk'] },
  { name: 'Oat Milk', nameEs: 'Leche de Avena', category: 'Grocery Store Beverages', keywords: ['oat milk'] },
  { name: 'Coconut Milk Drink', nameEs: 'Bebida de Coco', category: 'Grocery Store Beverages', keywords: ['coconut milk drink', 'coconut water'] },
  { name: 'Lemonade', nameEs: 'Limonada', category: 'Grocery Store Beverages', keywords: ['lemonade'] },
  { name: 'Sports Drink', nameEs: 'Bebida Deportiva', category: 'Grocery Store Beverages', keywords: ['sports drink', 'gatorade', 'powerade'] },
  { name: 'Energy Drink', nameEs: 'Bebida Energética', category: 'Grocery Store Beverages', keywords: ['energy drink', 'red bull', 'monster', 'celsius'] },
  { name: 'Kombucha', nameEs: 'Kombucha', category: 'Grocery Store Beverages', keywords: ['kombucha'] },

  // ── PANTRY ──
  { name: 'Cereal', nameEs: 'Cereal', category: 'Grocery Store Pantry', keywords: ['cereal', 'granola', 'cheerios'] },
  { name: 'Oatmeal', nameEs: 'Avena', category: 'Grocery Store Pantry', keywords: ['oatmeal', 'oats', 'oat'] },
  { name: 'Pasta', nameEs: 'Pasta', category: 'Grocery Store Pantry', keywords: ['pasta', 'spaghetti', 'penne', 'noodles', 'fettuccine', 'linguine', 'rigatoni'] },
  { name: 'Rice', nameEs: 'Arroz', category: 'Grocery Store Pantry', keywords: ['rice', 'brown rice', 'white rice'] },
  { name: 'Flour', nameEs: 'Harina', category: 'Grocery Store Pantry', keywords: ['flour', 'all-purpose flour'] },
  { name: 'Sugar', nameEs: 'Azúcar', category: 'Grocery Store Pantry', keywords: ['sugar', 'brown sugar', 'powdered sugar'] },
  { name: 'Salt', nameEs: 'Sal', category: 'Grocery Store Pantry', keywords: ['salt', 'sea salt'] },
  { name: 'Black Pepper', nameEs: 'Pimienta Negra', category: 'Grocery Store Pantry', keywords: ['black pepper', 'ground pepper'] },
  { name: 'Olive Oil', nameEs: 'Aceite de Oliva', category: 'Grocery Store Pantry', keywords: ['olive oil'] },
  { name: 'Vegetable Oil', nameEs: 'Aceite Vegetal', category: 'Grocery Store Pantry', keywords: ['vegetable oil', 'canola oil', 'cooking oil'] },
  { name: 'Vinegar', nameEs: 'Vinagre', category: 'Grocery Store Pantry', keywords: ['vinegar', 'apple cider vinegar', 'white vinegar'] },
  { name: 'Ketchup', nameEs: 'Catsup', category: 'Grocery Store Pantry', keywords: ['ketchup', 'catsup'] },
  { name: 'Mustard', nameEs: 'Mostaza', category: 'Grocery Store Pantry', keywords: ['mustard'] },
  { name: 'Mayonnaise', nameEs: 'Mayonesa', category: 'Grocery Store Pantry', keywords: ['mayonnaise', 'mayo'] },
  { name: 'Peanut Butter', nameEs: 'Mantequilla de Cacahuate', category: 'Grocery Store Pantry', keywords: ['peanut butter'] },
  { name: 'Almond Butter', nameEs: 'Mantequilla de Almendra', category: 'Grocery Store Pantry', keywords: ['almond butter'] },
  { name: 'Jelly / Jam', nameEs: 'Mermelada', category: 'Grocery Store Pantry', keywords: ['jelly', 'jam', 'preserves'] },
  { name: 'Honey', nameEs: 'Miel', category: 'Grocery Store Pantry', keywords: ['honey'] },
  { name: 'Maple Syrup', nameEs: 'Jarabe de Maple', category: 'Grocery Store Pantry', keywords: ['maple syrup', 'syrup'] },
  { name: 'Tomato Sauce', nameEs: 'Salsa de Tomate', category: 'Grocery Store Pantry', keywords: ['tomato sauce', 'marinara', 'pasta sauce'] },
  { name: 'Tomato Paste', nameEs: 'Pasta de Tomate', category: 'Grocery Store Pantry', keywords: ['tomato paste'] },
  { name: 'Salsa', nameEs: 'Salsa', category: 'Grocery Store Pantry', keywords: ['salsa'] },
  { name: 'Canned Beans', nameEs: 'Frijoles en Lata', category: 'Grocery Store Pantry', keywords: ['beans', 'black beans', 'kidney beans', 'chickpeas', 'garbanzo', 'pinto beans'] },
  { name: 'Lentils', nameEs: 'Lentejas', category: 'Grocery Store Pantry', keywords: ['lentil', 'lentils'] },
  { name: 'Canned Tomatoes', nameEs: 'Tomates en Lata', category: 'Grocery Store Pantry', keywords: ['canned tomato', 'diced tomato', 'crushed tomato'] },
  { name: 'Canned Tuna', nameEs: 'Atún en Lata', category: 'Grocery Store Pantry', keywords: ['canned tuna', 'tuna can'] },
  { name: 'Chicken Broth', nameEs: 'Caldo de Pollo', category: 'Grocery Store Pantry', keywords: ['chicken broth', 'chicken stock', 'broth', 'stock'] },
  { name: 'Soy Sauce', nameEs: 'Salsa de Soya', category: 'Grocery Store Pantry', keywords: ['soy sauce'] },
  { name: 'Hot Sauce', nameEs: 'Salsa Picante', category: 'Grocery Store Pantry', keywords: ['hot sauce', 'tabasco', 'sriracha'] },
  { name: 'BBQ Sauce', nameEs: 'Salsa BBQ', category: 'Grocery Store Pantry', keywords: ['bbq sauce', 'barbecue sauce'] },
  { name: 'Ranch Dressing', nameEs: 'Aderezo Ranch', category: 'Grocery Store Pantry', keywords: ['ranch', 'ranch dressing'] },
  { name: 'Salad Dressing', nameEs: 'Aderezo para Ensalada', category: 'Grocery Store Pantry', keywords: ['salad dressing', 'italian dressing', 'caesar dressing'] },
  { name: 'Chips', nameEs: 'Papas Fritas / Botanas', category: 'Grocery Store Pantry', keywords: ['chips', 'potato chips', 'tortilla chips', 'doritos'] },
  { name: 'Crackers', nameEs: 'Galletas Saladas', category: 'Grocery Store Pantry', keywords: ['crackers', 'saltines', 'graham crackers'] },
  { name: 'Popcorn', nameEs: 'Palomitas de Maíz', category: 'Grocery Store Pantry', keywords: ['popcorn'] },
  { name: 'Nuts', nameEs: 'Nueces / Frutos Secos', category: 'Grocery Store Pantry', keywords: ['nuts', 'almonds', 'walnuts', 'cashews', 'peanuts', 'pistachios', 'pecans'] },
  { name: 'Chocolate Chips', nameEs: 'Chispas de Chocolate', category: 'Grocery Store Pantry', keywords: ['chocolate chips', 'chocolate'] },
  { name: 'Cocoa Powder', nameEs: 'Cacao en Polvo', category: 'Grocery Store Pantry', keywords: ['cocoa powder', 'cocoa'] },
  { name: 'Baking Powder', nameEs: 'Polvo para Hornear', category: 'Grocery Store Pantry', keywords: ['baking powder'] },
  { name: 'Baking Soda', nameEs: 'Bicarbonato de Sodio', category: 'Grocery Store Pantry', keywords: ['baking soda'] },
  { name: 'Vanilla Extract', nameEs: 'Extracto de Vainilla', category: 'Grocery Store Pantry', keywords: ['vanilla', 'vanilla extract'] },
  { name: 'Coconut Milk', nameEs: 'Leche de Coco', category: 'Grocery Store Pantry', keywords: ['coconut milk', 'canned coconut milk'] },
  { name: 'Bread Crumbs', nameEs: 'Pan Molido', category: 'Grocery Store Pantry', keywords: ['bread crumbs', 'breadcrumbs', 'panko'] },
  { name: 'Quinoa', nameEs: 'Quinoa', category: 'Grocery Store Pantry', keywords: ['quinoa'] },
  { name: 'Ramen / Instant Noodles', nameEs: 'Ramen / Fideos Instantáneos', category: 'Grocery Store Pantry', keywords: ['ramen', 'instant noodles', 'cup noodles'] },
]

export function findGroceryMatch(input: string): GroceryDBItem | null {
  if (!input.trim()) return null
  const q = input.toLowerCase().trim()

  // 1. Exact name match
  let match = GROCERY_DB.find(
    item => item.name.toLowerCase() === q || item.nameEs.toLowerCase() === q
  )
  if (match) return match

  // 2. Keyword exact match
  match = GROCERY_DB.find(item => item.keywords.some(kw => kw === q))
  if (match) return match

  // 3. Keyword starts-with match
  match = GROCERY_DB.find(item => item.keywords.some(kw => q.startsWith(kw) || kw.startsWith(q)))
  if (match) return match

  // 4. Keyword contains match
  match = GROCERY_DB.find(item => item.keywords.some(kw => q.includes(kw) || kw.includes(q)))
  if (match) return match

  return null
}

export function getSuggestions(query: string, limit = 8): GroceryDBItem[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return GROCERY_DB.filter(
    item =>
      item.name.toLowerCase().includes(q) ||
      item.nameEs.toLowerCase().includes(q) ||
      item.keywords.some(kw => kw.includes(q))
  ).slice(0, limit)
}
