import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MealCategoryGrid from '../../../src/components/cards/MealCategoryGrid';
import { useNavigation } from '@react-navigation/native';
import { useNutritionStore } from '../../../src/stores/nutritionStore';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock nutrition store
jest.mock('../../../src/stores/nutritionStore', () => ({
  useNutritionStore: jest.fn(),
}));

const mockUseNutritionStore = useNutritionStore as jest.MockedFunction<typeof useNutritionStore>;

describe('MealCategoryGrid', () => {
  const mockStoreData = {
    currentDate: '2024-01-01',
    mealProgress: {
      breakfast: { calories: 250, macros: { protein: 20, carbs: 30, fat: 10, fiber: 5 } },
      lunch: { calories: 400, macros: { protein: 25, carbs: 50, fat: 15, fiber: 8 } },
      dinner: { calories: 350, macros: { protein: 30, carbs: 40, fat: 12, fiber: 6 } },
      snack: { calories: 150, macros: { protein: 8, carbs: 20, fat: 6, fiber: 3 } },
    },
    nutritionGoals: {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 25,
    },
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNutritionStore.mockImplementation((selector: any) => selector(mockStoreData));
  });

  it('renders correctly with meal categories', () => {
    const { getByTestId, getByText } = render(<MealCategoryGrid />);
    
    expect(getByTestId('meal-category-grid')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Morning Snack')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Evening Snack')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
  });

  it('calculates correct calorie allocations', () => {
    const { getAllByText } = render(<MealCategoryGrid />);
    
    // Breakfast: 25% of 2000 = 500 calories
    expect(getAllByText('250 of 500 Cal')).toHaveLength(1);
    
    // Lunch: 30% of 2000 = 600 calories  
    expect(getAllByText('400 of 600 Cal')).toHaveLength(1);
    
    // Dinner: 25% of 2000 = 500 calories
    expect(getAllByText('350 of 500 Cal')).toHaveLength(1);
    
    // Morning & Evening Snacks: 10% of 2000 = 200 calories each (both show 150 of 200)
    expect(getAllByText('150 of 200 Cal')).toHaveLength(2);
  });

  it('handles navigation correctly for each meal type', () => {
    const { getByTestId } = render(<MealCategoryGrid />);
    
    // Test navigation for breakfast
    fireEvent.press(getByTestId('meal-category-breakfast'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodEntry', { mealType: 'breakfast' });
    
    // Test navigation for lunch
    fireEvent.press(getByTestId('meal-category-lunch'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodEntry', { mealType: 'lunch' });
    
    // Test navigation for dinner
    fireEvent.press(getByTestId('meal-category-dinner'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodEntry', { mealType: 'dinner' });
    
    // Test navigation for snacks
    fireEvent.press(getByTestId('meal-category-morning_snack'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodEntry', { mealType: 'morning_snack' });
    
    fireEvent.press(getByTestId('meal-category-evening_snack'));
    expect(mockNavigate).toHaveBeenCalledWith('FoodEntry', { mealType: 'evening_snack' });
  });

  it('handles loading state correctly', () => {
    const loadingStoreData = { ...mockStoreData, isLoading: true };
    mockUseNutritionStore.mockImplementation((selector: any) => selector(loadingStoreData));
    
    const { getByTestId } = render(<MealCategoryGrid />);
    
    // All cards should receive loading state
    expect(getByTestId('meal-category-breakfast')).toBeTruthy();
    expect(getByTestId('meal-category-lunch')).toBeTruthy();
    expect(getByTestId('meal-category-dinner')).toBeTruthy();
    expect(getByTestId('meal-category-morning_snack')).toBeTruthy();
    expect(getByTestId('meal-category-evening_snack')).toBeTruthy();
  });

  it('handles empty meal progress data', () => {
    const emptyStoreData = {
      ...mockStoreData,
      mealProgress: {
        breakfast: { calories: 0, macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 } },
        lunch: { calories: 0, macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 } },
        dinner: { calories: 0, macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 } },
        snack: { calories: 0, macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 } },
      },
    };
    
    mockUseNutritionStore.mockImplementation((selector: any) => selector(emptyStoreData));
    
    const { getAllByText } = render(<MealCategoryGrid />);
    
    // All calories should show as 0
    expect(getAllByText('0 of 500 Cal')).toHaveLength(2); // Breakfast and Dinner
    expect(getAllByText('0 of 600 Cal')).toHaveLength(1); // Lunch  
    expect(getAllByText('0 of 200 Cal')).toHaveLength(2); // Both snacks
  });

  it('maintains responsive layout structure', () => {
    const { getByTestId } = render(<MealCategoryGrid />);
    
    const gridContainer = getByTestId('meal-category-grid');
    expect(gridContainer).toBeTruthy();
    
    // All meal category cards should be present
    expect(getByTestId('meal-category-breakfast')).toBeTruthy();
    expect(getByTestId('meal-category-morning_snack')).toBeTruthy();
    expect(getByTestId('meal-category-lunch')).toBeTruthy();
    expect(getByTestId('meal-category-evening_snack')).toBeTruthy();
    expect(getByTestId('meal-category-dinner')).toBeTruthy();
  });

  it('handles undefined meal progress gracefully', () => {
    const undefinedProgressData = {
      ...mockStoreData,
      mealProgress: {},
    };
    
    mockUseNutritionStore.mockImplementation((selector: any) => selector(undefinedProgressData));
    
    const { getAllByText } = render(<MealCategoryGrid />);
    
    // Should default to 0 calories when meal progress is undefined
    expect(getAllByText('0 of 500 Cal')).toHaveLength(2); // Breakfast and Dinner
    expect(getAllByText('0 of 600 Cal')).toHaveLength(1); // Lunch
    expect(getAllByText('0 of 200 Cal')).toHaveLength(2); // Both snacks
  });
});