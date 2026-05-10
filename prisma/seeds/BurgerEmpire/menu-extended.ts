/**
 * Extended menu seed — adds 10 more categories and 100+ items to BurgerEmpire.
 * Extracted from prisma/seed-menu-extended.ts for modular seeding.
 */
import { PrismaClient } from '@prisma/client';

interface MenuEntry {
  slug: string;
  categorySlug: string;
  dietType: 'veg' | 'nonveg' | 'egg';
  isFeatured?: boolean;
  isNew?: boolean;
  image?: string;
  classic: { name: string; description: string; price: number; calories: number };
  healthy: { name: string; description: string; price: number; calories: number; protein: number; fats: number; carbs: number; swaps: string[] };
}

const NEW_CATEGORIES = [
  { name: 'Wraps & Rolls', slug: 'wraps-rolls', rank: 6 },
  { name: 'Rice Bowls', slug: 'rice-bowls', rank: 7 },
  { name: 'Pasta', slug: 'pasta', rank: 8 },
  { name: 'Pizza', slug: 'pizza', rank: 9 },
  { name: 'Sandwiches', slug: 'sandwiches', rank: 10 },
  { name: 'Salads', slug: 'salads', rank: 11 },
  { name: 'Momos', slug: 'momos', rank: 12 },
  { name: 'Loaded Fries', slug: 'loaded-fries', rank: 13 },
  { name: 'Platters', slug: 'platters', rank: 14 },
  { name: 'Milkshakes & Smoothies', slug: 'milkshakes-smoothies', rank: 15 },
];

const NEW_ITEMS: MenuEntry[] = [
  // ─── Wraps & Rolls (12 items) ─────────────────────────────────────────────
  { slug: 'classic-veg-roll', categorySlug: 'wraps-rolls', dietType: 'veg', classic: { name: 'Classic Veg Roll', description: 'Crunchy veg filling in a soft roll', price: 69, calories: 350 }, healthy: { name: 'Grilled Veg Roll', description: 'Grilled veggies, whole wheat roll', price: 89, calories: 230, protein: 8, fats: 6, carbs: 32, swaps: ['Grilled veggies', 'Whole wheat'] } },
  { slug: 'paneer-tikka-roll', categorySlug: 'wraps-rolls', dietType: 'veg', isFeatured: true, classic: { name: 'Paneer Tikka Roll', description: 'Smoky paneer tikka in rumali roti', price: 99, calories: 420 }, healthy: { name: 'Grilled Paneer Roll', description: 'Grilled paneer, mint yogurt, whole wheat', price: 129, calories: 290, protein: 16, fats: 9, carbs: 35, swaps: ['Grilled paneer', 'Mint yogurt'] } },
  { slug: 'schezwan-veg-roll', categorySlug: 'wraps-rolls', dietType: 'veg', classic: { name: 'Schezwan Veg Roll', description: 'Spicy schezwan veg filling', price: 79, calories: 370 }, healthy: { name: 'Asian Veg Roll', description: 'Stir-fried veggies, low-sodium soy', price: 99, calories: 240, protein: 9, fats: 6, carbs: 34, swaps: ['Stir-fried', 'Low-sodium'] } },
  { slug: 'chicken-tikka-roll', categorySlug: 'wraps-rolls', dietType: 'nonveg', isFeatured: true, classic: { name: 'Chicken Tikka Roll', description: 'Juicy chicken tikka in soft roll', price: 109, calories: 440 }, healthy: { name: 'Grilled Chicken Tikka Roll', description: 'Grilled chicken, whole wheat, fresh veggies', price: 139, calories: 300, protein: 24, fats: 8, carbs: 33, swaps: ['Grilled chicken', 'Whole wheat'] } },
  { slug: 'seekh-kebab-roll', categorySlug: 'wraps-rolls', dietType: 'nonveg', classic: { name: 'Seekh Kebab Roll', description: 'Mutton seekh kebab with onion rings', price: 129, calories: 480 }, healthy: { name: 'Lean Seekh Roll', description: 'Lean mutton kebab, fresh salad', price: 159, calories: 330, protein: 22, fats: 10, carbs: 36, swaps: ['Lean mutton', 'Fresh salad'] } },
  { slug: 'egg-roll', categorySlug: 'wraps-rolls', dietType: 'egg', classic: { name: 'Egg Roll', description: 'Double egg omelette roll with chutney', price: 59, calories: 320 }, healthy: { name: 'Egg White Roll', description: 'Egg whites, whole wheat, spinach', price: 79, calories: 200, protein: 14, fats: 4, carbs: 26, swaps: ['Egg whites', 'Whole wheat'] } },
  { slug: 'falafel-wrap', categorySlug: 'wraps-rolls', dietType: 'veg', isNew: true, classic: { name: 'Falafel Wrap', description: 'Crispy falafel with hummus & tahini', price: 109, calories: 400 }, healthy: { name: 'Baked Falafel Wrap', description: 'Baked falafel, hummus, whole wheat', price: 129, calories: 270, protein: 12, fats: 8, carbs: 38, swaps: ['Baked falafel', 'Whole wheat'] } },
  { slug: 'mushroom-wrap', categorySlug: 'wraps-rolls', dietType: 'veg', classic: { name: 'Mushroom Tikka Wrap', description: 'Grilled mushroom with tandoori sauce', price: 99, calories: 360 }, healthy: { name: 'Mushroom Power Wrap', description: 'Grilled mushroom, quinoa, spinach', price: 119, calories: 240, protein: 10, fats: 7, carbs: 32, swaps: ['Quinoa', 'Spinach'] } },
  { slug: 'fish-finger-roll', categorySlug: 'wraps-rolls', dietType: 'nonveg', isNew: true, classic: { name: 'Fish Finger Roll', description: 'Crispy fish fingers with tartar sauce', price: 119, calories: 430 }, healthy: { name: 'Grilled Fish Roll', description: 'Grilled fish, lemon herb, whole wheat', price: 149, calories: 280, protein: 22, fats: 7, carbs: 30, swaps: ['Grilled fish', 'Lemon herb'] } },
  { slug: 'bbq-chicken-wrap', categorySlug: 'wraps-rolls', dietType: 'nonveg', classic: { name: 'BBQ Chicken Wrap', description: 'BBQ glazed chicken with coleslaw', price: 119, calories: 460 }, healthy: { name: 'BBQ Chicken Clean Wrap', description: 'Grilled chicken, sugar-free BBQ', price: 149, calories: 310, protein: 25, fats: 8, carbs: 35, swaps: ['Sugar-free BBQ', 'Grilled'] } },
  { slug: 'double-egg-wrap', categorySlug: 'wraps-rolls', dietType: 'egg', classic: { name: 'Double Egg Bhurji Wrap', description: 'Spicy egg bhurji with onion & chilli', price: 79, calories: 380 }, healthy: { name: 'Egg White Bhurji Wrap', description: 'Egg white bhurji, whole wheat, veggies', price: 99, calories: 230, protein: 16, fats: 5, carbs: 28, swaps: ['Egg whites', 'Whole wheat'] } },
  { slug: 'tandoori-paneer-wrap', categorySlug: 'wraps-rolls', dietType: 'veg', classic: { name: 'Tandoori Paneer Wrap', description: 'Tandoori marinated paneer with mint', price: 109, calories: 430 }, healthy: { name: 'Tandoori Paneer Light', description: 'Grilled paneer, hung curd dip, whole wheat', price: 139, calories: 290, protein: 17, fats: 9, carbs: 34, swaps: ['Hung curd dip', 'Whole wheat'] } },

  // ─── Rice Bowls (10 items) ────────────────────────────────────────────────
  { slug: 'veg-fried-rice', categorySlug: 'rice-bowls', dietType: 'veg', classic: { name: 'Veg Fried Rice', description: 'Wok-tossed veggies with fragrant rice', price: 99, calories: 420 }, healthy: { name: 'Brown Rice Stir Fry', description: 'Brown rice with stir-fried veggies', price: 119, calories: 290, protein: 8, fats: 7, carbs: 48, swaps: ['Brown rice', 'Less oil'] } },
  { slug: 'paneer-tikka-rice', categorySlug: 'rice-bowls', dietType: 'veg', isFeatured: true, classic: { name: 'Paneer Tikka Rice Bowl', description: 'Paneer tikka over masala rice', price: 129, calories: 480 }, healthy: { name: 'Paneer Quinoa Bowl', description: 'Grilled paneer over quinoa, greens', price: 159, calories: 330, protein: 18, fats: 10, carbs: 40, swaps: ['Quinoa', 'Grilled paneer'] } },
  { slug: 'schezwan-rice', categorySlug: 'rice-bowls', dietType: 'veg', classic: { name: 'Schezwan Fried Rice', description: 'Spicy schezwan fried rice', price: 109, calories: 440 }, healthy: { name: 'Schezwan Brown Rice', description: 'Brown rice, mild schezwan, veggies', price: 129, calories: 300, protein: 9, fats: 8, carbs: 46, swaps: ['Brown rice', 'Mild sauce'] } },
  { slug: 'chicken-rice-bowl', categorySlug: 'rice-bowls', dietType: 'nonveg', isFeatured: true, classic: { name: 'Chicken Rice Bowl', description: 'Grilled chicken over seasoned rice', price: 139, calories: 500 }, healthy: { name: 'Chicken & Quinoa Bowl', description: 'Grilled chicken, quinoa, fresh veggies', price: 169, calories: 350, protein: 28, fats: 9, carbs: 40, swaps: ['Quinoa', 'Grilled chicken'] } },
  { slug: 'egg-fried-rice', categorySlug: 'rice-bowls', dietType: 'egg', classic: { name: 'Egg Fried Rice', description: 'Classic egg fried rice', price: 89, calories: 400 }, healthy: { name: 'Egg White Fried Rice', description: 'Egg whites, brown rice, veggies', price: 109, calories: 270, protein: 14, fats: 6, carbs: 42, swaps: ['Egg whites', 'Brown rice'] } },
  { slug: 'teriyaki-veg-bowl', categorySlug: 'rice-bowls', dietType: 'veg', isNew: true, classic: { name: 'Teriyaki Veg Bowl', description: 'Teriyaki glazed veggies with rice', price: 119, calories: 430 }, healthy: { name: 'Teriyaki Clean Bowl', description: 'Sugar-free teriyaki, brown rice', price: 139, calories: 290, protein: 10, fats: 7, carbs: 45, swaps: ['Sugar-free teriyaki', 'Brown rice'] } },
  { slug: 'butter-chicken-rice', categorySlug: 'rice-bowls', dietType: 'nonveg', isFeatured: true, classic: { name: 'Butter Chicken Rice', description: 'Creamy butter chicken over basmati', price: 159, calories: 560 }, healthy: { name: 'Butter Chicken Lite', description: 'Cashew cream chicken, brown rice', price: 189, calories: 380, protein: 26, fats: 10, carbs: 44, swaps: ['Cashew cream', 'Brown rice'] } },
  { slug: 'mutton-keema-rice', categorySlug: 'rice-bowls', dietType: 'nonveg', classic: { name: 'Mutton Keema Rice', description: 'Spiced mutton keema over rice', price: 169, calories: 540 }, healthy: { name: 'Lean Keema Bowl', description: 'Lean mutton, brown rice, raita', price: 199, calories: 370, protein: 24, fats: 10, carbs: 45, swaps: ['Lean mutton', 'Brown rice'] } },
  { slug: 'thai-basil-rice', categorySlug: 'rice-bowls', dietType: 'veg', classic: { name: 'Thai Basil Rice', description: 'Fragrant Thai basil stir-fried rice', price: 109, calories: 410 }, healthy: { name: 'Thai Basil Brown Rice', description: 'Brown rice, fresh basil, tofu', price: 129, calories: 280, protein: 12, fats: 7, carbs: 42, swaps: ['Brown rice', 'Tofu'] } },
  { slug: 'peri-peri-chicken-rice', categorySlug: 'rice-bowls', dietType: 'nonveg', isNew: true, classic: { name: 'Peri Peri Chicken Rice', description: 'Peri peri chicken over Mexican rice', price: 149, calories: 520 }, healthy: { name: 'Peri Peri Grilled Bowl', description: 'Grilled chicken, quinoa, peri peri', price: 179, calories: 360, protein: 28, fats: 9, carbs: 42, swaps: ['Grilled', 'Quinoa'] } },

  // ─── Pasta (10 items) ─────────────────────────────────────────────────────
  { slug: 'mac-n-cheese', categorySlug: 'pasta', dietType: 'veg', isFeatured: true, classic: { name: 'Mac & Cheese', description: 'Creamy cheddar mac and cheese', price: 119, calories: 480 }, healthy: { name: 'Whole Wheat Mac', description: 'Whole wheat pasta, low-fat cheese', price: 139, calories: 310, protein: 14, fats: 8, carbs: 44, swaps: ['Whole wheat', 'Low-fat cheese'] } },
  { slug: 'penne-arrabiata', categorySlug: 'pasta', dietType: 'veg', classic: { name: 'Penne Arrabiata', description: 'Penne in spicy tomato sauce', price: 109, calories: 400 }, healthy: { name: 'Whole Wheat Arrabiata', description: 'Whole wheat penne, fresh tomato sauce', price: 129, calories: 270, protein: 10, fats: 6, carbs: 42, swaps: ['Whole wheat', 'Fresh tomato'] } },
  { slug: 'white-sauce-pasta', categorySlug: 'pasta', dietType: 'veg', classic: { name: 'White Sauce Pasta', description: 'Creamy white sauce with mushrooms', price: 119, calories: 460 }, healthy: { name: 'Light Alfredo', description: 'Cashew cream alfredo, whole wheat', price: 139, calories: 300, protein: 12, fats: 9, carbs: 40, swaps: ['Cashew cream', 'Whole wheat'] } },
  { slug: 'pesto-pasta', categorySlug: 'pasta', dietType: 'veg', isNew: true, classic: { name: 'Basil Pesto Pasta', description: 'Fresh basil pesto with fusilli', price: 129, calories: 420 }, healthy: { name: 'Clean Pesto Pasta', description: 'Fresh pesto, whole wheat, pine nuts', price: 149, calories: 290, protein: 11, fats: 10, carbs: 38, swaps: ['Whole wheat', 'Less oil'] } },
  { slug: 'chicken-alfredo', categorySlug: 'pasta', dietType: 'nonveg', isFeatured: true, classic: { name: 'Chicken Alfredo', description: 'Grilled chicken in alfredo sauce', price: 149, calories: 520 }, healthy: { name: 'Chicken Alfredo Lite', description: 'Grilled chicken, cashew cream, whole wheat', price: 179, calories: 350, protein: 26, fats: 10, carbs: 40, swaps: ['Cashew cream', 'Whole wheat'] } },
  { slug: 'pink-sauce-chicken', categorySlug: 'pasta', dietType: 'nonveg', classic: { name: 'Pink Sauce Chicken Pasta', description: 'Chicken in rosé sauce', price: 139, calories: 490 }, healthy: { name: 'Pink Sauce Lite', description: 'Grilled chicken, light rosé, whole wheat', price: 169, calories: 330, protein: 24, fats: 9, carbs: 42, swaps: ['Light sauce', 'Whole wheat'] } },
  { slug: 'mushroom-truffle-pasta', categorySlug: 'pasta', dietType: 'veg', classic: { name: 'Mushroom Truffle Pasta', description: 'Wild mushroom with truffle oil', price: 149, calories: 440 }, healthy: { name: 'Mushroom Clean Pasta', description: 'Mushrooms, whole wheat, light truffle', price: 169, calories: 300, protein: 12, fats: 8, carbs: 42, swaps: ['Whole wheat', 'Light truffle'] } },
  { slug: 'spicy-nduja-pasta', categorySlug: 'pasta', dietType: 'nonveg', isNew: true, classic: { name: 'Spicy Nduja Pasta', description: 'Italian sausage in spicy tomato', price: 159, calories: 530 }, healthy: { name: 'Lean Sausage Pasta', description: 'Chicken sausage, whole wheat, fresh tomato', price: 189, calories: 360, protein: 22, fats: 10, carbs: 44, swaps: ['Chicken sausage', 'Whole wheat'] } },
  { slug: 'aglio-olio', categorySlug: 'pasta', dietType: 'veg', classic: { name: 'Aglio e Olio', description: 'Garlic olive oil spaghetti with chilli', price: 99, calories: 380 }, healthy: { name: 'Clean Aglio Olio', description: 'Whole wheat spaghetti, extra virgin', price: 119, calories: 260, protein: 9, fats: 8, carbs: 38, swaps: ['Whole wheat', 'Extra virgin'] } },
  { slug: 'keema-pasta', categorySlug: 'pasta', dietType: 'nonveg', classic: { name: 'Desi Keema Pasta', description: 'Indian-style mutton keema with pasta', price: 149, calories: 510 }, healthy: { name: 'Lean Keema Pasta', description: 'Lean mutton, whole wheat, fresh herbs', price: 179, calories: 350, protein: 24, fats: 10, carbs: 42, swaps: ['Lean mutton', 'Whole wheat'] } },

  // ─── Pizza (10 items) ─────────────────────────────────────────────────────
  { slug: 'margherita', categorySlug: 'pizza', dietType: 'veg', classic: { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 99, calories: 450 }, healthy: { name: 'Thin Crust Margherita', description: 'Whole wheat crust, low-fat mozzarella', price: 119, calories: 290, protein: 12, fats: 8, carbs: 38, swaps: ['Whole wheat crust', 'Low-fat cheese'] } },
  { slug: 'peppy-paneer', categorySlug: 'pizza', dietType: 'veg', isFeatured: true, classic: { name: 'Peppy Paneer Pizza', description: 'Paneer cubes, capsicum, red paprika', price: 129, calories: 500 }, healthy: { name: 'Paneer Thin Crust', description: 'Grilled paneer, whole wheat crust', price: 149, calories: 330, protein: 16, fats: 10, carbs: 40, swaps: ['Whole wheat', 'Grilled paneer'] } },
  { slug: 'farmhouse', categorySlug: 'pizza', dietType: 'veg', classic: { name: 'Farmhouse Pizza', description: 'Loaded with farm-fresh veggies', price: 139, calories: 480 }, healthy: { name: 'Farmhouse Thin', description: 'Whole wheat, extra veggies, light cheese', price: 159, calories: 310, protein: 13, fats: 9, carbs: 42, swaps: ['Whole wheat', 'Light cheese'] } },
  { slug: 'bbq-chicken-pizza', categorySlug: 'pizza', dietType: 'nonveg', isFeatured: true, classic: { name: 'BBQ Chicken Pizza', description: 'BBQ chicken, onion, jalapeño', price: 159, calories: 540 }, healthy: { name: 'BBQ Chicken Thin Crust', description: 'Grilled chicken, sugar-free BBQ, whole wheat', price: 179, calories: 360, protein: 24, fats: 10, carbs: 42, swaps: ['Sugar-free BBQ', 'Whole wheat'] } },
  { slug: 'chicken-supreme', categorySlug: 'pizza', dietType: 'nonveg', classic: { name: 'Chicken Supreme Pizza', description: 'Loaded chicken with all toppings', price: 179, calories: 580 }, healthy: { name: 'Supreme Thin Crust', description: 'Grilled chicken, whole wheat, light cheese', price: 199, calories: 380, protein: 26, fats: 11, carbs: 44, swaps: ['Whole wheat', 'Light cheese'] } },
  { slug: 'mushroom-olive-pizza', categorySlug: 'pizza', dietType: 'veg', classic: { name: 'Mushroom & Olive Pizza', description: 'Mushrooms, black olives, herbs', price: 129, calories: 440 }, healthy: { name: 'Mushroom Olive Thin', description: 'Whole wheat, extra mushrooms', price: 149, calories: 280, protein: 11, fats: 8, carbs: 38, swaps: ['Whole wheat', 'Extra mushrooms'] } },
  { slug: 'corn-capsicum-pizza', categorySlug: 'pizza', dietType: 'veg', classic: { name: 'Corn & Capsicum Pizza', description: 'Sweet corn, capsicum, cheese burst', price: 119, calories: 470 }, healthy: { name: 'Corn Capsicum Lite', description: 'Whole wheat, low-fat cheese, fresh corn', price: 139, calories: 300, protein: 12, fats: 8, carbs: 42, swaps: ['Whole wheat', 'Low-fat'] } },
  { slug: 'butter-chicken-pizza', categorySlug: 'pizza', dietType: 'nonveg', isNew: true, classic: { name: 'Butter Chicken Pizza', description: 'Desi butter chicken on pizza base', price: 169, calories: 560 }, healthy: { name: 'Butter Chicken Thin', description: 'Cashew cream chicken, whole wheat base', price: 189, calories: 370, protein: 24, fats: 10, carbs: 44, swaps: ['Cashew cream', 'Whole wheat'] } },
  { slug: 'peri-peri-paneer-pizza', categorySlug: 'pizza', dietType: 'veg', isNew: true, classic: { name: 'Peri Peri Paneer Pizza', description: 'Spicy peri peri paneer, onion, jalapeño', price: 139, calories: 490 }, healthy: { name: 'Peri Paneer Thin', description: 'Grilled paneer, whole wheat, mild peri', price: 159, calories: 320, protein: 16, fats: 9, carbs: 40, swaps: ['Grilled paneer', 'Mild peri'] } },
  { slug: 'keema-pizza', categorySlug: 'pizza', dietType: 'nonveg', classic: { name: 'Desi Keema Pizza', description: 'Spiced mutton keema with onion & chilli', price: 179, calories: 570 }, healthy: { name: 'Keema Thin Crust', description: 'Lean keema, whole wheat base', price: 199, calories: 380, protein: 22, fats: 11, carbs: 44, swaps: ['Lean mutton', 'Whole wheat'] } },

  // ─── Sandwiches (10 items) ────────────────────────────────────────────────
  { slug: 'classic-grilled-sandwich', categorySlug: 'sandwiches', dietType: 'veg', classic: { name: 'Classic Grilled Sandwich', description: 'Grilled cheese & veggies on white bread', price: 69, calories: 340 }, healthy: { name: 'Multigrain Grilled', description: 'Multigrain bread, low-fat cheese', price: 89, calories: 220, protein: 10, fats: 6, carbs: 30, swaps: ['Multigrain', 'Low-fat'] } },
  { slug: 'paneer-tikka-sandwich', categorySlug: 'sandwiches', dietType: 'veg', isFeatured: true, classic: { name: 'Paneer Tikka Sandwich', description: 'Spiced paneer tikka in toasted bread', price: 89, calories: 400 }, healthy: { name: 'Grilled Paneer Sandwich', description: 'Grilled paneer, multigrain, yogurt spread', price: 109, calories: 270, protein: 16, fats: 8, carbs: 32, swaps: ['Multigrain', 'Yogurt spread'] } },
  { slug: 'club-sandwich', categorySlug: 'sandwiches', dietType: 'nonveg', isFeatured: true, classic: { name: 'Chicken Club Sandwich', description: 'Triple-decker with chicken & bacon', price: 129, calories: 520 }, healthy: { name: 'Clean Club Sandwich', description: 'Grilled chicken, multigrain, fresh veggies', price: 149, calories: 340, protein: 26, fats: 9, carbs: 36, swaps: ['Multigrain', 'Grilled'] } },
  { slug: 'egg-mayo-sandwich', categorySlug: 'sandwiches', dietType: 'egg', classic: { name: 'Egg Mayo Sandwich', description: 'Classic egg mayonnaise on soft bread', price: 69, calories: 360 }, healthy: { name: 'Egg White Sandwich', description: 'Egg whites, multigrain, light mayo', price: 89, calories: 220, protein: 14, fats: 5, carbs: 28, swaps: ['Egg whites', 'Light mayo'] } },
  { slug: 'mushroom-melt', categorySlug: 'sandwiches', dietType: 'veg', classic: { name: 'Mushroom Melt', description: 'Sautéed mushrooms with melted cheese', price: 89, calories: 380 }, healthy: { name: 'Mushroom Light Melt', description: 'Grilled mushrooms, low-fat cheese, multigrain', price: 109, calories: 250, protein: 12, fats: 7, carbs: 32, swaps: ['Low-fat cheese', 'Multigrain'] } },
  { slug: 'chicken-mayo-sandwich', categorySlug: 'sandwiches', dietType: 'nonveg', classic: { name: 'Chicken Mayo Sandwich', description: 'Shredded chicken with mayo & lettuce', price: 99, calories: 420 }, healthy: { name: 'Chicken Light Sandwich', description: 'Grilled chicken, multigrain, yogurt mayo', price: 119, calories: 280, protein: 22, fats: 7, carbs: 32, swaps: ['Yogurt mayo', 'Multigrain'] } },
  { slug: 'bombay-masala-toast', categorySlug: 'sandwiches', dietType: 'veg', classic: { name: 'Bombay Masala Toast', description: 'Iconic Mumbai street-style sandwich', price: 59, calories: 320 }, healthy: { name: 'Masala Multigrain Toast', description: 'Multigrain, baked not fried, fresh veggies', price: 79, calories: 210, protein: 8, fats: 5, carbs: 30, swaps: ['Multigrain', 'Baked'] } },
  { slug: 'tuna-sandwich', categorySlug: 'sandwiches', dietType: 'nonveg', classic: { name: 'Tuna Sandwich', description: 'Tuna salad with lettuce & mayo', price: 119, calories: 400 }, healthy: { name: 'Tuna Light Sandwich', description: 'Tuna, multigrain, yogurt dressing', price: 139, calories: 270, protein: 24, fats: 6, carbs: 30, swaps: ['Yogurt dressing', 'Multigrain'] } },
  { slug: 'corn-cheese-sandwich', categorySlug: 'sandwiches', dietType: 'veg', classic: { name: 'Corn & Cheese Sandwich', description: 'Sweet corn with melted cheese', price: 79, calories: 370 }, healthy: { name: 'Corn Light Sandwich', description: 'Fresh corn, low-fat cheese, multigrain', price: 99, calories: 240, protein: 10, fats: 6, carbs: 34, swaps: ['Low-fat cheese', 'Multigrain'] } },
  { slug: 'bbq-pulled-chicken', categorySlug: 'sandwiches', dietType: 'nonveg', isNew: true, classic: { name: 'BBQ Pulled Chicken Sandwich', description: 'Slow-cooked pulled chicken in BBQ', price: 139, calories: 480 }, healthy: { name: 'Pulled Chicken Clean', description: 'Grilled chicken, sugar-free BBQ, multigrain', price: 159, calories: 320, protein: 26, fats: 8, carbs: 36, swaps: ['Sugar-free BBQ', 'Multigrain'] } },

  // ─── Salads (8 items) ─────────────────────────────────────────────────────
  { slug: 'caesar-salad', categorySlug: 'salads', dietType: 'veg', isFeatured: true, classic: { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, caesar dressing', price: 99, calories: 320 }, healthy: { name: 'Clean Caesar', description: 'Romaine, whole wheat croutons, light dressing', price: 119, calories: 190, protein: 8, fats: 7, carbs: 22, swaps: ['Light dressing', 'WW croutons'] } },
  { slug: 'chicken-caesar', categorySlug: 'salads', dietType: 'nonveg', isFeatured: true, classic: { name: 'Chicken Caesar Salad', description: 'Grilled chicken on caesar salad', price: 139, calories: 420 }, healthy: { name: 'Chicken Caesar Lite', description: 'Grilled chicken, light caesar, whole wheat', price: 159, calories: 280, protein: 24, fats: 8, carbs: 24, swaps: ['Light dressing', 'Grilled'] } },
  { slug: 'greek-salad', categorySlug: 'salads', dietType: 'veg', classic: { name: 'Greek Salad', description: 'Cucumber, tomato, olives, feta', price: 99, calories: 280 }, healthy: { name: 'Greek Clean Salad', description: 'Fresh veggies, low-fat feta, lemon dressing', price: 109, calories: 180, protein: 8, fats: 8, carbs: 18, swaps: ['Low-fat feta', 'Lemon dressing'] } },
  { slug: 'paneer-tikka-salad', categorySlug: 'salads', dietType: 'veg', classic: { name: 'Paneer Tikka Salad', description: 'Grilled paneer tikka on mixed greens', price: 119, calories: 380 }, healthy: { name: 'Paneer Power Salad', description: 'Grilled paneer, quinoa, mixed greens', price: 139, calories: 260, protein: 18, fats: 9, carbs: 26, swaps: ['Quinoa', 'Mixed greens'] } },
  { slug: 'protein-bowl-salad', categorySlug: 'salads', dietType: 'nonveg', classic: { name: 'Protein Power Bowl', description: 'Chicken, eggs, chickpeas, mixed greens', price: 149, calories: 440 }, healthy: { name: 'Clean Protein Bowl', description: 'Grilled chicken, egg whites, quinoa', price: 169, calories: 310, protein: 32, fats: 8, carbs: 28, swaps: ['Egg whites', 'Quinoa'] } },
  { slug: 'thai-crunch-salad', categorySlug: 'salads', dietType: 'veg', isNew: true, classic: { name: 'Thai Crunch Salad', description: 'Crunchy veggies with peanut dressing', price: 109, calories: 340 }, healthy: { name: 'Thai Clean Crunch', description: 'Fresh veggies, light peanut dressing', price: 129, calories: 220, protein: 10, fats: 8, carbs: 26, swaps: ['Light dressing'] } },
  { slug: 'beetroot-feta-salad', categorySlug: 'salads', dietType: 'veg', classic: { name: 'Beetroot & Feta Salad', description: 'Roasted beetroot with feta & walnuts', price: 109, calories: 300 }, healthy: { name: 'Beetroot Clean Salad', description: 'Roasted beet, low-fat feta, balsamic', price: 119, calories: 200, protein: 8, fats: 7, carbs: 24, swaps: ['Low-fat feta', 'Balsamic'] } },
  { slug: 'avocado-salad', categorySlug: 'salads', dietType: 'veg', isNew: true, classic: { name: 'Avocado Salad', description: 'Fresh avocado, cherry tomatoes, lime', price: 129, calories: 320 }, healthy: { name: 'Avo Clean Bowl', description: 'Avocado, mixed greens, quinoa, lime', price: 149, calories: 240, protein: 8, fats: 14, carbs: 22, swaps: ['Quinoa', 'Extra greens'] } },

  // ─── Momos (10 items) ─────────────────────────────────────────────────────
  { slug: 'steamed-veg-momos', categorySlug: 'momos', dietType: 'veg', isFeatured: true, classic: { name: 'Steamed Veg Momos (8pcs)', description: 'Classic steamed veg momos with chutney', price: 69, calories: 280 }, healthy: { name: 'Steamed Veg Momos', description: 'Same classic! Already healthy', price: 69, calories: 280, protein: 8, fats: 5, carbs: 42, swaps: ['Already steamed'] } },
  { slug: 'fried-veg-momos', categorySlug: 'momos', dietType: 'veg', classic: { name: 'Fried Veg Momos (8pcs)', description: 'Crispy fried momos with spicy sauce', price: 79, calories: 380 }, healthy: { name: 'Air-Fried Veg Momos', description: 'Air-fried for less oil', price: 89, calories: 260, protein: 8, fats: 7, carbs: 40, swaps: ['Air-fried'] } },
  { slug: 'tandoori-momos', categorySlug: 'momos', dietType: 'veg', isFeatured: true, classic: { name: 'Tandoori Momos (8pcs)', description: 'Chargrilled momos with tandoori sauce', price: 89, calories: 340 }, healthy: { name: 'Tandoori Momos Lite', description: 'Grilled, less oil, mint chutney', price: 99, calories: 240, protein: 9, fats: 6, carbs: 38, swaps: ['Grilled', 'Mint chutney'] } },
  { slug: 'steamed-chicken-momos', categorySlug: 'momos', dietType: 'nonveg', isFeatured: true, classic: { name: 'Steamed Chicken Momos (8pcs)', description: 'Juicy chicken momos with chutney', price: 89, calories: 320 }, healthy: { name: 'Steamed Chicken Momos', description: 'Already healthy — lean chicken', price: 89, calories: 320, protein: 18, fats: 6, carbs: 40, swaps: ['Already steamed'] } },
  { slug: 'fried-chicken-momos', categorySlug: 'momos', dietType: 'nonveg', classic: { name: 'Fried Chicken Momos (8pcs)', description: 'Crispy fried chicken momos', price: 99, calories: 420 }, healthy: { name: 'Air-Fried Chicken Momos', description: 'Air-fried, less oil', price: 109, calories: 300, protein: 18, fats: 8, carbs: 38, swaps: ['Air-fried'] } },
  { slug: 'cheese-momos', categorySlug: 'momos', dietType: 'veg', isNew: true, classic: { name: 'Cheese Burst Momos (8pcs)', description: 'Momos stuffed with cheese', price: 99, calories: 400 }, healthy: { name: 'Low-Fat Cheese Momos', description: 'Low-fat cheese stuffing, steamed', price: 109, calories: 280, protein: 12, fats: 7, carbs: 40, swaps: ['Low-fat cheese'] } },
  { slug: 'paneer-momos', categorySlug: 'momos', dietType: 'veg', classic: { name: 'Paneer Momos (8pcs)', description: 'Spiced paneer stuffed momos', price: 89, calories: 340 }, healthy: { name: 'Paneer Momos Steamed', description: 'Steamed, cottage cheese filling', price: 89, calories: 260, protein: 14, fats: 6, carbs: 36, swaps: ['Steamed'] } },
  { slug: 'afghani-momos', categorySlug: 'momos', dietType: 'nonveg', classic: { name: 'Afghani Momos (8pcs)', description: 'Creamy Afghani sauce momos', price: 109, calories: 420 }, healthy: { name: 'Afghani Momos Lite', description: 'Light cream, grilled momos', price: 129, calories: 290, protein: 16, fats: 8, carbs: 38, swaps: ['Light cream', 'Grilled'] } },
  { slug: 'schezwan-momos', categorySlug: 'momos', dietType: 'veg', classic: { name: 'Schezwan Momos (8pcs)', description: 'Fiery schezwan sauce fried momos', price: 89, calories: 390 }, healthy: { name: 'Schezwan Momos Lite', description: 'Air-fried, mild schezwan', price: 99, calories: 270, protein: 9, fats: 7, carbs: 38, swaps: ['Air-fried', 'Mild'] } },
  { slug: 'kurkure-momos', categorySlug: 'momos', dietType: 'veg', isNew: true, classic: { name: 'Kurkure Momos (8pcs)', description: 'Extra crunchy coated momos', price: 99, calories: 430 }, healthy: { name: 'Oat-Crusted Momos', description: 'Oat-crusted, baked momos', price: 119, calories: 290, protein: 10, fats: 7, carbs: 42, swaps: ['Oat-crusted', 'Baked'] } },

  // ─── Loaded Fries (8 items) ───────────────────────────────────────────────
  { slug: 'cheese-loaded-fries', categorySlug: 'loaded-fries', dietType: 'veg', isFeatured: true, classic: { name: 'Cheese Loaded Fries', description: 'Fries smothered in cheese sauce', price: 89, calories: 480 }, healthy: { name: 'Light Cheese Fries', description: 'Sweet potato fries, low-fat cheese', price: 109, calories: 300, protein: 8, fats: 10, carbs: 44, swaps: ['Sweet potato', 'Low-fat cheese'] } },
  { slug: 'peri-peri-loaded', categorySlug: 'loaded-fries', dietType: 'veg', isFeatured: true, classic: { name: 'Peri Peri Loaded Fries', description: 'Spicy peri peri fries with dip', price: 89, calories: 440 }, healthy: { name: 'Peri Sweet Potato', description: 'Baked sweet potato, peri peri', price: 109, calories: 270, protein: 6, fats: 8, carbs: 42, swaps: ['Sweet potato', 'Baked'] } },
  { slug: 'mexican-loaded', categorySlug: 'loaded-fries', dietType: 'veg', classic: { name: 'Mexican Loaded Fries', description: 'Fries with salsa, guac, sour cream', price: 99, calories: 500 }, healthy: { name: 'Mexican Sweet Potato', description: 'Sweet potato, fresh salsa, guac', price: 119, calories: 320, protein: 8, fats: 12, carbs: 44, swaps: ['Sweet potato', 'Fresh salsa'] } },
  { slug: 'bbq-chicken-fries', categorySlug: 'loaded-fries', dietType: 'nonveg', isFeatured: true, classic: { name: 'BBQ Chicken Loaded Fries', description: 'Fries with BBQ chicken & cheese', price: 119, calories: 560 }, healthy: { name: 'BBQ Chicken Sweet Potato', description: 'Grilled chicken, sugar-free BBQ', price: 139, calories: 360, protein: 22, fats: 10, carbs: 44, swaps: ['Sweet potato', 'Sugar-free BBQ'] } },
  { slug: 'butter-chicken-fries', categorySlug: 'loaded-fries', dietType: 'nonveg', isNew: true, classic: { name: 'Butter Chicken Fries', description: 'Fries topped with butter chicken gravy', price: 129, calories: 580 }, healthy: { name: 'BC Sweet Potato Fries', description: 'Sweet potato, cashew cream chicken', price: 149, calories: 370, protein: 20, fats: 10, carbs: 46, swaps: ['Sweet potato', 'Cashew cream'] } },
  { slug: 'paneer-tikka-fries', categorySlug: 'loaded-fries', dietType: 'veg', classic: { name: 'Paneer Tikka Fries', description: 'Fries topped with paneer tikka', price: 109, calories: 520 }, healthy: { name: 'Paneer Sweet Potato', description: 'Sweet potato, grilled paneer', price: 129, calories: 330, protein: 14, fats: 10, carbs: 44, swaps: ['Sweet potato', 'Grilled paneer'] } },
  { slug: 'truffle-fries', categorySlug: 'loaded-fries', dietType: 'veg', classic: { name: 'Truffle Parmesan Fries', description: 'Fries with truffle oil & parmesan', price: 119, calories: 460 }, healthy: { name: 'Truffle Sweet Potato', description: 'Sweet potato, light truffle, parmesan', price: 139, calories: 290, protein: 8, fats: 10, carbs: 42, swaps: ['Sweet potato', 'Light truffle'] } },
  { slug: 'keema-fries', categorySlug: 'loaded-fries', dietType: 'nonveg', classic: { name: 'Keema Loaded Fries', description: 'Fries topped with spiced mutton keema', price: 129, calories: 560 }, healthy: { name: 'Lean Keema Fries', description: 'Sweet potato, lean keema', price: 149, calories: 370, protein: 20, fats: 10, carbs: 46, swaps: ['Sweet potato', 'Lean keema'] } },

  // ─── Platters (8 items) ───────────────────────────────────────────────────
  { slug: 'buddy-platter-veg', categorySlug: 'platters', dietType: 'veg', isFeatured: true, classic: { name: 'Veg Buddy Platter', description: '2 burgers + fries + nuggets + 2 dips', price: 299, calories: 1200 }, healthy: { name: 'Veg Clean Platter', description: 'Healthy burgers, sweet potato fries, baked bites', price: 369, calories: 780, protein: 24, fats: 20, carbs: 110, swaps: ['All healthy swaps'] } },
  { slug: 'buddy-platter-nonveg', categorySlug: 'platters', dietType: 'nonveg', isFeatured: true, classic: { name: 'Non-Veg Buddy Platter', description: '2 chicken burgers + wings + fries + dips', price: 349, calories: 1400 }, healthy: { name: 'Non-Veg Clean Platter', description: 'Grilled chicken burgers, grilled wings, sweet potato', price: 429, calories: 880, protein: 40, fats: 22, carbs: 100, swaps: ['All healthy swaps'] } },
  { slug: 'date-night-platter', categorySlug: 'platters', dietType: 'veg', classic: { name: 'Date Night Platter', description: '2 burgers + pasta + fries + 2 shakes', price: 449, calories: 1800 }, healthy: { name: 'Date Night Clean', description: 'Healthy versions of everything', price: 549, calories: 1100, protein: 32, fats: 26, carbs: 150, swaps: ['All healthy swaps'] } },
  { slug: 'party-platter', categorySlug: 'platters', dietType: 'veg', classic: { name: 'Party Platter (serves 4)', description: '4 burgers + loaded fries + nuggets + 4 drinks', price: 599, calories: 3200 }, healthy: { name: 'Party Clean Platter', description: 'Healthy versions for 4', price: 749, calories: 2000, protein: 56, fats: 40, carbs: 280, swaps: ['All healthy swaps'] } },
  { slug: 'momo-platter', categorySlug: 'platters', dietType: 'veg', classic: { name: 'Momo Platter', description: '24 assorted momos + 3 dips', price: 249, calories: 900 }, healthy: { name: 'Steamed Momo Platter', description: '24 steamed momos, healthy dips', price: 279, calories: 720, protein: 24, fats: 12, carbs: 120, swaps: ['All steamed', 'Healthy dips'] } },
  { slug: 'wrap-platter', categorySlug: 'platters', dietType: 'nonveg', classic: { name: 'Wrap Platter', description: '4 assorted wraps + fries + dips', price: 399, calories: 1600 }, healthy: { name: 'Clean Wrap Platter', description: 'Whole wheat wraps, grilled fillings', price: 479, calories: 1000, protein: 48, fats: 24, carbs: 120, swaps: ['Whole wheat', 'Grilled'] } },
  { slug: 'pizza-platter', categorySlug: 'platters', dietType: 'veg', classic: { name: 'Pizza Platter', description: '2 medium pizzas + garlic bread + dips', price: 399, calories: 1600 }, healthy: { name: 'Clean Pizza Platter', description: 'Thin crust, light cheese, salad', price: 459, calories: 960, protein: 32, fats: 24, carbs: 120, swaps: ['Thin crust', 'Light cheese'] } },
  { slug: 'student-platter', categorySlug: 'platters', dietType: 'veg', isNew: true, classic: { name: 'Student Special Platter', description: '2 burgers + fries + 2 cokes — value deal', price: 199, calories: 1100 }, healthy: { name: 'Student Clean Platter', description: 'Healthy burgers, sweet potato, lime water', price: 249, calories: 700, protein: 20, fats: 16, carbs: 100, swaps: ['Sweet potato', 'Lime water'] } },

  // ─── Milkshakes & Smoothies (12 items) ────────────────────────────────────
  { slug: 'strawberry-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', isFeatured: true, classic: { name: 'Strawberry Milkshake', description: 'Creamy strawberry milkshake', price: 99, calories: 400 }, healthy: { name: 'Strawberry Smoothie', description: 'Fresh strawberry, oat milk, no sugar', price: 119, calories: 180, protein: 6, fats: 4, carbs: 28, swaps: ['Oat milk', 'No sugar'] } },
  { slug: 'mango-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', isFeatured: true, classic: { name: 'Mango Milkshake', description: 'Alphonso mango milkshake', price: 109, calories: 420 }, healthy: { name: 'Mango Smoothie', description: 'Fresh mango, oat milk, chia seeds', price: 129, calories: 200, protein: 6, fats: 5, carbs: 32, swaps: ['Oat milk', 'Chia seeds'] } },
  { slug: 'nutella-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Nutella Shake', description: 'Thick Nutella chocolate shake', price: 129, calories: 520 }, healthy: { name: 'Hazelnut Protein Shake', description: 'Hazelnut, cocoa, plant protein, oat milk', price: 149, calories: 280, protein: 20, fats: 8, carbs: 30, swaps: ['Plant protein', 'Oat milk'] } },
  { slug: 'peanut-butter-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Peanut Butter Shake', description: 'Creamy PB milkshake with banana', price: 119, calories: 500 }, healthy: { name: 'PB Protein Shake', description: 'Natural PB, banana, oat milk, protein', price: 139, calories: 300, protein: 22, fats: 12, carbs: 28, swaps: ['Natural PB', 'Oat milk'] } },
  { slug: 'vanilla-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Vanilla Milkshake', description: 'Classic vanilla bean milkshake', price: 89, calories: 380 }, healthy: { name: 'Vanilla Oat Shake', description: 'Vanilla bean, oat milk, honey', price: 109, calories: 180, protein: 6, fats: 4, carbs: 26, swaps: ['Oat milk', 'Honey'] } },
  { slug: 'green-smoothie', categorySlug: 'milkshakes-smoothies', dietType: 'veg', isNew: true, classic: { name: 'Green Smoothie', description: 'Spinach, banana, apple, ginger', price: 99, calories: 200 }, healthy: { name: 'Super Green Smoothie', description: 'Spinach, kale, banana, chia, spirulina', price: 119, calories: 180, protein: 8, fats: 4, carbs: 28, swaps: ['Kale', 'Spirulina'] } },
  { slug: 'berry-blast-smoothie', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Berry Blast Smoothie', description: 'Mixed berries blended thick', price: 109, calories: 220 }, healthy: { name: 'Berry Antioxidant Smoothie', description: 'Berries, oat milk, flax seeds', price: 129, calories: 180, protein: 6, fats: 5, carbs: 26, swaps: ['Flax seeds', 'Oat milk'] } },
  { slug: 'kitkat-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', isFeatured: true, classic: { name: 'KitKat Shake', description: 'Crunchy KitKat blended milkshake', price: 129, calories: 520 }, healthy: { name: 'Protein Cookie Shake', description: 'Protein wafer, oat milk, cocoa', price: 149, calories: 280, protein: 20, fats: 8, carbs: 30, swaps: ['Protein wafer', 'Oat milk'] } },
  { slug: 'banana-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Banana Milkshake', description: 'Creamy banana shake with cinnamon', price: 79, calories: 360 }, healthy: { name: 'Banana Oat Shake', description: 'Banana, oats, oat milk, cinnamon', price: 99, calories: 200, protein: 8, fats: 4, carbs: 32, swaps: ['Oat milk', 'Oats'] } },
  { slug: 'bubblegum-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', isNew: true, classic: { name: 'Bubblegum Shake', description: 'Fun bubblegum flavored shake', price: 109, calories: 440 }, healthy: { name: 'Blueberry Smoothie', description: 'Blueberries, oat milk, no artificial flavor', price: 119, calories: 180, protein: 6, fats: 4, carbs: 28, swaps: ['Natural flavor', 'Oat milk'] } },
  { slug: 'protein-power-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Protein Power Shake', description: 'Whey protein, banana, PB, milk', price: 139, calories: 480 }, healthy: { name: 'Clean Protein Shake', description: 'Plant protein, banana, oat milk', price: 149, calories: 260, protein: 28, fats: 8, carbs: 24, swaps: ['Plant protein', 'Oat milk'] } },
  { slug: 'rose-falooda-shake', categorySlug: 'milkshakes-smoothies', dietType: 'veg', classic: { name: 'Rose Falooda Shake', description: 'Rose syrup, falooda sev, ice cream', price: 119, calories: 460 }, healthy: { name: 'Rose Oat Shake', description: 'Rose water, oat milk, chia, no sugar', price: 129, calories: 200, protein: 6, fats: 4, carbs: 30, swaps: ['Oat milk', 'No sugar'] } },
];

export async function seedBurgerEmpireMenuExtended(prisma: PrismaClient) {
  console.log('Seeding extended BurgerEmpire menu...\n');

  const org = await prisma.organization.findUnique({ where: { slug: 'burgerempire' } });
  if (!org) { console.error('BurgerEmpire org not found!'); process.exit(1); }
  const orgId = org.id;

  // Upsert new categories
  const categoryMap: Record<string, string> = {};

  // Load existing categories first
  const existing = await prisma.catalogCategory.findMany({ where: { orgId } });
  for (const cat of existing) { categoryMap[cat.slug] = cat.id; }

  for (const cat of NEW_CATEGORIES) {
    const created = await prisma.catalogCategory.upsert({
      where: { orgId_slug: { orgId, slug: cat.slug } },
      update: { name: cat.name, rank: cat.rank },
      create: { orgId, name: cat.name, slug: cat.slug, rank: cat.rank, isActive: true },
    });
    categoryMap[cat.slug] = created.id;
    console.log(`  + Category: ${cat.name}`);
  }

  // Seed items
  let count = 0;
  for (const entry of NEW_ITEMS) {
    const categoryId = categoryMap[entry.categorySlug];
    if (!categoryId) { console.warn(`  Skip ${entry.slug} — no category ${entry.categorySlug}`); continue; }

    const item = await prisma.catalogItem.upsert({
      where: { orgId_slug: { orgId, slug: entry.slug } },
      update: { categoryId, dietType: entry.dietType, inStock: true, isFeatured: entry.isFeatured ?? false, isNew: entry.isNew ?? false, sortOrder: 100 + count },
      create: { orgId, categoryId, slug: entry.slug, dietType: entry.dietType, inStock: true, isFeatured: entry.isFeatured ?? false, isNew: entry.isNew ?? false, sortOrder: 100 + count },
    });

    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId, itemId: item.id, variantType: 'classic' } },
      update: { name: entry.classic.name, description: entry.classic.description, price: entry.classic.price, imageUrl: entry.image ?? null, nutritionData: { calories: entry.classic.calories } },
      create: { orgId, itemId: item.id, variantType: 'classic', name: entry.classic.name, description: entry.classic.description, price: entry.classic.price, imageUrl: entry.image ?? null, nutritionData: { calories: entry.classic.calories }, isActive: true },
    });

    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId, itemId: item.id, variantType: 'healthy' } },
      update: { name: entry.healthy.name, description: entry.healthy.description, price: entry.healthy.price, nutritionData: { calories: entry.healthy.calories, protein: entry.healthy.protein, fats: entry.healthy.fats, carbs: entry.healthy.carbs, swaps: entry.healthy.swaps } },
      create: { orgId, itemId: item.id, variantType: 'healthy', name: entry.healthy.name, description: entry.healthy.description, price: entry.healthy.price, nutritionData: { calories: entry.healthy.calories, protein: entry.healthy.protein, fats: entry.healthy.fats, carbs: entry.healthy.carbs, swaps: entry.healthy.swaps }, isActive: true },
    });

    count++;
  }

  console.log(`\n  Seeded ${count} new items (${count * 2} variants)`);

  // ─── Assign images to ALL items (existing + new) ──────────────────────────
  console.log('\n  Assigning Cloudinary images...');
  const images = [
    'burgerempire/menu/desi-masala-crunch',
    'burgerempire/menu/veg-king-burger',
    'burgerempire/menu/paneer-supreme-burger',
    'burgerempire/menu/veg-chilli-loaded-burger',
    'burgerempire/menu/crispy-veg-burger',
    'burgerempire/menu/double-crispy-cheese-burger',
    'burgerempire/menu/aloo-tikki-twist-burger',
    'burgerempire/menu/paneer-wrap',
    'burgerempire/menu/veg-wrap',
    'burgerempire/menu/salted-fries',
    'burgerempire/menu/loaded-fries',
    'burgerempire/menu/peri-peri-fries',
    'burgerempire/menu/oreo-thick-shake',
    'burgerempire/menu/chocolava',
    'burgerempire/menu/combo-4-burgers',
  ];

  const allItems = await prisma.catalogItem.findMany({ where: { orgId } });
  for (let i = 0; i < allItems.length; i++) {
    const img = images[i % images.length];
    await prisma.catalogItemVariant.updateMany({
      where: { itemId: allItems[i]!.id, imageUrl: null },
      data: { imageUrl: img ?? null },
    });
  }
  console.log(`  Assigned images to ${allItems.length} items`);

  // ─── Create shared addon/option groups ────────────────────────────────────
  console.log('\n  Creating addon groups...');

  const OPTION_GROUPS = [
    {
      name: 'Size',
      options: [
        { name: 'Regular', price: 0 },
        { name: 'Large', price: 30 },
        { name: 'Monster', price: 60 },
      ],
    },
    {
      name: 'Extra Cheese',
      options: [
        { name: 'Cheddar Slice', price: 20 },
        { name: 'Mozzarella', price: 25 },
        { name: 'Double Cheese', price: 40 },
      ],
    },
    {
      name: 'Sauces',
      options: [
        { name: 'Mayo', price: 10 },
        { name: 'Chipotle', price: 15 },
        { name: 'Peri Peri', price: 15 },
        { name: 'BBQ', price: 15 },
        { name: 'Schezwan', price: 15 },
      ],
    },
    {
      name: 'Toppings',
      options: [
        { name: 'Extra Patty', price: 40 },
        { name: 'Fried Egg', price: 20 },
        { name: 'Jalapeños', price: 10 },
        { name: 'Onion Rings', price: 20 },
        { name: 'Coleslaw', price: 15 },
      ],
    },
    {
      name: 'Sides Add-on',
      options: [
        { name: 'Small Fries', price: 29 },
        { name: 'Nuggets (4pcs)', price: 49 },
        { name: 'Garlic Bread', price: 39 },
      ],
    },
  ];

  // Apply option groups to all burger/wrap/sandwich/pizza items
  const itemsForAddons = await prisma.catalogItem.findMany({
    where: {
      orgId,
      category: {
        slug: { in: ['burgers', 'pocket-friendly', 'wraps-rolls', 'sandwiches', 'pizza', 'pasta'] },
      },
    },
    select: { id: true },
  });

  let groupCount = 0;
  for (const item of itemsForAddons) {
    // Check if already has option groups
    const existing = await prisma.catalogOptionGroup.count({ where: { itemId: item.id } });
    if (existing > 0) continue;

    for (let gi = 0; gi < OPTION_GROUPS.length; gi++) {
      const group = OPTION_GROUPS[gi]!;
      const optGroup = await prisma.catalogOptionGroup.create({
        data: {
          orgId,
          itemId: item.id,
          name: group.name,
          minSelection: 0,
          maxSelection: group.name === 'Size' ? 1 : 3,
          rank: gi,
        },
      });

      for (let oi = 0; oi < group.options.length; oi++) {
        const opt = group.options[oi]!;
        await prisma.catalogOption.create({
          data: {
            orgId,
            groupId: optGroup.id,
            name: opt.name,
            price: opt.price,
            inStock: true,
            rank: oi,
          },
        });
      }
      groupCount++;
    }
  }
  console.log(`  Created ${groupCount} option groups across ${itemsForAddons.length} items`);

  // Apply drink add-on to momos and sides
  const momoSideItems = await prisma.catalogItem.findMany({
    where: {
      orgId,
      category: { slug: { in: ['momos', 'loaded-fries', 'sides'] } },
    },
    select: { id: true },
  });

  for (const item of momoSideItems) {
    const existing = await prisma.catalogOptionGroup.count({ where: { itemId: item.id } });
    if (existing > 0) continue;

    // Dip selection
    const dipGroup = await prisma.catalogOptionGroup.create({
      data: { orgId, itemId: item.id, name: 'Dips', minSelection: 0, maxSelection: 3, rank: 0 },
    });
    for (const [i, dip] of ['Mayonnaise', 'Schezwan', 'Sweet Chilli', 'Mint Yogurt'].entries()) {
      await prisma.catalogOption.create({
        data: { orgId, groupId: dipGroup.id, name: dip, price: 15, inStock: true, rank: i },
      });
    }

    // Drink add-on
    const drinkGroup = await prisma.catalogOptionGroup.create({
      data: { orgId, itemId: item.id, name: 'Add a Drink', minSelection: 0, maxSelection: 1, rank: 1 },
    });
    for (const [i, drink] of [{ n: 'Coke', p: 30 }, { n: 'Sprite', p: 30 }, { n: 'Mint Mojito', p: 50 }].entries()) {
      await prisma.catalogOption.create({
        data: { orgId, groupId: drinkGroup.id, name: drink.n, price: drink.p, inStock: true, rank: i },
      });
    }
  }
  console.log(`  Added dip & drink options to ${momoSideItems.length} side items`);

  console.log(`\n  Total: ${NEW_CATEGORIES.length} new categories + ${count} new items + images + addons`);
  console.log('Done!');
}
