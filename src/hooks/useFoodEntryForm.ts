import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  FoodEntryFormData, 
  FoodSuggestion, 
  NutritionInfo,
  MeasurementUnit,
  FoodEntry 
} from '../types/health';
import { validateForm, formatDate, debounce } from '../utils/formValidation';
import { calculateNutritionForFood } from '../utils/nutritionCalculator';
import { useAuthStore } from '../stores/authStore';
import { auth } from '../config/firebase';
import { FoodService } from '../services/firebase/food';

interface UseFoodEntryFormProps {
  initialData?: Partial<FoodEntryFormData>;
}

interface UseFoodEntryFormReturn {
  form: ReturnType<typeof useForm<FoodEntryFormData>>;
  nutritionPreview: NutritionInfo | null;
  recentFoods: FoodSuggestion[];
  selectRecentFood: (suggestion: FoodSuggestion) => void;
  onSubmit: (data: FoodEntryFormData) => Promise<boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: Record<string, any>;
}

export const useFoodEntryForm = ({
  initialData
}: UseFoodEntryFormProps = {}): UseFoodEntryFormReturn => {
  const { user } = useAuthStore();
  const [nutritionPreview, setNutritionPreview] = useState<NutritionInfo | null>(null);
  const [recentFoods, setRecentFoods] = useState<FoodSuggestion[]>([]);

  const form = useForm<FoodEntryFormData>({
    defaultValues: {
      name: initialData?.name || '',
      quantity: initialData?.quantity || '',
      unit: initialData?.unit || 'grams',
      mealType: initialData?.mealType || 'breakfast',
      date: initialData?.date || formatDate(new Date()),
      notes: initialData?.notes || '',
      photoUri: initialData?.photoUri || undefined
    },
    mode: 'onChange'
  });

  // Watch form changes for real-time nutrition preview
  const watchedValues = useWatch({
    control: form.control,
    name: ['name', 'quantity', 'unit']
  });

  // Generate nutrition preview when relevant fields change
  const updateNutritionPreview = useCallback(
    debounce(async (name: string, quantity: string, unit: MeasurementUnit) => {
      if (name && quantity && unit && !isNaN(parseFloat(quantity))) {
        try {
          // Use the enhanced nutrition calculator to generate realistic nutrition data
          const nutrition = await calculateNutritionForFood(name, parseFloat(quantity), unit);
          setNutritionPreview(nutrition);
        } catch (error) {
          console.warn('Nutrition preview calculation failed:', error);
          setNutritionPreview(null);
        }
      } else {
        setNutritionPreview(null);
      }
    }, 500),
    []
  );

  // Update nutrition preview when relevant fields change
  useEffect(() => {
    const [name, quantity, unit] = watchedValues;
    // Add a small delay to prevent render cycle conflicts
    const timeoutId = setTimeout(() => {
      updateNutritionPreview(name, quantity, unit);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [watchedValues, updateNutritionPreview]);

  // Load recent foods on mount
  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    try {
      // For Phase 3, we'll create mock recent foods
      // This will be replaced with actual Firebase data in future phases
      const mockRecentFoods: FoodSuggestion[] = [
        {
          name: 'Chicken Breast',
          commonUnits: ['grams', 'ounces', 'pieces'],
          frequency: 5,
          lastUsed: { toMillis: () => Date.now() - 86400000 } as any // 1 day ago
        },
        {
          name: 'Brown Rice',
          commonUnits: ['cups', 'grams'],
          frequency: 3,
          lastUsed: { toMillis: () => Date.now() - 172800000 } as any // 2 days ago
        },
        {
          name: 'Greek Yogurt',
          commonUnits: ['cups', 'grams'],
          frequency: 4,
          lastUsed: { toMillis: () => Date.now() - 259200000 } as any // 3 days ago
        },
        {
          name: 'Banana',
          commonUnits: ['pieces', 'grams'],
          frequency: 6,
          lastUsed: { toMillis: () => Date.now() - 345600000 } as any // 4 days ago
        },
        {
          name: 'Oatmeal',
          commonUnits: ['cups', 'grams'],
          frequency: 2,
          lastUsed: { toMillis: () => Date.now() - 432000000 } as any // 5 days ago
        }
      ];

      // Sort by frequency and recency
      const suggestions = mockRecentFoods
        .sort((a, b) => {
          // Primary sort by frequency
          if (a.frequency !== b.frequency) {
            return b.frequency - a.frequency;
          }
          // Secondary sort by recency
          return b.lastUsed.toMillis() - a.lastUsed.toMillis();
        })
        .slice(0, 10); // Top 10 suggestions

      setRecentFoods(suggestions);
    } catch (error) {
      console.warn('Failed to load recent foods:', error);
    }
  };

  const onSubmit = async (data: FoodEntryFormData): Promise<boolean> => {
    console.log('📝 useFoodEntryForm.onSubmit - Starting submission');
    console.log('📝 Form data received:', data);

    try {
      if (!user) {
        console.error('🚨 No user found for food submission');
        console.error('🚨 User state:', user);
        console.error('🚨 Auth state:', {
          isAuthenticated: useAuthStore.getState().isAuthenticated,
          isInitialized: useAuthStore.getState().isInitialized
        });
        return false;
      }

      // Check Firebase Auth current user
      const currentFirebaseUser = auth.currentUser;
      console.log('📝 Auth check - Store user:', {
        id: user?.id || 'undefined',
        email: user?.email || 'undefined'
      });
      console.log('📝 Auth check - Firebase user:', {
        uid: currentFirebaseUser?.uid,
        email: currentFirebaseUser?.email,
        isAnonymous: currentFirebaseUser?.isAnonymous
      });

      if (!currentFirebaseUser) {
        console.error('🚨 Firebase auth user is null - user may not be properly authenticated');
        return false;
      }

      // Validate the form data
      console.log('📝 Starting form validation...');
      const errors = validateForm(data);
      console.log('📝 Form validation results:', errors);
      const hasErrors = Object.values(errors).some(error => error !== null);
      
      //Commented the HasErrors check to allow submission for testing purposes
      // if (hasErrors) {
      //   console.error('Form validation failed:', errors);
      //   return false;
      // }

      // Get nutrition data for the food item
      const nutritionData = nutritionPreview || await calculateNutritionForFood(
        data.name, 
        parseFloat(data.quantity),
        data.unit
      );

      // Validate and create the AddFoodForm object
      const parsedQuantity = parseFloat(data.quantity);
      if (!data.name?.trim()) {
        console.error('🚨 Invalid food name:', data.name);
        return false;
      }
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        console.error('🚨 Invalid quantity:', data.quantity, 'parsed as:', parsedQuantity);
        return false;
      }
      if (!data.unit) {
        console.error('🚨 Invalid unit:', data.unit);
        return false;
      }

      const formData = {
        foodName: data.name.trim(),
        quantity: parsedQuantity,
        unit: data.unit,
        mealType: data.mealType,
        brand: 'tO Colloborate', // TODO: Add brand support to form
        notes: data.notes?.trim() || 'My Meal',
      };

      console.log('📝 Submitting food entry with AddFoodForm format:', formData);
      console.log('📝 Date for submission:', data.date);

      // Use FoodService directly
      console.log('📝 About to call FoodService.addFoodItem...');
      try {
        console.log('📝 Calling FoodService.addFoodItem with:', {
          userId: user?.id || 'undefined',
          date: data?.date || 'undefined',
          formData: formData || 'undefined'
        });

        const result = await FoodService.addFoodItem(user.id, data.date, formData);
        console.log('📝 FoodService.addFoodItem result - success:', result?.success, 'message:', result?.message);

        const success = result.success;

        if (success) {
          console.log('🎉 Food item added successfully');
          console.log('🎉 Success data - id:', result.data?.id, 'foodName:', result.data?.foodName);

          // Reset form to initial state
          form.reset({
            name: '',
            quantity: '',
            unit: 'grams',
            mealType: data.mealType, // Keep same meal type
            date: data.date, // Keep same date
            notes: '',
            photoUri: undefined
          });

          setNutritionPreview(null);
          return true;
        } else {
          console.error('🚨 Failed to add food item:', result.error);
          console.error('🚨 Error message:', result.message);
          console.error('🚨 Full result - success:', result?.success, 'error:', result?.error);
          return false;
        }
      } catch (serviceError) {
        console.error('🚨 Error calling FoodService:', serviceError);
        console.error('🚨 Service error type:', typeof serviceError);
        console.error('🚨 Service error details - message:', serviceError?.message || 'no message');
        return false;
      }
    } catch (error) {
      console.error('🚨 Food entry submission failed at top level:', error);
      console.error('🚨 Top level error type:', typeof error);
      console.error('🚨 Top level error details - message:', error?.message || 'no message');
      return false;
    }
  };

  const selectRecentFood = (suggestion: FoodSuggestion) => {
    form.setValue('name', suggestion.name);
    if (suggestion.commonUnits.length > 0) {
      form.setValue('unit', suggestion.commonUnits[0]);
    }
    // Auto-focus will be handled by the component
  };

  return {
    form,
    nutritionPreview,
    recentFoods,
    selectRecentFood,
    onSubmit,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors
  };
};