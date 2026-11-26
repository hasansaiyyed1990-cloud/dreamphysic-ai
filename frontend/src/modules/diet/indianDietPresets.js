/**
 * Indian diet presets for DreamPhysic AI.
 *
 * Nutrition values are practical estimates for common Indian portions.
 * Raw/cooked labels are explicit because the same food changes weight and
 * nutrition density after cooking.
 */

/**
 * @typedef {Object} IndianFoodPreset
 * @property {string} id
 * @property {string} name
 * @property {string} portionLabel
 * @property {number} servingGrams
 * @property {number} kcal
 * @property {number} proteinG
 * @property {number} carbsG
 * @property {number} fatG
 * @property {string} category
 * @property {string[]} tags
 */

/**
 * @typedef {Object} SavedMealCombo
 * @property {string} id
 * @property {string} name
 * @property {{ foodId: string, quantity: number }[]} items
 * @property {number} kcal
 * @property {number} proteinG
 * @property {number} carbsG
 * @property {number} fatG
 * @property {string} useCase
 */

export const OIL_MULTIPLIER_PRESETS = Object.freeze({
  HOME_LESS_OIL: 0.85,
  NORMAL: 1.0,
  RESTAURANT_OILY: 1.3,
});

/** @type {IndianFoodPreset[]} */
export const INDIAN_DIET_PRESETS = [
  { id: 'whey-protein-1-scoop', name: 'Whey Protein', portionLabel: '1 Scoop', servingGrams: 30, kcal: 120, proteinG: 24, carbsG: 3, fatG: 1.5, category: 'Protein', tags: ['post-workout', 'quick'] },
  { id: 'paneer-raw-100g', name: 'Paneer', portionLabel: '100g (Raw)', servingGrams: 100, kcal: 265, proteinG: 18, carbsG: 3.6, fatG: 20, category: 'Protein', tags: ['vegetarian', 'raw'] },
  { id: 'paneer-cooked-100g', name: 'Paneer', portionLabel: '100g (Cooked)', servingGrams: 100, kcal: 290, proteinG: 18, carbsG: 4, fatG: 22, category: 'Protein', tags: ['vegetarian', 'cooked'] },
  { id: 'chicken-breast-raw-100g', name: 'Chicken Breast', portionLabel: '100g (Raw)', servingGrams: 100, kcal: 120, proteinG: 22, carbsG: 0, fatG: 2.6, category: 'Protein', tags: ['lean', 'raw'] },
  { id: 'chicken-breast-cooked-100g', name: 'Chicken Breast', portionLabel: '100g (Cooked)', servingGrams: 100, kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, category: 'Protein', tags: ['lean', 'cooked'] },
  { id: 'whole-egg-1-piece', name: 'Whole Egg', portionLabel: '1 Piece', servingGrams: 50, kcal: 72, proteinG: 6.3, carbsG: 0.4, fatG: 5, category: 'Protein', tags: ['breakfast'] },
  { id: 'egg-white-1-piece', name: 'Egg White', portionLabel: '1 Piece', servingGrams: 33, kcal: 17, proteinG: 3.6, carbsG: 0.2, fatG: 0.1, category: 'Protein', tags: ['lean', 'breakfast'] },
  { id: 'oats-dry-40g', name: 'Oats', portionLabel: '40g (Dry)', servingGrams: 40, kcal: 156, proteinG: 5.3, carbsG: 26.5, fatG: 2.7, category: 'Carbs', tags: ['breakfast', 'dry'] },
  { id: 'oats-cooked-1-katori', name: 'Oats', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 150, proteinG: 5, carbsG: 27, fatG: 2.5, category: 'Carbs', tags: ['breakfast', 'cooked'] },
  { id: 'white-rice-raw-100g', name: 'White Rice', portionLabel: '100g (Raw)', servingGrams: 100, kcal: 365, proteinG: 7, carbsG: 80, fatG: 0.7, category: 'Carbs', tags: ['raw'] },
  { id: 'white-rice-cooked-1-katori', name: 'White Rice', portionLabel: '1 Medium Katori', servingGrams: 150, kcal: 205, proteinG: 4.3, carbsG: 45, fatG: 0.4, category: 'Carbs', tags: ['cooked'] },
  { id: 'brown-rice-raw-100g', name: 'Brown Rice', portionLabel: '100g (Raw)', servingGrams: 100, kcal: 370, proteinG: 7.9, carbsG: 77, fatG: 2.9, category: 'Carbs', tags: ['raw', 'fibre'] },
  { id: 'brown-rice-cooked-1-katori', name: 'Brown Rice', portionLabel: '1 Medium Katori', servingGrams: 150, kcal: 215, proteinG: 5, carbsG: 45, fatG: 1.8, category: 'Carbs', tags: ['cooked', 'fibre'] },
  { id: 'roti-1-piece', name: 'Roti', portionLabel: '1 Piece', servingGrams: 35, kcal: 105, proteinG: 3, carbsG: 18, fatG: 2, category: 'Carbs', tags: ['daily'] },
  { id: 'dal-1-katori', name: 'Dal', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 180, proteinG: 9, carbsG: 27, fatG: 4, category: 'Protein', tags: ['vegetarian', 'daily'] },
  { id: 'curd-1-katori', name: 'Curd', portionLabel: '1 Medium Katori', servingGrams: 150, kcal: 100, proteinG: 5, carbsG: 7, fatG: 5, category: 'Dairy', tags: ['vegetarian'] },
  { id: 'banana-1-piece', name: 'Banana', portionLabel: '1 Piece', servingGrams: 118, kcal: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, category: 'Fruit', tags: ['pre-workout', 'post-workout'] },
  { id: 'peanut-butter-1-tbsp', name: 'Peanut Butter', portionLabel: '1 Tbsp', servingGrams: 16, kcal: 95, proteinG: 4, carbsG: 3, fatG: 8, category: 'Fats', tags: ['calorie-dense'] },
  { id: 'soya-chunks-dry-50g', name: 'Soya Chunks', portionLabel: '50g (Dry)', servingGrams: 50, kcal: 173, proteinG: 26, carbsG: 16, fatG: 0.5, category: 'Protein', tags: ['vegetarian', 'dry'] },
  { id: 'soya-chunks-cooked-1-katori', name: 'Soya Chunks', portionLabel: '1 Medium Katori', servingGrams: 180, kcal: 160, proteinG: 20, carbsG: 12, fatG: 2, category: 'Protein', tags: ['vegetarian', 'cooked'] },
  { id: 'poha-1-katori', name: 'Poha', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 250, proteinG: 4, carbsG: 45, fatG: 6, category: 'Breakfast', tags: ['vegetarian'] },
  { id: 'upma-1-katori', name: 'Upma', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 260, proteinG: 5, carbsG: 42, fatG: 8, category: 'Breakfast', tags: ['vegetarian'] },
  { id: 'idli-1-piece', name: 'Idli', portionLabel: '1 Piece', servingGrams: 40, kcal: 58, proteinG: 2, carbsG: 12, fatG: 0.4, category: 'Breakfast', tags: ['vegetarian', 'light'] },
  { id: 'dosa-1-piece', name: 'Dosa', portionLabel: '1 Piece', servingGrams: 90, kcal: 168, proteinG: 4, carbsG: 30, fatG: 4, category: 'Breakfast', tags: ['vegetarian'] },
  { id: 'sprouts-1-katori', name: 'Sprouts', portionLabel: '1 Medium Katori', servingGrams: 150, kcal: 160, proteinG: 11, carbsG: 25, fatG: 1, category: 'Protein', tags: ['vegetarian', 'fibre'] },
  { id: 'milk-250ml', name: 'Milk', portionLabel: '1 Glass', servingGrams: 250, kcal: 150, proteinG: 8, carbsG: 12, fatG: 8, category: 'Dairy', tags: ['daily'] },
  { id: 'hung-curd-100g', name: 'Hung Curd', portionLabel: '100g', servingGrams: 100, kcal: 97, proteinG: 10, carbsG: 4, fatG: 5, category: 'Dairy', tags: ['vegetarian', 'high-protein'] },
  { id: 'chana-boiled-1-katori', name: 'Boiled Chana', portionLabel: '1 Medium Katori', servingGrams: 180, kcal: 210, proteinG: 11, carbsG: 35, fatG: 3, category: 'Protein', tags: ['vegetarian', 'fibre'] },
  { id: 'rajma-1-katori', name: 'Rajma', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 220, proteinG: 12, carbsG: 38, fatG: 2, category: 'Protein', tags: ['vegetarian', 'fibre'] },
  { id: 'chole-1-katori', name: 'Chole', portionLabel: '1 Medium Katori', servingGrams: 200, kcal: 240, proteinG: 11, carbsG: 36, fatG: 6, category: 'Protein', tags: ['vegetarian', 'fibre'] },
  { id: 'aloo-sabzi-1-katori', name: 'Aloo Sabzi', portionLabel: '1 Medium Katori', servingGrams: 180, kcal: 180, proteinG: 3, carbsG: 28, fatG: 6, category: 'Sabzi', tags: ['vegetarian'] },
  { id: 'mixed-veg-sabzi-1-katori', name: 'Mixed Veg Sabzi', portionLabel: '1 Medium Katori', servingGrams: 180, kcal: 140, proteinG: 4, carbsG: 18, fatG: 6, category: 'Sabzi', tags: ['vegetarian', 'fibre'] },
  { id: 'paneer-bhurji-1-katori', name: 'Paneer Bhurji', portionLabel: '1 Medium Katori', servingGrams: 180, kcal: 280, proteinG: 18, carbsG: 8, fatG: 20, category: 'Protein', tags: ['vegetarian', 'high-protein'] },
  { id: 'egg-bhurji-2-eggs', name: 'Egg Bhurji', portionLabel: '2 Eggs', servingGrams: 120, kcal: 210, proteinG: 13, carbsG: 3, fatG: 16, category: 'Protein', tags: ['breakfast'] },
  { id: 'chicken-curry-1-katori', name: 'Chicken Curry', portionLabel: '1 Medium Katori', servingGrams: 220, kcal: 260, proteinG: 28, carbsG: 6, fatG: 13, category: 'Protein', tags: ['high-protein'] },
  { id: 'fish-grilled-100g', name: 'Grilled Fish', portionLabel: '100g (Cooked)', servingGrams: 100, kcal: 150, proteinG: 26, carbsG: 0, fatG: 5, category: 'Protein', tags: ['lean', 'cooked'] },
  { id: 'tuna-canned-100g', name: 'Canned Tuna', portionLabel: '100g', servingGrams: 100, kcal: 132, proteinG: 28, carbsG: 0, fatG: 1, category: 'Protein', tags: ['lean', 'quick'] },
  { id: 'protein-bar-1-piece', name: 'Protein Bar', portionLabel: '1 Piece', servingGrams: 60, kcal: 210, proteinG: 20, carbsG: 22, fatG: 7, category: 'Protein', tags: ['snack', 'quick'] },
  { id: 'apple-1-piece', name: 'Apple', portionLabel: '1 Piece', servingGrams: 182, kcal: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, category: 'Fruit', tags: ['snack'] },
  { id: 'orange-1-piece', name: 'Orange', portionLabel: '1 Piece', servingGrams: 131, kcal: 62, proteinG: 1.2, carbsG: 15, fatG: 0.2, category: 'Fruit', tags: ['snack'] },
  { id: 'almonds-10-piece', name: 'Almonds', portionLabel: '10 Piece', servingGrams: 12, kcal: 70, proteinG: 2.5, carbsG: 2.5, fatG: 6, category: 'Fats', tags: ['snack'] },
  { id: 'walnuts-4-piece', name: 'Walnuts', portionLabel: '4 Piece', servingGrams: 16, kcal: 105, proteinG: 2.5, carbsG: 2, fatG: 10, category: 'Fats', tags: ['snack'] },
  { id: 'ghee-1-tsp', name: 'Ghee', portionLabel: '1 Tsp', servingGrams: 5, kcal: 45, proteinG: 0, carbsG: 0, fatG: 5, category: 'Fats', tags: ['oil'] },
  { id: 'olive-oil-1-tsp', name: 'Olive Oil', portionLabel: '1 Tsp', servingGrams: 4.5, kcal: 40, proteinG: 0, carbsG: 0, fatG: 4.5, category: 'Fats', tags: ['oil'] },
  { id: 'sugar-1-tsp', name: 'Sugar', portionLabel: '1 Tsp', servingGrams: 4, kcal: 16, proteinG: 0, carbsG: 4, fatG: 0, category: 'Carbs', tags: ['sweetener'] },
  { id: 'honey-1-tbsp', name: 'Honey', portionLabel: '1 Tbsp', servingGrams: 21, kcal: 64, proteinG: 0, carbsG: 17, fatG: 0, category: 'Carbs', tags: ['sweetener'] },
];

/** @type {SavedMealCombo[]} */
export const SAVED_MEAL_COMBOS = [
  {
    id: 'post-workout-whey-banana',
    name: 'Post-Workout Whey + Banana',
    items: [
      { foodId: 'whey-protein-1-scoop', quantity: 1 },
      { foodId: 'banana-1-piece', quantity: 1 },
    ],
    kcal: 225,
    proteinG: 25.3,
    carbsG: 30,
    fatG: 1.9,
    useCase: 'Fast protein and carbs after training.',
  },
  {
    id: 'paneer-bhurji-2-roti',
    name: 'High-Protein Paneer Bhurji + 2 Roti',
    items: [
      { foodId: 'paneer-bhurji-1-katori', quantity: 1 },
      { foodId: 'roti-1-piece', quantity: 2 },
    ],
    kcal: 490,
    proteinG: 24,
    carbsG: 44,
    fatG: 24,
    useCase: 'Vegetarian high-protein lunch or dinner.',
  },
  {
    id: 'egg-white-omelette-oats',
    name: 'Egg White Omelette + Oats',
    items: [
      { foodId: 'egg-white-1-piece', quantity: 4 },
      { foodId: 'whole-egg-1-piece', quantity: 1 },
      { foodId: 'oats-cooked-1-katori', quantity: 1 },
    ],
    kcal: 290,
    proteinG: 25.7,
    carbsG: 28.2,
    fatG: 7.9,
    useCase: 'Lean breakfast with steady carbs.',
  },
  {
    id: 'chicken-rice-bowl',
    name: 'Chicken Rice Bowl',
    items: [
      { foodId: 'chicken-breast-cooked-100g', quantity: 1.5 },
      { foodId: 'white-rice-cooked-1-katori', quantity: 1 },
      { foodId: 'mixed-veg-sabzi-1-katori', quantity: 1 },
    ],
    kcal: 593,
    proteinG: 54.8,
    carbsG: 63,
    fatG: 11.8,
    useCase: 'High-protein muscle-gain meal.',
  },
  {
    id: 'soya-curry-rice',
    name: 'Soya Curry + Rice',
    items: [
      { foodId: 'soya-chunks-cooked-1-katori', quantity: 1 },
      { foodId: 'white-rice-cooked-1-katori', quantity: 1 },
      { foodId: 'curd-1-katori', quantity: 1 },
    ],
    kcal: 465,
    proteinG: 29.3,
    carbsG: 64,
    fatG: 7.4,
    useCase: 'Budget vegetarian protein meal.',
  },
  {
    id: 'sprouts-curd-snack',
    name: 'Sprouts + Curd Snack',
    items: [
      { foodId: 'sprouts-1-katori', quantity: 1 },
      { foodId: 'hung-curd-100g', quantity: 1 },
    ],
    kcal: 257,
    proteinG: 21,
    carbsG: 29,
    fatG: 6,
    useCase: 'Evening snack with protein and fibre.',
  },
  {
    id: 'peanut-butter-banana-oats',
    name: 'Peanut Butter Banana Oats',
    items: [
      { foodId: 'oats-dry-40g', quantity: 1 },
      { foodId: 'banana-1-piece', quantity: 1 },
      { foodId: 'peanut-butter-1-tbsp', quantity: 1 },
      { foodId: 'milk-250ml', quantity: 1 },
    ],
    kcal: 506,
    proteinG: 18.6,
    carbsG: 68.5,
    fatG: 19.1,
    useCase: 'Calorie-dense breakfast for gaining.',
  },
  {
    id: 'dal-roti-sabzi-plate',
    name: 'Dal Roti Sabzi Plate',
    items: [
      { foodId: 'dal-1-katori', quantity: 1 },
      { foodId: 'roti-1-piece', quantity: 2 },
      { foodId: 'mixed-veg-sabzi-1-katori', quantity: 1 },
      { foodId: 'curd-1-katori', quantity: 1 },
    ],
    kcal: 630,
    proteinG: 24,
    carbsG: 88,
    fatG: 15,
    useCase: 'Balanced Indian home meal.',
  },
];

/**
 * Adjusts calories and fat for cooking-oil level.
 * Protein and carbs stay unchanged.
 *
 * @param {IndianFoodPreset} food
 * @param {keyof typeof OIL_MULTIPLIER_PRESETS} [oilPreset]
 * @returns {{ kcal: number, proteinG: number, carbsG: number, fatG: number }}
 */
export function getAdjustedNutrition(food, oilPreset = 'NORMAL') {
  const multiplier = OIL_MULTIPLIER_PRESETS[oilPreset] ?? OIL_MULTIPLIER_PRESETS.NORMAL;
  const adjustedFatG = food.fatG * multiplier;
  const fatCalorieDelta = (adjustedFatG - food.fatG) * 9;

  return {
    kcal: Math.round(food.kcal + fatCalorieDelta),
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: Number(adjustedFatG.toFixed(1)),
  };
}

export default INDIAN_DIET_PRESETS;
