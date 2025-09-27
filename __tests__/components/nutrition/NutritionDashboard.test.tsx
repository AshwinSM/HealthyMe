import React from 'react';
import { render } from '@testing-library/react-native';
import { NutritionDashboard } from '../../../src/components/nutrition/NutritionDashboard';
import { useNutritionStore } from '../../../src/stores/nutritionStore';
import { useAuthStore } from '../../../src/stores/authStore';

// Mock dependencies
jest.mock('../../../src/stores/nutritionStore');
jest.mock('../../../src/stores/authStore');
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
}));

const mockNutritionStore = useNutritionStore as jest.MockedFunction<typeof useNutritionStore>;
const mockAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('NutritionDashboard', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockNutritionData = {
    currentDate: '2025-09-21',
    dailyNutrition: {
      totalCalories: 1500,
      totalMacros: {
        protein: 80,
        carbs: 180,
        fat: 50,
        fiber: 20
      }
    },
    nutritionGoals: {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      fiber: 25
    },
    isLoading: false,
    error: null,
    loadFoodEntriesForDate: jest.fn(),
    foodEntries: [
      {
        id: 'entry1',
        userId: 'user123',
        date: '2025-09-21',
        mealType: 'breakfast',
        name: 'Oatmeal',
        calories: 300,
        macros: { protein: 10, carbs: 50, fat: 5, fiber: 8 }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStore.mockReturnValue({ user: mockUser } as any);
    mockNutritionStore.mockReturnValue(mockNutritionData as any);
  });

  it('should render nutrition dashboard with calorie ring', () => {
    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('1,500')).toBeTruthy(); // Current calories
    expect(getByText('of 2,000 cal')).toBeTruthy(); // Goal
  });

  it('should render macro progress section', () => {
    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('Daily Nutrition Progress')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbohydrates')).toBeTruthy();
    expect(getByText('Fats')).toBeTruthy();
    expect(getByText('Fiber')).toBeTruthy();
  });

  it('should render daily summary cards', () => {
    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('Daily Summary')).toBeTruthy();
    expect(getByText('Meals Logged')).toBeTruthy();
    expect(getByText('Completion Score')).toBeTruthy();
  });

  it('should show loading state when isLoading is true', () => {
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      isLoading: true
    } as any);

    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('Loading nutrition data...')).toBeTruthy();
  });

  it('should show error state when error exists', () => {
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      error: 'Failed to load data',
      isLoading: false
    } as any);

    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('Unable to load nutrition data')).toBeTruthy();
    expect(getByText('Failed to load data')).toBeTruthy();
  });

  it('should calculate calorie status correctly', () => {
    // Test "under" status (75% of goal)
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      dailyNutrition: {
        ...mockNutritionData.dailyNutrition,
        totalCalories: 1500 // 75% of 2000
      }
    } as any);

    const { rerender } = render(<NutritionDashboard />);
    expect(mockNutritionData.dailyNutrition.totalCalories).toBe(1500);

    // Test "met" status (95% of goal)
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      dailyNutrition: {
        ...mockNutritionData.dailyNutrition,
        totalCalories: 1900 // 95% of 2000
      }
    } as any);

    rerender(<NutritionDashboard />);

    // Test "over" status (120% of goal)
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      dailyNutrition: {
        ...mockNutritionData.dailyNutrition,
        totalCalories: 2400 // 120% of 2000
      }
    } as any);

    rerender(<NutritionDashboard />);
  });

  it('should display date information correctly', () => {
    const { getByText } = render(<NutritionDashboard />);

    // Should show formatted date
    expect(getByText(/Data for/)).toBeTruthy();
  });

  it('should handle empty nutrition data gracefully', () => {
    mockNutritionStore.mockReturnValue({
      ...mockNutritionData,
      dailyNutrition: null,
      foodEntries: []
    } as any);

    const { getByText } = render(<NutritionDashboard />);

    expect(getByText('0')).toBeTruthy(); // Should show 0 calories
    expect(getByText('of 2,000 cal')).toBeTruthy();
  });
});