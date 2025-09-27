import { 
  getMealCategoryState, 
  categoryColors, 
  formatCaloriesText,
  getMealDisplayInfo 
} from '../../src/utils/mealUtils';
import { CategoryState } from '../../src/types';

describe('mealUtils', () => {
  describe('getMealCategoryState', () => {
    it('returns "empty" when current calories is 0', () => {
      expect(getMealCategoryState(0, 500)).toBe('empty');
    });

    it('returns "partial" when current is less than 90% of allocated', () => {
      expect(getMealCategoryState(400, 500)).toBe('partial'); // 80% of 500
      expect(getMealCategoryState(300, 500)).toBe('partial'); // 60% of 500
      expect(getMealCategoryState(440, 500)).toBe('partial'); // 88% of 500
    });

    it('returns "goalMet" when current is between 90% and 110% of allocated', () => {
      expect(getMealCategoryState(450, 500)).toBe('goalMet'); // 90% of 500
      expect(getMealCategoryState(500, 500)).toBe('goalMet'); // 100% of 500
      expect(getMealCategoryState(550, 500)).toBe('goalMet'); // 110% of 500
    });

    it('returns "overGoal" when current exceeds 110% of allocated', () => {
      expect(getMealCategoryState(560, 500)).toBe('overGoal'); // 112% of 500
      expect(getMealCategoryState(600, 500)).toBe('overGoal'); // 120% of 500
    });

    it('handles edge cases correctly', () => {
      expect(getMealCategoryState(0, 0)).toBe('empty');
      expect(getMealCategoryState(100, 0)).toBe('overGoal'); // Division by 0 case
      expect(getMealCategoryState(1, 1000)).toBe('partial');
    });

    it('handles decimal values correctly', () => {
      expect(getMealCategoryState(449.9, 500)).toBe('partial'); // Just under 90%
      expect(getMealCategoryState(450.1, 500)).toBe('goalMet'); // Just over 90%
      expect(getMealCategoryState(549.9, 500)).toBe('goalMet'); // Just under 110%
      expect(getMealCategoryState(550.1, 500)).toBe('overGoal'); // Just over 110%
    });
  });

  describe('categoryColors', () => {
    it('has all required color states', () => {
      expect(categoryColors.empty).toBe('#F3F4F6');
      expect(categoryColors.partial).toBe('#FEF3C7');
      expect(categoryColors.goalMet).toBe('#D1FAE5');
      expect(categoryColors.overGoal).toBe('#FEE2E2');
    });

    it('uses valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      
      Object.values(categoryColors).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('formatCaloriesText', () => {
    it('formats calories text correctly', () => {
      expect(formatCaloriesText(250, 500)).toBe('250 of 500 Cal');
      expect(formatCaloriesText(0, 600)).toBe('0 of 600 Cal');
      expect(formatCaloriesText(1200, 1000)).toBe('1200 of 1000 Cal');
    });

    it('rounds decimal values to whole numbers', () => {
      expect(formatCaloriesText(125.7, 499.3)).toBe('126 of 499 Cal');
      expect(formatCaloriesText(249.4, 500.8)).toBe('249 of 501 Cal');
      expect(formatCaloriesText(250.5, 500.5)).toBe('251 of 501 Cal');
    });

    it('handles negative values', () => {
      expect(formatCaloriesText(-10, 500)).toBe('-10 of 500 Cal');
      expect(formatCaloriesText(250, -500)).toBe('250 of -500 Cal');
    });

    it('handles zero values', () => {
      expect(formatCaloriesText(0, 0)).toBe('0 of 0 Cal');
      expect(formatCaloriesText(0, 500)).toBe('0 of 500 Cal');
      expect(formatCaloriesText(250, 0)).toBe('250 of 0 Cal');
    });
  });

  describe('getMealDisplayInfo', () => {
    it('returns correct display info for breakfast', () => {
      const result = getMealDisplayInfo('breakfast');
      expect(result.title).toBe('Breakfast');
      expect(result.icon).toBe('sunrise');
    });

    it('returns correct display info for morning_snack', () => {
      const result = getMealDisplayInfo('morning_snack');
      expect(result.title).toBe('Morning Snack');
      expect(result.icon).toBe('apple');
    });

    it('returns correct display info for lunch', () => {
      const result = getMealDisplayInfo('lunch');
      expect(result.title).toBe('Lunch');
      expect(result.icon).toBe('utensils');
    });

    it('returns correct display info for evening_snack', () => {
      const result = getMealDisplayInfo('evening_snack');
      expect(result.title).toBe('Evening Snack');
      expect(result.icon).toBe('cookie');
    });

    it('returns correct display info for dinner', () => {
      const result = getMealDisplayInfo('dinner');
      expect(result.title).toBe('Dinner');
      expect(result.icon).toBe('utensils-crossed');
    });

    it('returns default for unknown meal type', () => {
      const result = getMealDisplayInfo('unknown');
      expect(result.title).toBe('Unknown');
      expect(result.icon).toBe('utensils');
    });

    it('handles empty string input', () => {
      const result = getMealDisplayInfo('');
      expect(result.title).toBe('Unknown');
      expect(result.icon).toBe('utensils');
    });

    it('is case sensitive', () => {
      const result = getMealDisplayInfo('BREAKFAST');
      expect(result.title).toBe('Unknown');
      expect(result.icon).toBe('utensils');
    });
  });
});