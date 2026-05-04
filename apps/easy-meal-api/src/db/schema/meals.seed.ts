import { inArray } from 'drizzle-orm';
import type { DifficultyLevel, Meal } from '../../../easy-meal-api.types';
import { DifficultyLevel as DifficultyLevelValue, MealType } from '../../../easy-meal-api.types';
import type { db } from '../index';
import { mealIngredientsTable } from './meal-ingredients.table';
import { mealInstructionsTable } from './meal-instructions.table';
import { mealTypesTable } from './meal-types.table';
import { mealNutritionTable } from './meal-nutrition.table';
import { mealsTable } from './meals.table';
import { mealTags, tags as tagsTable } from './tags.table';

export type SeedMealsResult = {
  inserted: number;
  skipped: number;
};

type SeedDatabase = typeof db;

const mealsSeedData: Meal[] = [
  {
    title: 'Simple Tomato Pasta',
    slug: 'simple-tomato-pasta',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509803/easy-meal/simple-tomato-pasta_yolx2v.jpg',
    description: 'Quick, simple pasta with a light tomato sauce, perfect for busy evenings.',
    cookTime: 20,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 550,
      protein: 18,
      carbs: 75,
      fat: 16,
    },
    mealType: [MealType.Dinner],
    tags: ['quick', 'vegetarian', '30-minutes-or-less'],
    ingredients: [
      { text: 'Spaghetti', amount: '120 g' },
      { text: 'Olive oil', amount: '1 tbsp' },
      { text: 'Garlic cloves, minced', amount: '2' },
      { text: 'Canned chopped tomatoes', amount: '200 g' },
      { text: 'Salt', amount: 'to taste' },
      { text: 'Black pepper', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Cook spaghetti in salted boiling water until al dente. Reserve a little pasta water.',
      },
      {
        step: 2,
        text: 'Gently fry garlic in olive oil until fragrant, then add tomatoes and simmer 5-10 minutes.',
      },
      {
        step: 3,
        text: 'Toss pasta with the sauce, adding a splash of pasta water if needed. Season with salt and pepper.',
      },
    ],
  },
  {
    title: 'Protein Scrambled Eggs on Toast',
    slug: 'protein-scrambled-eggs-on-toast',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509802/easy-meal/scrambled-eggs-toast_ehbyu9.jpg',
    description: 'Fluffy scrambled eggs on wholegrain toast for a fast, high-protein breakfast.',
    cookTime: 10,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 430,
      protein: 28,
      carbs: 35,
      fat: 17,
    },
    mealType: [MealType.Breakfast],
    tags: ['high-protein', 'quick', 'breakfast'],
    ingredients: [
      { text: 'Eggs', amount: '3' },
      { text: 'Skim milk', amount: '30 ml' },
      { text: 'Wholegrain bread slices', amount: '2' },
      { text: 'Salt', amount: 'a pinch' },
      { text: 'Black pepper', amount: 'a pinch' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Whisk eggs with milk, salt, and pepper in a bowl.',
      },
      {
        step: 2,
        text: 'Toast the bread. Cook the eggs in a non-stick pan over low heat, stirring gently.',
      },
      {
        step: 3,
        text: 'Serve scrambled eggs on toast and season to taste.',
      },
    ],
  },
  {
    title: 'Greek Yogurt Berry Bowl',
    slug: 'greek-yogurt-berry-bowl',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509805/easy-meal/yogurt-parfait-with-granola_hebmuk.jpg',
    description: 'Refreshing breakfast bowl with Greek yogurt, berries, and crunchy nuts.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 320,
      protein: 22,
      carbs: 30,
      fat: 10,
    },
    mealType: [MealType.Breakfast, MealType.Snacks],
    tags: ['high-protein', 'no-cook', 'light'],
    ingredients: [
      { text: 'Greek yogurt (2%)', amount: '200 g' },
      { text: 'Mixed berries (fresh or frozen)', amount: '80 g' },
      { text: 'Honey or maple syrup', amount: '1 tsp' },
      { text: 'Chopped nuts (almonds/walnuts)', amount: '10 g' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Add Greek yogurt to a bowl.',
      },
      {
        step: 2,
        text: 'Top with berries and chopped nuts.',
      },
      {
        step: 3,
        text: 'Drizzle with honey or maple syrup and serve immediately.',
      },
    ],
  },
  {
    title: 'One-Pan Chicken & Veggie Traybake',
    slug: 'one-pan-chicken-veggie-traybake',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509801/easy-meal/one-pan-chicken-veggie_fyc8nb.jpg',
    description:
      'Sheet-pan chicken and vegetables for an easy, balanced dinner with minimal cleanup.',
    cookTime: 35,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 620,
      protein: 45,
      carbs: 40,
      fat: 26,
    },
    mealType: [MealType.Dinner],
    tags: ['high-protein', 'sheet-pan', 'family-friendly'],
    ingredients: [
      { text: 'Chicken thighs, boneless skinless', amount: '2-3 pcs (300 g)' },
      { text: 'Small potatoes', amount: '200 g' },
      { text: 'Carrots', amount: '100 g' },
      { text: 'Broccoli florets', amount: '120 g' },
      { text: 'Olive oil', amount: '1.5 tbsp' },
      { text: 'Paprika', amount: '1 tsp' },
      { text: 'Garlic powder', amount: '1 tsp' },
      { text: 'Salt & pepper', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Preheat oven to 200 C. Line a baking tray with parchment paper.',
      },
      {
        step: 2,
        text: 'Cut potatoes and carrots into bite-sized pieces. Toss all vegetables with olive oil and spices.',
      },
      {
        step: 3,
        text: 'Place chicken thighs on the tray and surround them with vegetables.',
      },
      {
        step: 4,
        text: 'Bake for 25-30 minutes until chicken is cooked through and vegetables are tender.',
      },
    ],
  },
  {
    title: 'Chocolate Banana Overnight Oats',
    slug: 'chocolate-banana-overnight-oats',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509799/easy-meal/chocolate-banana-overnight-oats_ym2rub.jpg',
    description:
      'Make-ahead chocolate overnight oats with banana for an easy grab-and-go breakfast.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 410,
      protein: 18,
      carbs: 55,
      fat: 12,
    },
    mealType: [MealType.Breakfast, MealType.Snacks],
    tags: ['make-ahead', 'meal-prep', 'high-fiber'],
    ingredients: [
      { text: 'Rolled oats', amount: '50 g' },
      { text: 'Skim milk or plant milk', amount: '150 ml' },
      { text: 'Cocoa powder (unsweetened)', amount: '1 tbsp' },
      { text: 'Banana, sliced', amount: '1 small' },
      { text: 'Chia seeds (optional)', amount: '1 tsp' },
    ],
    instructions: [
      {
        step: 1,
        text: 'In a jar, mix oats, milk, cocoa powder, and chia seeds.',
      },
      {
        step: 2,
        text: 'Stir well, top with banana slices, and cover.',
      },
      {
        step: 3,
        text: 'Refrigerate for at least 4 hours or overnight before serving.',
      },
    ],
  },
  {
    title: 'Grilled Chicken Salad Bowl',
    slug: 'grilled-chicken-salad-bowl',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509802/easy-meal/grilled-chicken-salad-bowl_rys5io.jpg',
    description: 'High-protein salad with grilled chicken, crunchy veggies, and a light dressing.',
    cookTime: 25,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 480,
      protein: 40,
      carbs: 20,
      fat: 22,
    },
    mealType: [MealType.Lunch, MealType.Dinner],
    tags: ['high-protein', 'gluten-free', 'salad'],
    ingredients: [
      { text: 'Chicken breast', amount: '180 g' },
      { text: 'Mixed salad leaves', amount: '80 g' },
      { text: 'Cherry tomatoes', amount: '80 g' },
      { text: 'Cucumber', amount: '50 g' },
      { text: 'Olive oil', amount: '1 tbsp' },
      { text: 'Lemon juice', amount: '1 tbsp' },
      { text: 'Salt & pepper', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Season chicken breast with salt and pepper, then grill or pan-sear until cooked through.',
      },
      {
        step: 2,
        text: 'Add salad leaves, halved cherry tomatoes, and sliced cucumber to a bowl.',
      },
      {
        step: 3,
        text: 'Slice the chicken and place on top of the salad.',
      },
      {
        step: 4,
        text: 'Drizzle with olive oil and lemon juice just before serving.',
      },
    ],
  },
  {
    title: 'Tuna Avocado Rice Bowl',
    slug: 'tuna-avocado-rice-bowl',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509804/easy-meal/tuna-avocado-rice-bowl_z4uze1.jpg',
    description: 'Quick rice bowl with canned tuna, creamy avocado, and crunchy vegetables.',
    cookTime: 15,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 520,
      protein: 30,
      carbs: 55,
      fat: 18,
    },
    mealType: [MealType.Lunch, MealType.Dinner],
    tags: ['quick', 'high-protein', 'bowl'],
    ingredients: [
      { text: 'Cooked rice', amount: '180 g' },
      { text: 'Canned tuna in water, drained', amount: '1 can (120 g)' },
      { text: 'Avocado, diced', amount: '1/2' },
      { text: 'Cucumber, diced', amount: '50 g' },
      { text: 'Soy sauce or tamari', amount: '1 tbsp' },
      { text: 'Sesame seeds', amount: '1 tsp' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Add warm cooked rice to a bowl.',
      },
      {
        step: 2,
        text: 'Top with drained tuna, diced avocado, and cucumber.',
      },
      {
        step: 3,
        text: 'Drizzle with soy sauce and sprinkle sesame seeds on top.',
      },
    ],
  },
  {
    title: 'Veggie Stir-Fry with Tofu',
    slug: 'veggie-stir-fry-with-tofu',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509805/easy-meal/veggie-stir-fry-tofu_vrocsa.jpg',
    description: 'Colorful vegetable stir-fry with crispy tofu, served over rice or noodles.',
    cookTime: 25,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 540,
      protein: 24,
      carbs: 60,
      fat: 20,
    },
    mealType: [MealType.Dinner],
    tags: ['vegetarian', 'stir-fry', 'one-pan'],
    ingredients: [
      { text: 'Firm tofu, cubed', amount: '200 g' },
      { text: 'Bell pepper, sliced', amount: '1' },
      { text: 'Broccoli florets', amount: '120 g' },
      { text: 'Carrot, sliced', amount: '1 small' },
      { text: 'Soy sauce', amount: '2 tbsp' },
      { text: 'Garlic, minced', amount: '2 cloves' },
      { text: 'Ginger, grated', amount: '1 tsp' },
      { text: 'Neutral oil', amount: '1 tbsp' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Pat tofu dry and pan-fry in oil until golden on all sides. Remove and set aside.',
      },
      {
        step: 2,
        text: 'In the same pan, stir-fry garlic, ginger, and vegetables for 5-7 minutes.',
      },
      {
        step: 3,
        text: 'Add tofu back to the pan, pour in soy sauce, and toss to coat evenly.',
      },
      {
        step: 4,
        text: 'Serve hot over rice or noodles.',
      },
    ],
  },
  {
    title: 'Baked Salmon with Sweet Potato',
    slug: 'baked-salmon-with-sweet-potato',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509800/easy-meal/baked-salmon-sweet-potato_l23z81.jpg',
    description: 'Oven-baked salmon fillet with roasted sweet potato and green beans.',
    cookTime: 30,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 600,
      protein: 38,
      carbs: 45,
      fat: 24,
    },
    mealType: [MealType.Dinner],
    tags: ['high-protein', 'omega-3', 'balanced'],
    ingredients: [
      { text: 'Salmon fillet', amount: '180 g' },
      { text: 'Sweet potato, cubed', amount: '200 g' },
      { text: 'Green beans', amount: '80 g' },
      { text: 'Olive oil', amount: '1 tbsp' },
      { text: 'Salt & pepper', amount: 'to taste' },
      { text: 'Lemon wedges', amount: 'to serve' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Preheat oven to 200 C. Toss sweet potato cubes with half the olive oil, salt, and pepper, and roast for 10 minutes.',
      },
      {
        step: 2,
        text: 'Add salmon and green beans to the tray. Drizzle with remaining oil, season, and bake for another 12-15 minutes.',
      },
      {
        step: 3,
        text: 'Serve with lemon wedges on the side.',
      },
    ],
  },
  {
    title: 'Peanut Butter Banana Smoothie',
    slug: 'peanut-butter-banana-smoothie',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509802/easy-meal/peanut-butter-banana-smoothie_dryxi0.jpg',
    description:
      'Creamy smoothie with banana, peanut butter, and milk for a quick breakfast or snack.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 380,
      protein: 15,
      carbs: 40,
      fat: 16,
    },
    mealType: [MealType.Breakfast, MealType.Drinks, MealType.Snacks],
    tags: ['drink', 'on-the-go', 'high-energy'],
    ingredients: [
      { text: 'Banana, frozen or fresh', amount: '1 medium' },
      { text: 'Peanut butter', amount: '1.5 tbsp' },
      { text: 'Milk or plant milk', amount: '200 ml' },
      { text: 'Ice cubes (optional)', amount: '2-3' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Add banana, peanut butter, and milk to a blender.',
      },
      {
        step: 2,
        text: 'Blend until smooth, adding ice cubes if desired.',
      },
      {
        step: 3,
        text: 'Pour into a glass and serve immediately.',
      },
    ],
  },
  {
    title: 'Cottage Cheese Protein Bowl',
    slug: 'cottage-cheese-protein-bowl',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509800/easy-meal/cottage-cheese-protein-bowl_liie48.jpg',
    description: 'High-protein cottage cheese bowl with fruit and seeds for a light meal or snack.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 300,
      protein: 24,
      carbs: 20,
      fat: 10,
    },
    mealType: [MealType.Breakfast, MealType.Snacks],
    tags: ['high-protein', 'no-cook', 'light'],
    ingredients: [
      { text: 'Low-fat cottage cheese', amount: '200 g' },
      { text: 'Cherry tomatoes or fruit of choice', amount: '60 g' },
      { text: 'Pumpkin or sunflower seeds', amount: '1 tbsp' },
      { text: 'Salt & pepper or honey', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Add cottage cheese to a bowl.',
      },
      {
        step: 2,
        text: 'Top with sliced fruit or tomatoes and seeds.',
      },
      {
        step: 3,
        text: 'Season with salt and pepper for savory, or drizzle honey for sweet.',
      },
    ],
  },
  {
    title: 'Turkey & Hummus Wrap',
    slug: 'turkey-and-hummus-wrap',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509804/easy-meal/turkey-hummus-wrap_nhbbp6.jpg',
    description: 'Wholegrain wrap filled with turkey, hummus, and crunchy vegetables.',
    cookTime: 10,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 420,
      protein: 28,
      carbs: 40,
      fat: 14,
    },
    mealType: [MealType.Lunch],
    tags: ['wrap', 'on-the-go', 'high-protein'],
    ingredients: [
      { text: 'Wholegrain tortilla', amount: '1 large' },
      { text: 'Sliced turkey breast', amount: '80 g' },
      { text: 'Hummus', amount: '2 tbsp' },
      { text: 'Lettuce leaves', amount: '2-3' },
      { text: 'Cucumber, sliced', amount: '40 g' },
      { text: 'Grated carrot', amount: '20 g' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Spread hummus over the tortilla.',
      },
      {
        step: 2,
        text: 'Layer turkey, lettuce, cucumber, and grated carrot on top.',
      },
      {
        step: 3,
        text: 'Roll up tightly and slice in half to serve.',
      },
    ],
  },
  {
    title: 'Chickpea Spinach Curry',
    slug: 'chickpea-spinach-curry',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509799/easy-meal/chickpea-spinach-curry_xzuj3e.jpg',
    description: 'Comforting chickpea curry with spinach and tomatoes, served with rice.',
    cookTime: 30,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 520,
      protein: 20,
      carbs: 65,
      fat: 16,
    },
    mealType: [MealType.Dinner],
    tags: ['vegan', 'one-pot', 'comfort'],
    ingredients: [
      { text: 'Canned chickpeas, drained', amount: '240 g' },
      { text: 'Spinach, fresh or frozen', amount: '100 g' },
      { text: 'Canned chopped tomatoes', amount: '200 g' },
      { text: 'Onion, diced', amount: '1 small' },
      { text: 'Garlic cloves, minced', amount: '2' },
      { text: 'Curry powder', amount: '1.5 tsp' },
      { text: 'Oil', amount: '1 tbsp' },
      { text: 'Cooked rice', amount: 'to serve' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Saute onion and garlic in oil until soft.',
      },
      {
        step: 2,
        text: 'Add curry powder and fry briefly, then add tomatoes and chickpeas.',
      },
      {
        step: 3,
        text: 'Simmer for 10-15 minutes, then stir in spinach until wilted.',
      },
      {
        step: 4,
        text: 'Serve hot over cooked rice.',
      },
    ],
  },
  {
    title: 'Oven-Baked Oatmeal Squares',
    slug: 'oven-baked-oatmeal-squares',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509802/easy-meal/oven-baked-oatmeal-squares_mkgusp.jpg',
    description: 'Batch-friendly baked oatmeal you can cut into squares for breakfast or snacks.',
    cookTime: 35,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 260,
      protein: 9,
      carbs: 36,
      fat: 8,
    },
    mealType: [MealType.Breakfast, MealType.Snacks, MealType.Dessert],
    tags: ['meal-prep', 'baked', 'high-fiber'],
    ingredients: [
      { text: 'Rolled oats', amount: '150 g' },
      { text: 'Milk or plant milk', amount: '350 ml' },
      { text: 'Egg', amount: '1' },
      { text: 'Banana, mashed', amount: '1 small' },
      { text: 'Baking powder', amount: '1 tsp' },
      { text: 'Cinnamon', amount: '1 tsp' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Preheat oven to 180 C and line a small baking dish with parchment.',
      },
      {
        step: 2,
        text: 'Mix oats, milk, egg, mashed banana, baking powder, and cinnamon in a bowl.',
      },
      {
        step: 3,
        text: 'Pour mixture into the baking dish and bake for 25-30 minutes until set.',
      },
      {
        step: 4,
        text: 'Cool slightly, then cut into squares and store in the fridge.',
      },
    ],
  },
  {
    title: 'Garlic Shrimp Pasta',
    slug: 'garlic-shrimp-pasta',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509799/easy-meal/garlic-shrimp-pasta_vtwmvt.jpg',
    description: 'Quick pasta with sauteed shrimp, garlic, and a light olive oil sauce.',
    cookTime: 20,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 580,
      protein: 32,
      carbs: 65,
      fat: 18,
    },
    mealType: [MealType.Dinner],
    tags: ['seafood', 'quick', 'pasta'],
    ingredients: [
      { text: 'Spaghetti or linguine', amount: '140 g' },
      { text: 'Shrimp, peeled and deveined', amount: '160 g' },
      { text: 'Garlic cloves, minced', amount: '3' },
      { text: 'Olive oil', amount: '1.5 tbsp' },
      { text: 'Chili flakes (optional)', amount: '1/4 tsp' },
      { text: 'Parsley, chopped', amount: '1 tbsp' },
      { text: 'Salt & pepper', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Cook pasta in salted water until al dente. Reserve some pasta water.',
      },
      {
        step: 2,
        text: 'Saute garlic (and chili flakes, if using) in olive oil over low heat, then add shrimp and cook until pink.',
      },
      {
        step: 3,
        text: 'Toss cooked pasta with the shrimp and garlic oil, adding a splash of pasta water if needed.',
      },
      {
        step: 4,
        text: 'Season to taste and finish with chopped parsley.',
      },
    ],
  },
  {
    title: 'Caprese Sandwich',
    slug: 'caprese-sandwich',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509800/easy-meal/caprese-sandwich_pumnzk.jpg',
    description: 'Tomato, mozzarella, and basil sandwich with a drizzle of balsamic.',
    cookTime: 10,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 430,
      protein: 18,
      carbs: 45,
      fat: 18,
    },
    mealType: [MealType.Lunch, MealType.Snacks],
    tags: ['vegetarian', 'sandwich', 'no-cook'],
    ingredients: [
      { text: 'Crusty bread or ciabatta', amount: '2 slices' },
      { text: 'Fresh mozzarella, sliced', amount: '60 g' },
      { text: 'Tomato, sliced', amount: '1 medium' },
      { text: 'Fresh basil leaves', amount: 'a handful' },
      { text: 'Balsamic glaze', amount: '1 tsp' },
      { text: 'Olive oil', amount: '1 tsp' },
      { text: 'Salt & pepper', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Lightly toast the bread if desired.',
      },
      {
        step: 2,
        text: 'Layer mozzarella, tomato slices, and basil on one slice.',
      },
      {
        step: 3,
        text: 'Drizzle with olive oil and balsamic glaze, season, and top with the second slice.',
      },
    ],
  },
  {
    title: 'Hearty Lentil Veggie Soup',
    slug: 'hearty-lentil-veggie-soup',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509803/easy-meal/hearty-lentil-veggie-soup_wqsy3s.jpg',
    description:
      'Warm lentil soup with mixed vegetables, perfect for meal prep lunches or light dinners.',
    cookTime: 40,
    difficulty: DifficultyLevelValue.Medium,
    nutritionInfo: {
      calories: 360,
      protein: 20,
      carbs: 50,
      fat: 8,
    },
    mealType: [MealType.Lunch, MealType.Dinner],
    tags: ['vegan', 'meal-prep', 'one-pot'],
    ingredients: [
      { text: 'Dried lentils, rinsed', amount: '150 g' },
      { text: 'Carrot, diced', amount: '1' },
      { text: 'Celery stalk, diced', amount: '1' },
      { text: 'Onion, diced', amount: '1 small' },
      { text: 'Garlic cloves, minced', amount: '2' },
      { text: 'Canned tomatoes', amount: '200 g' },
      { text: 'Vegetable broth', amount: '800 ml' },
      { text: 'Olive oil', amount: '1 tbsp' },
      { text: 'Salt, pepper, dried herbs', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Saute onion, carrot, celery, and garlic in olive oil until softened.',
      },
      {
        step: 2,
        text: 'Add lentils, tomatoes, broth, and herbs. Bring to a boil.',
      },
      {
        step: 3,
        text: 'Reduce heat and simmer for 25-30 minutes until lentils are tender.',
      },
      {
        step: 4,
        text: 'Adjust seasoning and serve warm.',
      },
    ],
  },
  {
    title: 'Berry Protein Smoothie',
    slug: 'berry-protein-smoothie',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509808/easy-meal/berry-protein-smoothie_bb5g2o.jpg',
    description:
      'Smoothie with mixed berries and protein powder for a refreshing, high-protein drink.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 300,
      protein: 25,
      carbs: 30,
      fat: 6,
    },
    mealType: [MealType.Breakfast, MealType.Drinks],
    tags: ['drink', 'high-protein', 'on-the-go'],
    ingredients: [
      { text: 'Mixed berries, frozen', amount: '100 g' },
      { text: 'Protein powder (vanilla or neutral)', amount: '1 scoop (~30 g)' },
      { text: 'Water or milk', amount: '200 ml' },
      { text: 'Ice cubes (optional)', amount: '2-3' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Add berries, protein powder, and liquid to a blender.',
      },
      {
        step: 2,
        text: 'Blend until smooth, adding ice cubes if you want it thicker.',
      },
    ],
  },
  {
    title: 'Smashed Chickpea Toast',
    slug: 'smashed-chickpea-toast',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509805/easy-meal/smashed-chickpea-toast_du48hi.jpg',
    description: 'Protein-rich smashed chickpeas on wholegrain toast with lemon and herbs.',
    cookTime: 10,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 340,
      protein: 14,
      carbs: 42,
      fat: 10,
    },
    mealType: [MealType.Breakfast, MealType.Snacks],
    tags: ['vegetarian', 'toast', 'quick'],
    ingredients: [
      { text: 'Canned chickpeas, drained', amount: '100 g' },
      { text: 'Wholegrain bread slices', amount: '2' },
      { text: 'Olive oil', amount: '1 tsp' },
      { text: 'Lemon juice', amount: '1 tsp' },
      { text: 'Salt, pepper, dried herbs', amount: 'to taste' },
    ],
    instructions: [
      {
        step: 1,
        text: 'Mash chickpeas with a fork, mixing in olive oil, lemon juice, salt, and herbs.',
      },
      {
        step: 2,
        text: 'Toast the bread and spread the smashed chickpeas on top.',
      },
      {
        step: 3,
        text: 'Finish with extra herbs or pepper if desired.',
      },
    ],
  },
  {
    title: 'Yogurt Parfait with Granola',
    slug: 'yogurt-parfait-with-granola',
    image:
      'https://res.cloudinary.com/dkmshcwga/image/upload/t_Tablet/v1765509805/easy-meal/yogurt-parfait-with-granola_hebmuk.jpg',
    description: 'Layered yogurt parfait with fruit and granola, great as breakfast or dessert.',
    cookTime: 5,
    difficulty: DifficultyLevelValue.Easy,
    nutritionInfo: {
      calories: 360,
      protein: 16,
      carbs: 45,
      fat: 12,
    },
    mealType: [MealType.Breakfast, MealType.Dessert],
    tags: ['no-cook', 'layered', 'sweet'],
    ingredients: [
      { text: 'Greek yogurt', amount: '180 g' },
      { text: 'Granola', amount: '40 g' },
      { text: 'Fresh fruit (berries or sliced fruit)', amount: '60 g' },
      { text: 'Honey', amount: '1 tsp' },
    ],
    instructions: [
      {
        step: 1,
        text: 'In a glass or bowl, layer yogurt, fruit, and granola.',
      },
      {
        step: 2,
        text: 'Repeat layers if needed and finish with a drizzle of honey.',
      },
    ],
  },
];

export async function seedMeals(database: SeedDatabase): Promise<SeedMealsResult> {
  return database.transaction(async (tx) => {
    const existingMeals = await tx.select({ slug: mealsTable.slug }).from(mealsTable);
    const existingMealSlugs = new Set(existingMeals.map((meal) => meal.slug));
    let inserted = 0;
    let skipped = 0;

    for (const meal of mealsSeedData) {
      if (existingMealSlugs.has(meal.slug)) {
        skipped += 1;
        continue;
      }

      const [createdMeal] = await tx
        .insert(mealsTable)
        .values({
          title: meal.title,
          slug: meal.slug,
          image: meal.image,
          description: meal.description,
          cookTime: meal.cookTime,
          difficulty: toSeedDifficulty(meal.difficulty),
        })
        .returning({ id: mealsTable.id });

      if (!createdMeal) {
        throw new Error(`Failed to seed meal: ${meal.slug}`);
      }

      if (meal.nutritionInfo) {
        await tx.insert(mealNutritionTable).values({
          mealId: createdMeal.id,
          calories: meal.nutritionInfo.calories,
          protein: meal.nutritionInfo.protein,
          carbs: meal.nutritionInfo.carbs,
          fat: meal.nutritionInfo.fat,
        });
      }

      if (meal.ingredients.length > 0) {
        await tx.insert(mealIngredientsTable).values(
          meal.ingredients.map((ingredient, index) => ({
            mealId: createdMeal.id,
            text: ingredient.text,
            amount: ingredient.amount,
            sortOrder: index,
          })),
        );
      }

      if (meal.instructions.length > 0) {
        await tx.insert(mealInstructionsTable).values(
          meal.instructions.map((instruction) => ({
            mealId: createdMeal.id,
            image: instruction.image,
            text: instruction.text,
            sortOrder: instruction.step - 1,
          })),
        );
      }

      const seedMealTypes = [...new Set(meal.mealType ?? [])].filter(
        (mealType) => mealType !== MealType.Any,
      );

      if (seedMealTypes.length > 0) {
        await tx.insert(mealTypesTable).values(
          seedMealTypes.map((mealType) => ({
            mealId: createdMeal.id,
            mealType,
          })),
        );
      }

      const seedTagSlugs = [...new Set((meal.tags ?? []).map(slugify))];
      const existingTags =
        seedTagSlugs.length > 0
          ? await tx
              .select({
                id: tagsTable.id,
                slug: tagsTable.slug,
              })
              .from(tagsTable)
              .where(inArray(tagsTable.slug, seedTagSlugs))
          : [];

      const tagIdsBySlug = new Map(existingTags.map((tag) => [tag.slug, tag.id]));
      const missingTags = seedTagSlugs.filter((tagSlug) => !tagIdsBySlug.has(tagSlug));

      if (missingTags.length > 0) {
        const insertedTags = await tx
          .insert(tagsTable)
          .values(
            missingTags.map((tagSlug) => ({
              name: tagSlug,
              slug: tagSlug,
            })),
          )
          .returning({
            id: tagsTable.id,
            slug: tagsTable.slug,
          });

        for (const tag of insertedTags) {
          tagIdsBySlug.set(tag.slug, tag.id);
        }
      }

      await tx.insert(mealTags).values(
        seedTagSlugs.map((tagSlug, index) => {
          const tagId = tagIdsBySlug.get(tagSlug);

          if (!tagId) {
            throw new Error(`Failed to seed tag: ${tagSlug}`);
          }

          return {
            mealId: createdMeal.id,
            tagId,
            sortOrder: index,
          };
        }),
      );

      existingMealSlugs.add(meal.slug);
      inserted += 1;
    }

    return {
      inserted,
      skipped,
    };
  });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSeedDifficulty(difficulty: DifficultyLevel | undefined) {
  if (!difficulty || difficulty === DifficultyLevelValue.Any) {
    return undefined;
  }

  return difficulty;
}
