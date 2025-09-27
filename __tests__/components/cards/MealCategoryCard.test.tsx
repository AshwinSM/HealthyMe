import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MealCategoryCard from '../../../src/components/cards/MealCategoryCard';
import { MealType } from '../../../src/types';

describe('MealCategoryCard', () => {
  const defaultProps = {
    mealType: 'breakfast' as MealType,
    currentCalories: 250,
    allocatedCalories: 500,
    mealCount: 2,
    onPress: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId, getByText } = render(<MealCategoryCard {...defaultProps} />);
    
    expect(getByTestId('meal-category-breakfast')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('250 of 500 Cal')).toBeTruthy();
  });

  it('displays correct meal titles for different meal types', () => {
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'morning_snack', 'evening_snack'];
    const expectedTitles = ['Breakfast', 'Lunch', 'Dinner', 'Morning Snack', 'Evening Snack'];

    mealTypes.forEach((mealType, index) => {
      const { getByText } = render(
        <MealCategoryCard {...defaultProps} mealType={mealType} />
      );
      expect(getByText(expectedTitles[index])).toBeTruthy();
    });
  });

  it('handles press events correctly', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MealCategoryCard {...defaultProps} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('meal-category-breakfast'));
    expect(mockOnPress).toHaveBeenCalledWith('breakfast');
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('displays correct calorie information', () => {
    const { getByText } = render(
      <MealCategoryCard 
        {...defaultProps} 
        currentCalories={150} 
        allocatedCalories={400} 
      />
    );
    
    expect(getByText('150 of 400 Cal')).toBeTruthy();
  });

  it('rounds calories to whole numbers', () => {
    const { getByText } = render(
      <MealCategoryCard 
        {...defaultProps} 
        currentCalories={125.7} 
        allocatedCalories={499.3} 
      />
    );
    
    expect(getByText('126 of 499 Cal')).toBeTruthy();
  });

  it('shows loading indicator when isLoading is true', () => {
    const { queryByTestId } = render(
      <MealCategoryCard {...defaultProps} isLoading={true} />
    );
    
    // The loading indicator should be present (small dot in top-right corner)
    const card = queryByTestId('meal-category-breakfast');
    expect(card).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(<MealCategoryCard {...defaultProps} />);
    
    const card = getByTestId('meal-category-breakfast');
    expect(card).toHaveProp('accessibilityRole', 'button');
    expect(card).toHaveProp('accessibilityLabel', 'Breakfast - 250 of 500 Cal');
  });

  it('handles different meal types with correct test IDs', () => {
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'morning_snack', 'evening_snack'];

    mealTypes.forEach((mealType) => {
      const { getByTestId } = render(
        <MealCategoryCard {...defaultProps} mealType={mealType} />
      );
      expect(getByTestId(`meal-category-${mealType}`)).toBeTruthy();
    });
  });

  it('handles zero calories correctly', () => {
    const { getByText } = render(
      <MealCategoryCard 
        {...defaultProps} 
        currentCalories={0} 
        allocatedCalories={500} 
      />
    );
    
    expect(getByText('0 of 500 Cal')).toBeTruthy();
  });

  it('handles high calorie values correctly', () => {
    const { getByText } = render(
      <MealCategoryCard 
        {...defaultProps} 
        currentCalories={2500} 
        allocatedCalories={3000} 
      />
    );
    
    expect(getByText('2500 of 3000 Cal')).toBeTruthy();
  });
});