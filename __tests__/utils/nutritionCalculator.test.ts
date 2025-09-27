import { NutritionCalculator } from '../../src/utils/nutritionCalculator';

describe('NutritionCalculator', () => {
  describe('generateRandomNutrition', () => {
    it('should generate nutrition data for default food', () => {
      const nutrition = NutritionCalculator.generateRandomNutrition(100, 'unknown food');
      
      expect(nutrition).toHaveProperty('calories');
      expect(nutrition).toHaveProperty('protein');
      expect(nutrition).toHaveProperty('carbs');
      expect(nutrition).toHaveProperty('fat');
      expect(nutrition).toHaveProperty('fiber');
      expect(nutrition).toHaveProperty('sugar');
      expect(nutrition).toHaveProperty('sodium');
      expect(nutrition).toHaveProperty('cholesterol');
      
      expect(typeof nutrition.calories).toBe('number');
      expect(typeof nutrition.protein).toBe('number');
      expect(typeof nutrition.carbs).toBe('number');
      expect(typeof nutrition.fat).toBe('number');
      expect(typeof nutrition.fiber).toBe('number');
    });

    it('should scale nutrition values based on quantity', () => {
      const nutrition50g = NutritionCalculator.generateRandomNutrition(50, 'chicken');
      const nutrition200g = NutritionCalculator.generateRandomNutrition(200, 'chicken');
      
      // 200g should have roughly 4x the nutrition of 50g (accounting for randomness)
      expect(nutrition200g.calories).toBeGreaterThan(nutrition50g.calories);
      expect(nutrition200g.protein).toBeGreaterThan(nutrition50g.protein);
    });

    it('should recognize specific food types', () => {
      const chickenNutrition = NutritionCalculator.generateRandomNutrition(100, 'Grilled Chicken');
      const riceNutrition = NutritionCalculator.generateRandomNutrition(100, 'Brown Rice');
      
      // Chicken should have more protein, less carbs than rice
      expect(chickenNutrition.protein).toBeGreaterThan(riceNutrition.protein);
      expect(riceNutrition.carbs).toBeGreaterThan(chickenNutrition.carbs);
    });

    it('should handle different food names correctly', () => {
      const foods = ['chicken breast', 'banana', 'apple', 'bread', 'salmon'];
      
      foods.forEach(food => {
        const nutrition = NutritionCalculator.generateRandomNutrition(100, food);
        expect(nutrition.calories).toBeGreaterThan(0);
        expect(nutrition.protein).toBeGreaterThanOrEqual(0);
        expect(nutrition.carbs).toBeGreaterThanOrEqual(0);
        expect(nutrition.fat).toBeGreaterThanOrEqual(0);
        expect(nutrition.fiber).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate different values with randomness', () => {
      // Generate multiple nutrition profiles for the same food
      const nutritions = Array.from({ length: 5 }, () => 
        NutritionCalculator.generateRandomNutrition(100, 'chicken')
      );
      
      // Check that values vary due to randomness
      const calories = nutritions.map(n => n.calories);
      const uniqueCalories = new Set(calories);
      
      // Should have some variation due to random factor
      expect(uniqueCalories.size).toBeGreaterThan(1);
    });

    it('should handle zero quantity', () => {
      const nutrition = NutritionCalculator.generateRandomNutrition(0, 'chicken');
      expect(nutrition.calories).toBe(0);
      expect(nutrition.protein).toBe(0);
      expect(nutrition.carbs).toBe(0);
      expect(nutrition.fat).toBe(0);
      expect(nutrition.fiber).toBe(0);
    });

    it('should calculate sugar as fraction of carbs', () => {
      const nutrition = NutritionCalculator.generateRandomNutrition(100, 'apple');
      
      // Sugar should be roughly 30% of carbs
      expect(nutrition.sugar).toBeLessThanOrEqual(nutrition.carbs);
      expect(nutrition.sugar).toBeGreaterThanOrEqual(0);
    });

    it('should generate reasonable sodium and cholesterol values', () => {
      const nutrition = NutritionCalculator.generateRandomNutrition(100, 'chicken');
      
      expect(nutrition.sodium).toBeGreaterThanOrEqual(0);
      expect(nutrition.sodium).toBeLessThanOrEqual(500);
      expect(nutrition.cholesterol).toBeGreaterThanOrEqual(0);
      expect(nutrition.cholesterol).toBeLessThanOrEqual(50);
    });

    it('should match expected nutrition patterns for common foods', () => {
      // Test multiple samples to account for randomness
      const chickenSamples = Array.from({ length: 5 }, () => 
        NutritionCalculator.generateRandomNutrition(100, 'chicken breast')
      );
      
      // Most chicken samples should be high protein
      const highProteinChickens = chickenSamples.filter(c => c.protein > 15);
      expect(highProteinChickens.length).toBeGreaterThan(2);
      
      // Test carb-rich food
      const riceSamples = Array.from({ length: 5 }, () => 
        NutritionCalculator.generateRandomNutrition(100, 'rice')
      );
      
      // Most rice samples should be high carb
      const highCarbRice = riceSamples.filter(r => r.carbs > 15);
      expect(highCarbRice.length).toBeGreaterThan(2);
      
      // Test fruit - should generally be lower calorie
      const appleSamples = Array.from({ length: 5 }, () => 
        NutritionCalculator.generateRandomNutrition(100, 'apple')
      );
      
      const lowCalApples = appleSamples.filter(a => a.calories < 80);
      expect(lowCalApples.length).toBeGreaterThan(2);
    });

    it('should round values appropriately', () => {
      const nutrition = NutritionCalculator.generateRandomNutrition(100, 'chicken');
      
      // Calories should be whole numbers
      expect(nutrition.calories % 1).toBe(0);
      
      // Macros should be rounded to 1 decimal place
      expect(nutrition.protein.toString()).toMatch(/^\d+(\.\d)?$/);
      expect(nutrition.carbs.toString()).toMatch(/^\d+(\.\d)?$/);
      expect(nutrition.fat.toString()).toMatch(/^\d+(\.\d)?$/);
      expect(nutrition.fiber.toString()).toMatch(/^\d+(\.\d)?$/);
    });
  });
});