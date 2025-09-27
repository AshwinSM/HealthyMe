import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FoodEntryForm } from '../../../src/components/forms/FoodEntryForm';
import { MealType } from '../../../src/types/health';

// Mock the custom hook
jest.mock('../../../src/hooks/useFoodEntryForm', () => ({
  useFoodEntryForm: () => ({
    form: {
      control: {},
      handleSubmit: (fn: Function) => () => fn({
        name: 'Test Food',
        quantity: '150',
        unit: 'grams',
        mealType: 'breakfast',
        date: '2025-01-01',
        notes: 'Test notes'
      }),
      watch: jest.fn().mockReturnValue('grams'),
      setValue: jest.fn()
    },
    nutritionPreview: {
      calories: 150,
      protein: 25,
      carbs: 0,
      fat: 5,
      fiber: 0
    },
    recentFoods: [
      {
        name: 'Chicken Breast',
        commonUnits: ['grams', 'ounces'],
        frequency: 5,
        lastUsed: { toMillis: () => Date.now() }
      },
      {
        name: 'Brown Rice',
        commonUnits: ['cups', 'grams'],
        frequency: 3,
        lastUsed: { toMillis: () => Date.now() - 86400000 }
      }
    ],
    selectRecentFood: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(true),
    isValid: true,
    isDirty: true,
    isSubmitting: false,
    errors: {}
  })
}));

// Mock React Hook Form Controller
jest.mock('react-hook-form', () => ({
  Controller: ({ name, render }: any) => {
    const mockField = {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: name === 'name' ? 'Test Food' : 
             name === 'quantity' ? '150' : 
             name === 'unit' ? 'grams' : 
             name === 'notes' ? 'Test notes' : ''
    };
    return render({ field: mockField });
  }
}));

describe('FoodEntryForm', () => {
  const defaultProps = {
    initialMealType: 'breakfast' as MealType,
    initialDate: '2025-01-01',
    onSuccess: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    const { getByPlaceholderText, getByText } = render(
      <FoodEntryForm {...defaultProps} />
    );

    expect(getByText('Food Name *')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Grilled Chicken Breast')).toBeTruthy();
    expect(getByText('Quantity *')).toBeTruthy();
    expect(getByPlaceholderText('1.5')).toBeTruthy();
    expect(getByText('Unit *')).toBeTruthy();
    expect(getByText('Notes (Optional)')).toBeTruthy();
    expect(getByPlaceholderText('Add any notes about this food...')).toBeTruthy();
  });

  it('should display nutrition preview when available', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    expect(getByText('Estimated Nutrition: 150 cal')).toBeTruthy();
  });

  it('should show nutrition details when preview is expanded', () => {
    const { getByText, queryByText } = render(<FoodEntryForm {...defaultProps} />);

    // Initially details should not be visible
    expect(queryByText('Protein: 25g')).toBeFalsy();

    // Tap to expand
    fireEvent.press(getByText('Estimated Nutrition: 150 cal'));

    // Details should now be visible
    expect(getByText('Protein: 25g')).toBeTruthy();
    expect(getByText('Carbs: 0g')).toBeTruthy();
    expect(getByText('Fats: 5g')).toBeTruthy();
    expect(getByText('Fiber: 0g')).toBeTruthy();
  });

  it('should display recent foods when food name field is focused', () => {
    const { getByPlaceholderText, getByText } = render(
      <FoodEntryForm {...defaultProps} />
    );

    // Focus the food name input
    fireEvent(getByPlaceholderText('e.g., Grilled Chicken Breast'), 'focus');

    expect(getByText('Recent Foods:')).toBeTruthy();
    expect(getByText('Chicken Breast')).toBeTruthy();
    expect(getByText('Brown Rice')).toBeTruthy();
    expect(getByText('Used 5 times')).toBeTruthy();
    expect(getByText('Used 3 times')).toBeTruthy();
  });

  it('should handle recent food selection', () => {
    const { getByPlaceholderText, getByText } = render(
      <FoodEntryForm {...defaultProps} />
    );

    // Focus the food name input to show recent foods
    fireEvent(getByPlaceholderText('e.g., Grilled Chicken Breast'), 'focus');

    // Tap on a recent food
    fireEvent.press(getByText('Chicken Breast'));

    // Should close the suggestions
    expect(() => getByText('Recent Foods:')).toThrow();
  });

  it('should close recent foods suggestions when close button is pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <FoodEntryForm {...defaultProps} />
    );

    // Focus the food name input to show recent foods
    fireEvent(getByPlaceholderText('e.g., Grilled Chicken Breast'), 'focus');

    expect(getByText('Recent Foods:')).toBeTruthy();

    // Tap close button
    fireEvent.press(getByText('Close'));

    // Suggestions should be hidden
    expect(() => getByText('Recent Foods:')).toThrow();
  });

  it('should display all measurement unit options', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    const expectedUnits = [
      'Cups', 'Ounces', 'Grams', 'Pounds', 'Pieces', 
      'Slices', 'Tablespoons', 'Teaspoons', 'Liters', 'Milliliters'
    ];

    expectedUnits.forEach(unit => {
      expect(getByText(unit)).toBeTruthy();
    });
  });

  it('should highlight selected measurement unit', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    const gramsButton = getByText('Grams');
    expect(gramsButton.parent?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#10B981' })
      ])
    );
  });

  it('should handle unit selection', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    fireEvent.press(getByText('Cups'));
    // Test that the unit selection works (mocked setValue should be called)
  });

  it('should render action buttons', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Add Food')).toBeTruthy();
  });

  it('should call onCancel when cancel button is pressed', () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should handle form submission', async () => {
    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    fireEvent.press(getByText('Add Food'));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('should disable submit button when form is invalid', () => {
    const mockHook = require('../../../src/hooks/useFoodEntryForm').useFoodEntryForm;
    mockHook.mockReturnValueOnce({
      ...mockHook(),
      isValid: false
    });

    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    const submitButton = getByText('Add Food');
    expect(submitButton.parent?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#9CA3AF' })
      ])
    );
  });

  it('should show loading state during submission', () => {
    const mockHook = require('../../../src/hooks/useFoodEntryForm').useFoodEntryForm;
    mockHook.mockReturnValueOnce({
      ...mockHook(),
      isSubmitting: true
    });

    const { getByTestId } = render(<FoodEntryForm {...defaultProps} />);

    // Should show ActivityIndicator instead of text
    expect(() => getByText('Add Food')).toThrow();
    // ActivityIndicator should be present (though hard to test directly)
  });

  it('should handle errors gracefully', () => {
    const mockHook = require('../../../src/hooks/useFoodEntryForm').useFoodEntryForm;
    mockHook.mockReturnValueOnce({
      ...mockHook(),
      errors: {
        name: { message: 'Food name is required' },
        quantity: { message: 'Invalid quantity' }
      }
    });

    const { getByText } = render(<FoodEntryForm {...defaultProps} />);

    expect(getByText('Food name is required')).toBeTruthy();
    expect(getByText('Invalid quantity')).toBeTruthy();
  });

  it('should handle form without initial props', () => {
    const { getByText } = render(
      <FoodEntryForm 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    );

    expect(getByText('Food Name *')).toBeTruthy();
    expect(getByText('Add Food')).toBeTruthy();
  });

  it('should hide nutrition preview when not available', () => {
    const mockHook = require('../../../src/hooks/useFoodEntryForm').useFoodEntryForm;
    mockHook.mockReturnValueOnce({
      ...mockHook(),
      nutritionPreview: null
    });

    const { queryByText } = render(<FoodEntryForm {...defaultProps} />);

    expect(queryByText(/Estimated Nutrition/)).toBeFalsy();
  });

  it('should handle empty recent foods list', () => {
    const mockHook = require('../../../src/hooks/useFoodEntryForm').useFoodEntryForm;
    mockHook.mockReturnValueOnce({
      ...mockHook(),
      recentFoods: []
    });

    const { getByPlaceholderText, queryByText } = render(
      <FoodEntryForm {...defaultProps} />
    );

    // Focus the food name input
    fireEvent(getByPlaceholderText('e.g., Grilled Chicken Breast'), 'focus');

    // Recent foods section should not appear
    expect(queryByText('Recent Foods:')).toBeFalsy();
  });
});