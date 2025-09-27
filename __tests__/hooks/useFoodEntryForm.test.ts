import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFoodEntryForm } from '../../src/hooks/useFoodEntryForm';
import { FoodService } from '../../src/services/firebase/food';

// Mock the FoodService
jest.mock('../../src/services/firebase/food', () => ({
  FoodService: {
    addFoodItem: jest.fn()
  }
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: Function) => fn,
    formState: {
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      errors: {}
    },
    setValue: jest.fn(),
    getValues: jest.fn(),
    setFocus: jest.fn(),
    reset: jest.fn(),
    watch: jest.fn()
  }),
  useWatch: () => ['Chicken Breast', '150', 'grams'],
  Controller: ({ render }: any) => render({ field: { onChange: jest.fn(), onBlur: jest.fn(), value: '' } })
}));

describe('useFoodEntryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FoodService.addFoodItem as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFoodEntryForm());

    expect(result.current.form).toBeDefined();
    expect(result.current.nutritionPreview).toBeNull();
    expect(result.current.recentFoods).toEqual([]);
    expect(result.current.isValid).toBe(true);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should initialize with provided initial data', () => {
    const initialData = {
      name: 'Test Food',
      mealType: 'breakfast' as const,
      date: '2025-01-01'
    };

    const { result } = renderHook(() => useFoodEntryForm({ initialData }));

    expect(result.current.form).toBeDefined();
  });

  it('should load recent foods on mount', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    await waitFor(() => {
      expect(result.current.recentFoods.length).toBeGreaterThan(0);
    });

    // Check that recent foods have expected structure
    result.current.recentFoods.forEach(food => {
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('commonUnits');
      expect(food).toHaveProperty('frequency');
      expect(food).toHaveProperty('lastUsed');
    });
  });

  it('should update nutrition preview when form values change', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    // Wait for the debounced nutrition preview to update
    await waitFor(() => {
      expect(result.current.nutritionPreview).not.toBeNull();
    }, { timeout: 1000 });

    expect(result.current.nutritionPreview).toHaveProperty('calories');
    expect(result.current.nutritionPreview).toHaveProperty('protein');
    expect(result.current.nutritionPreview).toHaveProperty('carbs');
    expect(result.current.nutritionPreview).toHaveProperty('fat');
    expect(result.current.nutritionPreview).toHaveProperty('fiber');
  });

  it('should handle form submission successfully', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    const formData = {
      name: 'Test Food',
      quantity: '150',
      unit: 'grams' as const,
      mealType: 'breakfast' as const,
      date: '2025-01-01',
      notes: 'Test notes',
      photoUri: undefined
    };

    await act(async () => {
      const success = await result.current.onSubmit(formData);
      expect(success).toBe(true);
    });

    expect(FoodService.addFoodItem).toHaveBeenCalledWith(
      'mock-user-id',
      '2025-01-01',
      {
        foodName: 'Test Food',
        mealType: 'breakfast',
        quantity: 150,
        unit: 'grams',
        brand: '',
        notes: 'Test notes'
      }
    );
  });

  it('should handle form submission failure', async () => {
    (FoodService.addFoodItem as jest.Mock).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useFoodEntryForm());

    const formData = {
      name: 'Test Food',
      quantity: '150',
      unit: 'grams' as const,
      mealType: 'breakfast' as const,
      date: '2025-01-01',
      notes: 'Test notes',
      photoUri: undefined
    };

    await act(async () => {
      const success = await result.current.onSubmit(formData);
      expect(success).toBe(false);
    });
  });

  it('should handle form validation errors', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    const invalidFormData = {
      name: '', // Invalid: empty name
      quantity: '0', // Invalid: zero quantity
      unit: 'grams' as const,
      mealType: 'breakfast' as const,
      date: '2025-01-01',
      notes: '',
      photoUri: undefined
    };

    await act(async () => {
      const success = await result.current.onSubmit(invalidFormData);
      expect(success).toBe(false);
    });

    // Should not call the service with invalid data
    expect(FoodService.addFoodItem).not.toHaveBeenCalled();
  });

  it('should select recent food correctly', () => {
    const { result } = renderHook(() => useFoodEntryForm());

    const mockForm = {
      setValue: jest.fn(),
    };
    
    // Mock the form object
    (result.current.form as any) = mockForm;

    const suggestion = {
      name: 'Chicken Breast',
      commonUnits: ['grams', 'ounces'] as const,
      frequency: 5,
      lastUsed: { toMillis: () => Date.now() } as any
    };

    act(() => {
      result.current.selectRecentFood(suggestion);
    });

    expect(mockForm.setValue).toHaveBeenCalledWith('name', 'Chicken Breast');
    expect(mockForm.setValue).toHaveBeenCalledWith('unit', 'grams');
  });

  it('should handle recent foods with no common units', () => {
    const { result } = renderHook(() => useFoodEntryForm());

    const mockForm = {
      setValue: jest.fn(),
    };
    
    // Mock the form object
    (result.current.form as any) = mockForm;

    const suggestion = {
      name: 'Custom Food',
      commonUnits: [] as const,
      frequency: 1,
      lastUsed: { toMillis: () => Date.now() } as any
    };

    act(() => {
      result.current.selectRecentFood(suggestion);
    });

    expect(mockForm.setValue).toHaveBeenCalledWith('name', 'Custom Food');
    // Should not call setValue for unit when no common units
    expect(mockForm.setValue).not.toHaveBeenCalledWith('unit', expect.anything());
  });

  it('should sort recent foods by frequency and recency', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    await waitFor(() => {
      expect(result.current.recentFoods.length).toBeGreaterThan(0);
    });

    const foods = result.current.recentFoods;
    
    // Check that foods are sorted by frequency (highest first)
    for (let i = 1; i < foods.length; i++) {
      if (foods[i - 1].frequency !== foods[i].frequency) {
        expect(foods[i - 1].frequency).toBeGreaterThanOrEqual(foods[i].frequency);
      }
    }
  });

  it('should limit recent foods to top 10', async () => {
    const { result } = renderHook(() => useFoodEntryForm());

    await waitFor(() => {
      expect(result.current.recentFoods.length).toBeLessThanOrEqual(10);
    });
  });
});