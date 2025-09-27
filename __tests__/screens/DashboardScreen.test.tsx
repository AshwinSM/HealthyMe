import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FoodTrackingCard } from '../../src/components/ui/FoodTrackingCard';

const mockOnAddPress = jest.fn();

describe('DashboardScreen + Icon Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders FoodTrackingCard with + icon button', () => {
    const { getByTestId } = render(
      <FoodTrackingCard
        caloriesConsumed={1700}
        targetCalories={2000}
        nutrition={{ protein: 65, fats: 42, carbs: 78, fiber: 28 }}
        onAddPress={mockOnAddPress}
      />
    );

    expect(getByTestId('food-tracking-add-button')).toBeTruthy();
  });

  it('calls onAddPress when + icon is pressed', async () => {
    const { getByTestId } = render(
      <FoodTrackingCard
        caloriesConsumed={1700}
        targetCalories={2000}
        nutrition={{ protein: 65, fats: 42, carbs: 78, fiber: 28 }}
        onAddPress={mockOnAddPress}
      />
    );

    const addButton = getByTestId('food-tracking-add-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockOnAddPress).toHaveBeenCalledTimes(1);
    });
  });

  it('provides visual feedback when + icon is pressed', () => {
    const { getByTestId } = render(
      <FoodTrackingCard
        caloriesConsumed={1700}
        targetCalories={2000}
        nutrition={{ protein: 65, fats: 42, carbs: 78, fiber: 28 }}
        onAddPress={mockOnAddPress}
      />
    );

    const addButton = getByTestId('food-tracking-add-button');

    // Test press in/out animations work without crashing
    fireEvent(addButton, 'pressIn');
    fireEvent(addButton, 'pressOut');

    expect(addButton).toBeTruthy();
  });
});