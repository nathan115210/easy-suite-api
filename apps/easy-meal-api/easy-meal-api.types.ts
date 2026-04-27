export interface Meal {
  title: string;
  slug: string;
  image: string;
  description: string;
  ingredients: MealIngredient[];
  instructions: MealInstruction[];
  cookTime?: number; // in minutes
  difficulty?: DifficultyLevel;
  nutritionInfo?: NutritionInfo;
  mealType?: MealType[];
  tags?: string[];
  topTags?: string[]; // first 3 items from tags, handled by GraphQL server
}

export interface MealIngredient {
  text: string;
  amount: string;
}

export interface MealInstruction {
  image?: string;
  step: number;
  text: string;
}

export enum DifficultyLevel {
  Any = 'any',
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface NutritionInfo {
  calories: number; // per serving
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
}

export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snacks = 'snacks',
  Dessert = 'dessert',
  Drinks = 'drinks',
}

export enum CookTimeValue {
  Any = 'any',
  Under15 = 'under_15',
  Under30 = 'under_30',
  Under45 = 'under_45',
  Under60 = 'under_60',
  Over60 = 'over_60',
}
export enum CaloriesValue {
  Any = 'any',
  Under400 = 'under_400',
  Under600 = 'under_600',
  Under800 = 'under_800',
}
