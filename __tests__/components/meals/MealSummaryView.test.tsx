import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MealSummaryView } from '../../../src/components/meals/MealSummaryView';
import { useHealthDataStore } from '../../../src/stores/healthDataStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('../../../src/stores/healthDataStore');
jest.mock('../../../src/stores/authStore');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  prompt: jest.fn()
}));

const mockHealthStore = useHealthDataStore as jest.MockedFunction<typeof useHealthDataStore>;
const mockAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('MealSummaryView', () => {
  const mockOnAddFood = jest.fn();
  const mockOnEditFood = jest.fn();

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    dailyCalorieGoal: 2000,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const mockFoodItem = {
    id: 'food1',
    userId: 'user123',
    date: '2025-09-21',
    mealType: 'breakfast' as const,
    foodName: 'Scrambled Eggs',
    brand: 'Farm Fresh',
    quantity: 2,
    unit: 'pieces',
    nutrition: {
      calories: 150,
      protein: 12,
      carbs: 2,
      fat: 10,
      fiber: 0,
      sugar: 1,
      sodium: 200
    },
    photoURL: 'https://example.com/egg-photo.jpg',
    notes: 'Cooked with butter',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const mockHealthStoreData = {
    foodItems: [mockFoodItem],
    loadFoodItemsForDate: jest.fn().mockResolvedValue(undefined),
    deleteFoodItem: jest.fn().mockResolvedValue(true),
    addFoodItem: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockHealthStore.mockReturnValue(mockHealthStoreData as any);
    mockAuthStore.mockReturnValue({ user: mockUser } as any);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    expect(getByText('Loading meal...')).toBeTruthy();
  });

  it('should render empty state when no foods are logged', async () => {
    mockHealthStoreData.foodItems = [];

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('No breakfast logged yet')).toBeTruthy();
      expect(getByText('+ Add First Food')).toBeTruthy();
    });
  });

  it('should render meal summary with food items', async () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('Breakfast')).toBeTruthy();
      expect(getByText('1 item')).toBeTruthy();
      expect(getByText('150')).toBeTruthy(); // calories
      expect(getByText('Scrambled Eggs')).toBeTruthy();
      expect(getByText('Farm Fresh')).toBeTruthy();
      expect(getByText('2 pieces')).toBeTruthy();
      expect(getByText('150 cal')).toBeTruthy();
    });
  });

  it('should calculate nutrition totals correctly', async () => {
    mockHealthStoreData.foodItems = [
      mockFoodItem,
      {
        ...mockFoodItem,
        id: 'food2',
        foodName: 'Toast',
        nutrition: {
          calories: 100,
          protein: 3,
          carbs: 20,
          fat: 1,
          fiber: 2,
          sugar: 2,
          sodium: 150
        }
      }
    ];

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('250')).toBeTruthy(); // Total calories (150 + 100)
      expect(getByText('15.0g')).toBeTruthy(); // Total protein (12 + 3)
      expect(getByText('22.0g')).toBeTruthy(); // Total carbs (2 + 20)
      expect(getByText('11.0g')).toBeTruthy(); // Total fats (10 + 1)
      expect(getByText('2 items')).toBeTruthy();
    });
  });

  it('should handle food item press for editing', async () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      const foodItem = getByText('Scrambled Eggs');
      fireEvent.press(foodItem);
    });

    expect(mockOnEditFood).toHaveBeenCalledWith(mockFoodItem);
  });

  it('should handle food item deletion', async () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('Scrambled Eggs')).toBeTruthy();
    });

    // Simulate swipe delete action
    // This would typically be triggered through swipe gestures in the FoodItemCard
    // For testing, we'll simulate the delete confirmation
    mockAlert.mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find(button => button.text === 'Delete');
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });

    // The actual swipe action would be tested in FoodItemCard tests
    expect(mockHealthStoreData.deleteFoodItem).toHaveBeenCalledWith('food1');
  });

  it('should enter selection mode on long press', async () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      const foodItem = getByText('Scrambled Eggs');
      fireEvent(foodItem, 'longPress');
    });

    // Selection mode should be activated
    await waitFor(() => {
      expect(getByText('1 of 1 selected')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Delete (1)')).toBeTruthy();
    });
  });

  it('should handle bulk selection and deletion', async () => {
    mockHealthStoreData.foodItems = [
      mockFoodItem,
      { ...mockFoodItem, id: 'food2', foodName: 'Toast' }
    ];

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      const foodItem = getByText('Scrambled Eggs');
      fireEvent(foodItem, 'longPress');
    });

    // Select all items
    await waitFor(() => {
      const selectAllButton = getByText('Select All');
      fireEvent.press(selectAllButton);
    });

    // Delete selected items
    await waitFor(() => {
      const deleteButton = getByText('Delete (2)');
      fireEvent.press(deleteButton);
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Delete Selected Items',
      'Delete 2 food entries?',
      expect.any(Array)
    );
  });

  it('should handle food duplication', async () => {
    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('Scrambled Eggs')).toBeTruthy();
    });

    // Simulate duplicate action from swipe
    // This would be tested more thoroughly in FoodItemCard tests
    expect(mockHealthStoreData.addFoodItem).toHaveBeenCalledWith(
      expect.objectContaining({
        foodName: 'Scrambled Eggs (Copy)',
        nutrition: mockFoodItem.nutrition
      })
    );
  });

  it('should show save as meal button for multiple items', async () => {
    mockHealthStoreData.foodItems = [
      mockFoodItem,
      { ...mockFoodItem, id: 'food2', foodName: 'Toast' }
    ];

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('💾 Save as Meal')).toBeTruthy();
    });
  });

  it('should calculate goal progress correctly', async () => {
    // For breakfast with 150 calories and 2000 daily goal
    // Breakfast allocation is 25% = 500 calories
    // Progress = 150/500 = 30%

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('30% of goal')).toBeTruthy();
      expect(getByText('500 cal goal')).toBeTruthy();
    });
  });

  it('should handle error state', async () => {
    mockHealthStoreData.loadFoodItemsForDate.mockRejectedValue(
      new Error('Network error')
    );

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      expect(getByText('Failed to load meal data')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('should handle add food button press', async () => {
    mockHealthStoreData.foodItems = [];

    const { getByText } = render(
      <MealSummaryView
        mealType="breakfast"
        date="2025-09-21"
        onAddFood={mockOnAddFood}
        onEditFood={mockOnEditFood}
      />
    );

    await waitFor(() => {
      const addButton = getByText('+ Add First Food');
      fireEvent.press(addButton);
    });

    expect(mockOnAddFood).toHaveBeenCalled();
  });
});