import { create } from 'zustand';
import { FoodService, HealthService } from '../services';
import { 
  HealthDataState,
  FoodItem,
  DailyNutritionSummary,
  DailyHealthSummary,
  WeightEntry,
  WaterEntry,
  StepsEntry,
  WorkoutEntry,
  AddFoodForm,
  AddWeightForm,
  AddWaterForm,
  AddWorkoutForm
} from '../types';

interface HealthActions {
  // Date management
  setSelectedDate: (date: string) => void;
  
  // Food management
  loadFoodData: (userId: string, date: string) => Promise<void>;
  addFoodItem: (userId: string, date: string, formData: AddFoodForm) => Promise<boolean>;
  updateFoodItem: (foodItemId: string, updates: Partial<AddFoodForm>) => Promise<boolean>;
  deleteFoodItem: (foodItemId: string) => Promise<boolean>;
  
  // Health metrics management
  loadHealthData: (userId: string, date: string) => Promise<void>;
  addWeightEntry: (userId: string, date: string, formData: AddWeightForm) => Promise<boolean>;
  addWaterEntry: (userId: string, date: string, formData: AddWaterForm) => Promise<boolean>;
  addStepsEntry: (userId: string, date: string, steps: number) => Promise<boolean>;
  addWorkoutEntry: (userId: string, date: string, formData: AddWorkoutForm) => Promise<boolean>;
  
  // Data refresh
  refreshAllData: (userId: string, date: string) => Promise<void>;
  
  // Error handling
  clearErrors: () => void;
  
  // Store cleanup
  resetStore: () => void;
}

type HealthStore = HealthDataState & HealthActions;

export const useHealthStore = create<HealthStore>((set, get) => ({
  // Initial state
  selectedDate: new Date().toISOString().split('T')[0], // Today's date
  
  // Food data
  foodItems: [],
  dailyNutrition: null,
  
  // Health metrics
  dailyHealth: null,
  weightEntries: [],
  waterEntries: [],
  stepsEntries: [],
  workoutEntries: [],
  
  // Loading states
  isLoadingFood: false,
  isLoadingHealth: false,
  
  // Error states
  foodError: null,
  healthError: null,

  // Date management
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  // Food management
  loadFoodData: async (userId: string, date: string) => {
    set({ isLoadingFood: true, foodError: null });
    
    try {
      const result = await FoodService.getFoodItemsByDate(userId, date);
      
      if (result.success) {
        const foodItems = result.data || [];
        const dailyNutrition = FoodService.calculateDailyNutrition(foodItems, 2000); // TODO: Get goal from user profile
        
        set({ 
          foodItems,
          dailyNutrition,
          isLoadingFood: false 
        });
      } else {
        set({ 
          foodItems: [],
          dailyNutrition: null,
          foodError: result.error || 'Failed to load food data',
          isLoadingFood: false 
        });
      }
    } catch (error: any) {
      set({ 
        foodItems: [],
        dailyNutrition: null,
        foodError: error.message || 'Failed to load food data',
        isLoadingFood: false 
      });
    }
  },

  addFoodItem: async (userId: string, date: string, formData: AddFoodForm) => {
    try {
      console.log('Adding food item with data:', formData);
      const result = await FoodService.addFoodItem(userId, date, formData);
      
      if (result.success) {
        // Reload food data to update the UI
        await get().loadFoodData(userId, date);
        return true;
      } else {
        set({ foodError: result.error || 'Failed to add food item' });
        return false;
      }
    } catch (error: any) {
      set({ foodError: error.message || 'Failed to add food item' });
      return false;
    }
  },

  updateFoodItem: async (foodItemId: string, updates: Partial<AddFoodForm>) => {
    try {
      const result = await FoodService.updateFoodItem(foodItemId, updates);
      
      if (result.success) {
        // Reload current food data
        const { selectedDate } = get();
        const state = get();
        if (state.foodItems.length > 0) {
          const userId = state.foodItems[0].userId;
          await get().loadFoodData(userId, selectedDate);
        }
        return true;
      } else {
        set({ foodError: result.error || 'Failed to update food item' });
        return false;
      }
    } catch (error: any) {
      set({ foodError: error.message || 'Failed to update food item' });
      return false;
    }
  },

  deleteFoodItem: async (foodItemId: string) => {
    try {
      const result = await FoodService.deleteFoodItem(foodItemId);
      
      if (result.success) {
        // Reload current food data
        const { selectedDate } = get();
        const state = get();
        if (state.foodItems.length > 0) {
          const userId = state.foodItems[0].userId;
          await get().loadFoodData(userId, selectedDate);
        }
        return true;
      } else {
        set({ foodError: result.error || 'Failed to delete food item' });
        return false;
      }
    } catch (error: any) {
      set({ foodError: error.message || 'Failed to delete food item' });
      return false;
    }
  },

  // Health metrics management
  loadHealthData: async (userId: string, date: string) => {
    set({ isLoadingHealth: true, healthError: null });
    
    try {
      // Load all health data for the date
      const [waterResult, stepsResult, workoutResult, weightResult] = await Promise.all([
        HealthService.getWaterEntriesByDate(userId, date),
        HealthService.getStepsEntriesByDate(userId, date),
        HealthService.getWorkoutEntriesByDate(userId, date),
        HealthService.getWeightEntries(userId, 7) // Last 7 entries
      ]);

      // Calculate daily health summary
      const dailyHealth = await HealthService.calculateDailyHealthSummary(userId, date);

      set({
        waterEntries: waterResult.success ? waterResult.data! : [],
        stepsEntries: stepsResult.success ? stepsResult.data! : [],
        workoutEntries: workoutResult.success ? workoutResult.data! : [],
        weightEntries: weightResult.success ? weightResult.data! : [],
        dailyHealth,
        isLoadingHealth: false
      });
    } catch (error: any) {
      set({
        waterEntries: [],
        stepsEntries: [],
        workoutEntries: [],
        weightEntries: [],
        dailyHealth: null,
        healthError: error.message || 'Failed to load health data',
        isLoadingHealth: false
      });
    }
  },

  addWeightEntry: async (userId: string, date: string, formData: AddWeightForm) => {
    try {
      const result = await HealthService.addWeightEntry(userId, date, formData);
      
      if (result.success) {
        await get().loadHealthData(userId, date);
        return true;
      } else {
        set({ healthError: result.error || 'Failed to add weight entry' });
        return false;
      }
    } catch (error: any) {
      set({ healthError: error.message || 'Failed to add weight entry' });
      return false;
    }
  },

  addWaterEntry: async (userId: string, date: string, formData: AddWaterForm) => {
    try {
      const result = await HealthService.addWaterEntry(userId, date, formData);
      
      if (result.success) {
        await get().loadHealthData(userId, date);
        return true;
      } else {
        set({ healthError: result.error || 'Failed to add water entry' });
        return false;
      }
    } catch (error: any) {
      set({ healthError: error.message || 'Failed to add water entry' });
      return false;
    }
  },

  addStepsEntry: async (userId: string, date: string, steps: number) => {
    try {
      const result = await HealthService.addStepsEntry(userId, date, steps);
      
      if (result.success) {
        await get().loadHealthData(userId, date);
        return true;
      } else {
        set({ healthError: result.error || 'Failed to add steps entry' });
        return false;
      }
    } catch (error: any) {
      set({ healthError: error.message || 'Failed to add steps entry' });
      return false;
    }
  },

  addWorkoutEntry: async (userId: string, date: string, formData: AddWorkoutForm) => {
    try {
      const result = await HealthService.addWorkoutEntry(userId, date, formData);
      
      if (result.success) {
        await get().loadHealthData(userId, date);
        return true;
      } else {
        set({ healthError: result.error || 'Failed to add workout entry' });
        return false;
      }
    } catch (error: any) {
      set({ healthError: error.message || 'Failed to add workout entry' });
      return false;
    }
  },

  // Data refresh
  refreshAllData: async (userId: string, date: string) => {
    await Promise.all([
      get().loadFoodData(userId, date),
      get().loadHealthData(userId, date)
    ]);
  },

  // Error handling
  clearErrors: () => {
    set({ foodError: null, healthError: null });
  },

  // Store cleanup - Reset to initial state
  resetStore: () => {
    set({
      selectedDate: new Date().toISOString().split('T')[0],
      
      // Clear food data
      foodItems: [],
      dailyNutrition: null,
      
      // Clear health metrics
      dailyHealth: null,
      weightEntries: [],
      waterEntries: [],
      stepsEntries: [],
      workoutEntries: [],
      
      // Reset loading states
      isLoadingFood: false,
      isLoadingHealth: false,
      
      // Clear error states
      foodError: null,
      healthError: null,
    });
  },
}));