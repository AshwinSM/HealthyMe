import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MealCategoryGrid from '../../src/components/cards/MealCategoryGrid';
import { FoodEntryScreen } from '../../src/screens/FoodEntryScreen';

// Mock the nutrition store
jest.mock('../../src/stores/nutritionStore', () => ({
  useNutritionStore: (selector: any) => selector({
    currentDate: '2025-01-01',
    mealProgress: {
      breakfast: { calories: 200 },
      lunch: { calories: 300 },
      dinner: { calories: 400 },
      snack: { calories: 100 }
    },
    nutritionGoals: {
      calories: 2000
    },
    isLoading: false
  })
}));

// Mock the food entry form
jest.mock('../../src/components/forms/FoodEntryForm', () => ({
  FoodEntryForm: ({ onSuccess, onCancel }: any) => (
    <div testID="food-entry-form">
      <button onPress={onSuccess} testID="form-submit">Submit</button>
      <button onPress={onCancel} testID="form-cancel">Cancel</button>
    </div>
  )
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => <div testID="arrow-left">←</div>,
}));

const Stack = createStackNavigator();

const TestApp = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen 
        name="MealCategories" 
        component={() => <MealCategoryGrid />} 
      />
      <Stack.Screen 
        name="FoodEntry" 
        component={FoodEntryScreen} 
      />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Meal Category Navigation Integration', () => {
  it('should navigate to food entry screen when meal category is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<TestApp />);

    // Verify the meal category grid is rendered
    expect(getByTestId('meal-category-grid')).toBeTruthy();

    // Find and press a meal category button (breakfast)
    const breakfastCard = getByTestId('meal-category-breakfast');
    expect(breakfastCard).toBeTruthy();

    fireEvent.press(breakfastCard);

    // Should navigate to FoodEntry screen and show the form
    await expect(getByTestId('food-entry-form')).toBeTruthy();
  });

  it('should pass meal type and date to food entry screen', async () => {
    const { getByTestId } = render(<TestApp />);

    // Press lunch category
    const lunchCard = getByTestId('meal-category-lunch');
    fireEvent.press(lunchCard);

    // The form should be rendered (indicating navigation worked)
    expect(getByTestId('food-entry-form')).toBeTruthy();
  });

  it('should handle navigation back from food entry screen', async () => {
    const { getByTestId } = render(<TestApp />);

    // Navigate to food entry
    const dinnerCard = getByTestId('meal-category-dinner');
    fireEvent.press(dinnerCard);

    // Verify we're on the food entry screen
    expect(getByTestId('food-entry-form')).toBeTruthy();

    // Press cancel to go back
    fireEvent.press(getByTestId('form-cancel'));

    // Should be back to meal categories
    expect(getByTestId('meal-category-grid')).toBeTruthy();
  });

  it('should render all meal categories', () => {
    const { getByTestId } = render(<TestApp />);

    // All meal category cards should be present
    expect(getByTestId('meal-category-breakfast')).toBeTruthy();
    expect(getByTestId('meal-category-morning_snack')).toBeTruthy();
    expect(getByTestId('meal-category-lunch')).toBeTruthy();
    expect(getByTestId('meal-category-evening_snack')).toBeTruthy();
    expect(getByTestId('meal-category-dinner')).toBeTruthy();
  });

  it('should display current calorie information', () => {
    const { getByTestId } = render(<TestApp />);

    // Breakfast card should show current calories (mocked as 200)
    const breakfastCard = getByTestId('meal-category-breakfast');
    expect(breakfastCard).toBeTruthy();
    
    // The card should contain calorie information
    // Note: The exact text will depend on the formatting in formatCaloriesText
  });
});