/**
 * Seed BurgerEmpire catalog items into the Central Backend.
 * Extracted from prisma/seed-menu.ts for modular seeding.
 */
import { PrismaClient } from '@prisma/client';

interface MenuEntry {
  slug: string;
  categorySlug: string;
  dietType: 'veg' | 'nonveg' | 'egg';
  isFeatured?: boolean;
  isNew?: boolean;
  image?: string;
  healthyImage?: string;
  classic: { name: string; description: string; price: number; calories: number };
  healthy: { name: string; description: string; price: number; calories: number; protein: number; fats: number; carbs: number; swaps: string[] };
}

const MENU: MenuEntry[] = [
  // ─── Pocket Friendly ─────────────────────────────────────────────────────
  { slug: 'aloo-tikki', categorySlug: 'pocket-friendly', dietType: 'veg', image: 'burgerempire/menu/aloo-tikki-twist-burger', classic: { name: 'Aloo Tikki Burger', description: 'Classic aloo tikki patty with fresh veggies', price: 45, calories: 320 }, healthy: { name: 'Quinoa Tikki Burger', description: 'Quinoa & sweet potato patty, multigrain bun', price: 75, calories: 220, protein: 8, fats: 7, carbs: 31, swaps: ['Quinoa patty', 'Multigrain bun'] } },
  { slug: 'aloo-tikki-2', categorySlug: 'pocket-friendly', dietType: 'veg', classic: { name: 'Aloo Tikki 2.0 Burger', description: 'Upgraded aloo tikki with extra toppings', price: 59, calories: 360 }, healthy: { name: 'Aloo Tikki Lite', description: 'Baked aloo patty, oat bun, fresh greens', price: 85, calories: 240, protein: 9, fats: 7, carbs: 34, swaps: ['Baked patty', 'Oat bun'] } },
  { slug: 'aloo-tikki-supreme', categorySlug: 'pocket-friendly', dietType: 'veg', classic: { name: 'Aloo Tikki Supreme', description: 'Supreme aloo tikki with cheese & sauce', price: 59, calories: 380 }, healthy: { name: 'Supreme Green Tikki', description: 'Spinach & pea patty, whole wheat bun', price: 89, calories: 250, protein: 10, fats: 8, carbs: 35, swaps: ['Spinach-pea patty', 'Whole wheat bun'] } },
  { slug: 'veg-burger-pf', categorySlug: 'pocket-friendly', dietType: 'veg', image: 'burgerempire/menu/crispy-veg-burger', classic: { name: 'Veg Burger', description: 'Simple veg patty burger with mayo', price: 69, calories: 340 }, healthy: { name: 'Garden Veg Burger', description: 'Grilled veggie patty, herb yogurt spread', price: 95, calories: 230, protein: 8, fats: 7, carbs: 33, swaps: ['Grilled patty', 'Yogurt spread'] } },
  { slug: 'egg-burger-pf', categorySlug: 'pocket-friendly', dietType: 'egg', classic: { name: 'Egg Burger', description: 'Fried egg patty with classic sauce', price: 59, calories: 310 }, healthy: { name: 'Egg White Burger', description: 'Egg white omelette, whole wheat bun', price: 85, calories: 200, protein: 14, fats: 5, carbs: 24, swaps: ['Egg whites only', 'Whole wheat bun'] } },
  { slug: 'chicken-burger-pf', categorySlug: 'pocket-friendly', dietType: 'nonveg', image: 'burgerempire/menu/crispy-veg-burger', classic: { name: 'Chicken Burger', description: 'Crispy chicken patty with lettuce', price: 85, calories: 420 }, healthy: { name: 'Grilled Chicken Lite', description: 'Grilled chicken breast, oat bun', price: 115, calories: 280, protein: 22, fats: 7, carbs: 32, swaps: ['Grilled chicken', 'Oat bun'] } },

  // ─── Veg Burgers ──────────────────────────────────────────────────────────
  { slug: 'makhani-burger', categorySlug: 'burgers', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/desi-masala-crunch', classic: { name: 'Makhani Burger', description: 'Makhani sauce, crispy patty, onion rings', price: 79, calories: 410 }, healthy: { name: 'Makhani Clean Burger', description: 'Cashew makhani, grilled patty, multigrain bun', price: 109, calories: 290, protein: 11, fats: 9, carbs: 41, swaps: ['Cashew makhani', 'Grilled patty', 'Multigrain bun'] } },
  { slug: 'veg-king', categorySlug: 'burgers', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/veg-king-burger', classic: { name: 'Veg King Burger', description: 'King-sized veg patty with cheese', price: 89, calories: 440 }, healthy: { name: 'Veg King Wholesome', description: 'Multigrain patty, avocado, fresh greens', price: 119, calories: 300, protein: 12, fats: 9, carbs: 42, swaps: ['Multigrain patty', 'Avocado spread'] } },
  { slug: 'paneer-tikki', categorySlug: 'burgers', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/paneer-supreme-burger', classic: { name: 'Paneer Tikki Burger', description: 'Crispy paneer tikki with mint chutney', price: 99, calories: 430 }, healthy: { name: 'Grilled Paneer Power', description: 'Grilled paneer, whole wheat bun, herb yogurt', price: 129, calories: 290, protein: 18, fats: 8, carbs: 37, swaps: ['Grilled paneer', 'Whole wheat bun', 'Herb yogurt'] } },
  { slug: 'crispy-veg', categorySlug: 'burgers', dietType: 'veg', classic: { name: 'Crispy Veg Burger', description: 'Extra crispy veg patty with special sauce', price: 99, calories: 400 }, healthy: { name: 'Air-Baked Crispy Veg', description: 'Air-baked patty, brown rice coating', price: 129, calories: 260, protein: 10, fats: 8, carbs: 37, swaps: ['Air-baked', 'Brown rice coating'] } },
  { slug: 'american-burger', categorySlug: 'burgers', dietType: 'veg', classic: { name: 'American Burger', description: 'American-style with pickles & cheddar', price: 109, calories: 460 }, healthy: { name: 'American Lean', description: 'Plant-based patty, low-fat cheddar', price: 139, calories: 300, protein: 14, fats: 9, carbs: 41, swaps: ['Plant-based patty', 'Low-fat cheddar'] } },
  { slug: 'taco-burger', categorySlug: 'burgers', dietType: 'veg', isNew: true, classic: { name: 'Taco Burger', description: 'Taco-spiced patty with salsa & jalapeños', price: 109, calories: 430 }, healthy: { name: 'Taco Fit Burger', description: 'Grilled bean patty, fresh salsa, whole wheat', price: 139, calories: 280, protein: 13, fats: 8, carbs: 38, swaps: ['Bean patty', 'Fresh salsa'] } },
  { slug: 'paneer-crunchy-munchy', categorySlug: 'burgers', dietType: 'veg', classic: { name: 'Paneer Crunchy Munchy', description: 'Crunchy paneer with extra cheese & sauce', price: 139, calories: 530 }, healthy: { name: 'Paneer Power Crunch', description: 'Baked paneer crust, low-fat cheese', price: 169, calories: 330, protein: 20, fats: 9, carbs: 42, swaps: ['Baked crust', 'Low-fat cheese'] } },

  // ─── Non-Veg Burgers ──────────────────────────────────────────────────────
  { slug: 'chicken-crunch', categorySlug: 'burgers', dietType: 'nonveg', isFeatured: true, image: 'burgerempire/menu/crispy-veg-burger', classic: { name: 'Chicken Crunch Burger', description: 'Crispy crunchy chicken with coleslaw', price: 89, calories: 440 }, healthy: { name: 'Grilled Chicken Crunch', description: 'Grilled chicken, fresh slaw, herb yogurt', price: 119, calories: 290, protein: 24, fats: 7, carbs: 32, swaps: ['Grilled chicken', 'Herb yogurt'] } },
  { slug: 'chicken-cheese', categorySlug: 'burgers', dietType: 'nonveg', isFeatured: true, image: 'burgerempire/menu/double-crispy-cheese-burger', classic: { name: 'Chicken Cheese Burger', description: 'Chicken patty with double cheese', price: 99, calories: 480 }, healthy: { name: 'Chicken Cheese Lean', description: 'Grilled chicken, low-fat cheese, whole wheat', price: 129, calories: 310, protein: 26, fats: 8, carbs: 35, swaps: ['Grilled chicken', 'Low-fat cheese'] } },
  { slug: 'crispy-chicken', categorySlug: 'burgers', dietType: 'nonveg', classic: { name: 'Crispy Chicken Burger', description: 'Extra crispy fried chicken patty', price: 109, calories: 490 }, healthy: { name: 'Air-Fried Crispy Chicken', description: 'Air-fried chicken, brown rice coating', price: 139, calories: 320, protein: 25, fats: 8, carbs: 37, swaps: ['Air-fried', 'Brown rice coating'] } },
  { slug: 'chicken-chilli-loaded', categorySlug: 'burgers', dietType: 'nonveg', classic: { name: 'Chicken Chilli Loaded', description: 'Loaded with chilli sauce & fried chicken', price: 149, calories: 540 }, healthy: { name: 'Chilli Chicken Clean', description: 'Grilled chicken, green chilli relish', price: 179, calories: 340, protein: 27, fats: 9, carbs: 39, swaps: ['Grilled chicken', 'Green chilli relish'] } },
  { slug: 'mutton-burger', categorySlug: 'burgers', dietType: 'nonveg', classic: { name: 'Mutton Burger', description: 'Juicy mutton patty with classic sauce', price: 99, calories: 460 }, healthy: { name: 'Lean Mutton Burger', description: 'Lean mutton, whole wheat bun, herb spread', price: 129, calories: 320, protein: 24, fats: 8, carbs: 38, swaps: ['Lean cut', 'Whole wheat bun'] } },
  { slug: 'mutton-crunchy-munchy', categorySlug: 'burgers', dietType: 'nonveg', classic: { name: 'Mutton Crunchy Munchy', description: 'Crunchy mutton with extra everything', price: 149, calories: 580 }, healthy: { name: 'Mutton Power Crunch', description: 'Oat-crusted lean mutton, herb sauce', price: 179, calories: 370, protein: 27, fats: 10, carbs: 44, swaps: ['Oat-crusted', 'Lean mutton'] } },

  // ─── Maharaja ─────────────────────────────────────────────────────────────
  { slug: 'veg-maharaja', categorySlug: 'burgers', dietType: 'veg', classic: { name: 'Veg Maharaja Burger', description: 'King-sized veg patty, premium toppings', price: 149, calories: 580 }, healthy: { name: 'Veg Maharaja Clean', description: 'Premium multigrain patty, avocado, fresh greens', price: 189, calories: 380, protein: 16, fats: 12, carbs: 53, swaps: ['Multigrain patty', 'Avocado'] } },
  { slug: 'paneer-maharaja', categorySlug: 'burgers', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/paneer-supreme-burger', classic: { name: 'Paneer Maharaja Burger', description: 'Giant paneer patty with royal sauce', price: 169, calories: 620 }, healthy: { name: 'Paneer Maharaja Fit', description: 'Grilled paneer, whole wheat, herb spread', price: 209, calories: 400, protein: 24, fats: 11, carbs: 51, swaps: ['Grilled paneer', 'Whole wheat bun'] } },
  { slug: 'chicken-maharaja', categorySlug: 'burgers', dietType: 'nonveg', isFeatured: true, image: 'burgerempire/menu/veg-chilli-loaded-burger', classic: { name: 'Chicken Maharaja Burger', description: 'Premium chicken patty, royal recipe', price: 189, calories: 650 }, healthy: { name: 'Chicken Maharaja Lean', description: 'Grilled chicken breast, multigrain, avocado', price: 229, calories: 420, protein: 32, fats: 11, carbs: 49, swaps: ['Grilled breast', 'Multigrain bun'] } },
  { slug: 'nonveg-dominator', categorySlug: 'burgers', dietType: 'nonveg', isNew: true, classic: { name: 'Non-Veg Dominator', description: 'The ultimate non-veg stack, three proteins', price: 209, calories: 780 }, healthy: { name: 'Protein Dominator', description: 'Triple grilled protein, multigrain bun', price: 259, calories: 500, protein: 42, fats: 12, carbs: 56, swaps: ['Triple grilled protein', 'Multigrain bun'] } },

  // ─── Wraps ────────────────────────────────────────────────────────────────
  { slug: 'crispy-veg-wrap', categorySlug: 'sides', dietType: 'veg', classic: { name: 'Crispy Veg Wrap', description: 'Crispy veg strips in flour tortilla', price: 89, calories: 380 }, healthy: { name: 'Garden Veg Wrap', description: 'Grilled veggies, whole wheat tortilla', price: 119, calories: 250, protein: 10, fats: 8, carbs: 35, swaps: ['Grilled veggies', 'Whole wheat tortilla'] } },
  { slug: 'paneer-wrap', categorySlug: 'sides', dietType: 'veg', classic: { name: 'Paneer Wrap', description: 'Paneer tikka in spiced tortilla', price: 109, calories: 420 }, healthy: { name: 'Grilled Paneer Wrap', description: 'Grilled paneer, hummus, whole wheat', price: 139, calories: 290, protein: 18, fats: 8, carbs: 37, swaps: ['Grilled paneer', 'Hummus'] } },
  { slug: 'chicken-wrap', categorySlug: 'sides', dietType: 'nonveg', isFeatured: true, image: 'burgerempire/menu/paneer-wrap', classic: { name: 'Chicken Wrap', description: 'Spiced chicken in flour tortilla', price: 119, calories: 440 }, healthy: { name: 'Grilled Chicken Wrap', description: 'Grilled chicken, fresh veggies, whole wheat', price: 149, calories: 300, protein: 24, fats: 7, carbs: 34, swaps: ['Grilled chicken', 'Whole wheat'] } },
  { slug: 'mutton-wrap', categorySlug: 'sides', dietType: 'nonveg', classic: { name: 'Mutton Wrap', description: 'Spiced mutton keema in tortilla', price: 179, calories: 500 }, healthy: { name: 'Lean Mutton Wrap', description: 'Lean mutton, fresh greens, whole wheat', price: 209, calories: 340, protein: 22, fats: 9, carbs: 42, swaps: ['Lean mutton', 'Whole wheat'] } },

  // ─── Sides ────────────────────────────────────────────────────────────────
  { slug: 'french-fries', categorySlug: 'sides', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/salted-fries', classic: { name: 'French Fries', description: 'Crispy golden french fries', price: 59, calories: 320 }, healthy: { name: 'Sweet Potato Fries', description: 'Baked sweet potato fries, sea salt', price: 79, calories: 180, protein: 3, fats: 6, carbs: 28, swaps: ['Sweet potato', 'Baked'] } },
  { slug: 'loaded-fries', categorySlug: 'sides', dietType: 'veg', classic: { name: 'Loaded Fries', description: 'Fries loaded with cheese & sauce', price: 79, calories: 450 }, healthy: { name: 'Loaded Sweet Potato', description: 'Baked sweet potato, light cheese', price: 109, calories: 260, protein: 6, fats: 9, carbs: 40, swaps: ['Sweet potato', 'Light cheese'] } },
  { slug: 'veg-nuggets', categorySlug: 'sides', dietType: 'veg', classic: { name: 'Veg Nuggets (10pcs)', description: 'Crispy fried veg nuggets', price: 99, calories: 380 }, healthy: { name: 'Baked Veg Bites (10pcs)', description: 'Oven-baked vegetable bites', price: 119, calories: 220, protein: 8, fats: 7, carbs: 31, swaps: ['Oven-baked'] } },
  { slug: 'chicken-popcorn', categorySlug: 'sides', dietType: 'nonveg', classic: { name: 'Chicken Popcorn (10pcs)', description: 'Crispy bite-sized chicken popcorn', price: 99, calories: 380 }, healthy: { name: 'Grilled Chicken Bites', description: 'Herb-grilled chicken pieces', price: 119, calories: 220, protein: 22, fats: 5, carbs: 22, swaps: ['Grilled'] } },
  { slug: 'hot-wings', categorySlug: 'sides', dietType: 'nonveg', classic: { name: 'Hot Wings (3pcs)', description: 'Spicy fried chicken wings', price: 109, calories: 360 }, healthy: { name: 'Grilled Wings (3pcs)', description: 'Herb-grilled wings', price: 129, calories: 210, protein: 18, fats: 5, carbs: 23, swaps: ['Grilled'] } },

  // ─── Beverages ────────────────────────────────────────────────────────────
  { slug: 'chocolate-shake', categorySlug: 'beverages', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/oreo-thick-shake', classic: { name: 'Chocolate Shake', description: 'Rich chocolate milkshake', price: 99, calories: 420 }, healthy: { name: 'Cacao Protein Shake', description: 'Raw cacao, oat milk, plant protein', price: 129, calories: 220, protein: 18, fats: 5, carbs: 25, swaps: ['Oat milk', 'Plant protein'] } },
  { slug: 'cold-coffee', categorySlug: 'beverages', dietType: 'veg', classic: { name: 'Cold Coffee Shake', description: 'Creamy cold coffee blend', price: 99, calories: 380 }, healthy: { name: 'Clean Coffee Shake', description: 'Cold brew, oat milk, no sugar', price: 119, calories: 160, protein: 8, fats: 5, carbs: 21, swaps: ['Cold brew', 'Oat milk'] } },
  { slug: 'oreo-shake', categorySlug: 'beverages', dietType: 'veg', classic: { name: 'Oreo Shake', description: 'Oreo cookie milkshake', price: 119, calories: 480 }, healthy: { name: 'Cookie Protein Shake', description: 'Protein cookie crumble, oat milk', price: 149, calories: 260, protein: 20, fats: 7, carbs: 30, swaps: ['Protein cookies', 'Oat milk'] } },
  { slug: 'coke', categorySlug: 'beverages', dietType: 'veg', classic: { name: 'Coke / Sprite', description: 'Chilled carbonated drink', price: 30, calories: 140 }, healthy: { name: 'Sparkling Lime', description: 'Sparkling water with fresh lime', price: 40, calories: 5, protein: 0, fats: 0, carbs: 1, swaps: ['No sugar'] } },
  { slug: 'mint-mojito', categorySlug: 'beverages', dietType: 'veg', classic: { name: 'Mint Mojito', description: 'Refreshing mint mojito', price: 70, calories: 160 }, healthy: { name: 'Mint Detox', description: 'Mint, cucumber, lime, no sugar', price: 80, calories: 25, protein: 0, fats: 1, carbs: 4, swaps: ['No sugar', 'Cucumber'] } },

  // ─── Desserts ─────────────────────────────────────────────────────────────
  { slug: 'choco-lava', categorySlug: 'desserts', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/chocolava', classic: { name: 'Choco Lava Cake', description: 'Warm chocolate lava cake', price: 79, calories: 380 }, healthy: { name: 'Dark Choco Lava', description: 'Dark chocolate, reduced sugar', price: 99, calories: 240, protein: 5, fats: 10, carbs: 30, swaps: ['Dark chocolate', 'Less sugar'] } },
  { slug: 'brownie-sundae', categorySlug: 'desserts', dietType: 'veg', classic: { name: 'Brownie Sundae', description: 'Warm brownie with vanilla ice cream', price: 99, calories: 520 }, healthy: { name: 'Protein Brownie Bowl', description: 'Protein brownie, frozen yogurt', price: 129, calories: 280, protein: 15, fats: 8, carbs: 35, swaps: ['Protein brownie', 'Frozen yogurt'] } },

  // ─── Combos ───────────────────────────────────────────────────────────────
  { slug: 'buddy-combo', categorySlug: 'combos', dietType: 'veg', isFeatured: true, image: 'burgerempire/menu/combo-4-burgers', classic: { name: 'Buddy Combo', description: 'Any burger + Fries + Coke', price: 79, calories: 700 }, healthy: { name: 'Buddy Fit Combo', description: 'Healthy burger + Sweet Potato Fries + Lime Water', price: 119, calories: 440, protein: 14, fats: 14, carbs: 64, swaps: ['Sweet potato fries', 'Lime water'] } },
  { slug: 'maharaja-combo', categorySlug: 'combos', dietType: 'veg', classic: { name: 'Maharaja Combo', description: 'Maharaja + Large Fries + Shake', price: 249, calories: 1100 }, healthy: { name: 'Maharaja Fit Combo', description: 'Healthy Maharaja + Sweet Potato + Protein Shake', price: 319, calories: 680, protein: 34, fats: 20, carbs: 91, swaps: ['All healthy swaps'] } },
];

// ─── Category slugs mapping ────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Pocket Friendly', slug: 'pocket-friendly', rank: 0 },
  { name: 'Burgers', slug: 'burgers', rank: 1 },
  { name: 'Sides', slug: 'sides', rank: 2 },
  { name: 'Beverages', slug: 'beverages', rank: 3 },
  { name: 'Desserts', slug: 'desserts', rank: 4 },
  { name: 'Combos', slug: 'combos', rank: 5 },
];

export async function seedBurgerEmpireMenu(prisma: PrismaClient) {
  console.log('Seeding BurgerEmpire menu...\n');

  // Find the BurgerEmpire org
  const org = await prisma.organization.findUnique({ where: { slug: 'burgerempire' } });
  if (!org) {
    console.error('BurgerEmpire org not found! Run main seed first.');
    process.exit(1);
  }

  const orgId = org.id;

  // Upsert categories
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.catalogCategory.upsert({
      where: { orgId_slug: { orgId, slug: cat.slug } },
      update: { name: cat.name, rank: cat.rank },
      create: { orgId, name: cat.name, slug: cat.slug, rank: cat.rank, isActive: true },
    });
    categoryMap[cat.slug] = created.id;
    console.log(`  Category: ${cat.name} (${created.id})`);
  }

  // Seed items
  let itemCount = 0;
  for (const entry of MENU) {
    const categoryId = categoryMap[entry.categorySlug];
    if (!categoryId) {
      console.warn(`  Skipping ${entry.slug} — category ${entry.categorySlug} not found`);
      continue;
    }

    // Upsert the catalog item
    const item = await prisma.catalogItem.upsert({
      where: { orgId_slug: { orgId, slug: entry.slug } },
      update: {
        categoryId,
        dietType: entry.dietType,
        inStock: true,
        isFeatured: entry.isFeatured ?? false,
        isNew: entry.isNew ?? false,
        sortOrder: itemCount,
      },
      create: {
        orgId,
        categoryId,
        slug: entry.slug,
        dietType: entry.dietType,
        inStock: true,
        isFeatured: entry.isFeatured ?? false,
        isNew: entry.isNew ?? false,
        sortOrder: itemCount,
      },
    });

    // Upsert classic variant
    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId, itemId: item.id, variantType: 'classic' } },
      update: {
        name: entry.classic.name,
        description: entry.classic.description,
        price: entry.classic.price,
        imageUrl: entry.image ?? null,
        nutritionData: { calories: entry.classic.calories },
      },
      create: {
        orgId,
        itemId: item.id,
        variantType: 'classic',
        name: entry.classic.name,
        description: entry.classic.description,
        price: entry.classic.price,
        imageUrl: entry.image ?? null,
        nutritionData: { calories: entry.classic.calories },
        isActive: true,
      },
    });

    // Upsert healthy variant
    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId, itemId: item.id, variantType: 'healthy' } },
      update: {
        name: entry.healthy.name,
        description: entry.healthy.description,
        price: entry.healthy.price,
        imageUrl: entry.healthyImage ?? entry.image ?? null,
        nutritionData: {
          calories: entry.healthy.calories,
          protein: entry.healthy.protein,
          fats: entry.healthy.fats,
          carbs: entry.healthy.carbs,
          swaps: entry.healthy.swaps,
        },
      },
      create: {
        orgId,
        itemId: item.id,
        variantType: 'healthy',
        name: entry.healthy.name,
        description: entry.healthy.description,
        price: entry.healthy.price,
        imageUrl: entry.healthyImage ?? entry.image ?? null,
        nutritionData: {
          calories: entry.healthy.calories,
          protein: entry.healthy.protein,
          fats: entry.healthy.fats,
          carbs: entry.healthy.carbs,
          swaps: entry.healthy.swaps,
        },
        isActive: true,
      },
    });

    itemCount++;
  }

  console.log(`\n  Seeded ${itemCount} items with classic + healthy variants`);
  console.log('Done!');
}
