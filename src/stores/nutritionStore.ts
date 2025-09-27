import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

import { 
  FoodEntry, 
  MealType, 
  MacroNutrients,
  DailyNutritionSummary,
  MealProgress,
  Unsubscribe 
} from './types';
import { BaseStoreState, BaseStoreActions, handleAsyncError, formatDate, getTodayDate } from './base/BaseStore';
import { foodEntryService } from '../services/firebase/services';
import { useAuthStore } from './authStore';

interface NutritionState extends BaseStoreState {
  foodEntries: FoodEntry[];
  dailyNutrition: Record<string, DailyNutritionSummary>;
  currentDate: string;
  mealProgress: Record<MealType, MealProgress>;
  nutritionGoals: MacroNutrients & { calories: number };
  isInitialized: boolean;
}

interface NutritionActions extends BaseStoreActions {
  // Food entry actions
  addFoodEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateFoodEntry: (id: string, updates: Partial<FoodEntry>) => Promise<boolean>;
  deleteFoodEntry: (id: string) => Promise<boolean>;

  // Date navigation
  setCurrentDate: (date: string) => void;
  loadFoodEntriesForDate: (date: string) => Promise<void>;
  getAvailableDates: (userId: string, startDate: string, endDate: string) => Promise<string[]>;
  hasDataForDate: (date: string) => boolean;
  getDailySummary: (date: string) => DailyNutritionSummary | undefined;
  getFoodEntriesForMeal: (mealType: MealType, date: string) => FoodEntry[];
  subscribeToDate: (date: string) => () => void;

  // Nutrition calculations
  calculateDailyNutrition: (date: string) => DailyNutritionSummary;
  calculateMealProgress: (date: string) => Record<MealType, MealProgress>;
  updateNutritionGoals: (goals: Partial<MacroNutrients & { calories: number }>) => void;

  // Real-time sync
  subscribeToFoodEntries: () => Unsubscribe;
  initializeNutrition: () => Promise<void>;
}

type NutritionStore = NutritionState & NutritionActions;

const initialMacros: MacroNutrients = {
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
};

const initialMealProgress: Record<MealType, MealProgress> = {
  breakfast: { calories: 0, macros: { ...initialMacros } },
  lunch: { calories: 0, macros: { ...initialMacros } },
  dinner: { calories: 0, macros: { ...initialMacros } },
  morning_snack: { calories: 0, macros: { ...initialMacros } },
  evening_snack: { calories: 0, macros: { ...initialMacros } }
};

const initialState: NutritionState = {
  foodEntries: [],
  dailyNutrition: {},
  currentDate: getTodayDate(),
  mealProgress: initialMealProgress,
  nutritionGoals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25
  },
  isInitialized: false,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addFoodEntry: async (entryData): Promise<boolean> => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await foodEntryService.create({
            ...entryData,
            userId: user.id,
          });
          
          if (result.success && result.data) {
            const { foodEntries, currentDate } = get();
            const newEntries = [...foodEntries, result.data];
            
            set({
              foodEntries: newEntries,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Recalculate nutrition for current date
            get().calculateDailyNutrition(currentDate);
            get().calculateMealProgress(currentDate);
            
            return true;
          } else {
            set({
              error: result.message || 'Failed to add food entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      updateFoodEntry: async (id: string, updates: Partial<FoodEntry>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await foodEntryService.update(id, updates);
          
          if (result.success && result.data) {
            const { foodEntries, currentDate } = get();
            const updatedEntries = foodEntries.map(entry => 
              entry.id === id ? result.data! : entry
            );
            
            set({
              foodEntries: updatedEntries,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Recalculate nutrition
            get().calculateDailyNutrition(currentDate);
            get().calculateMealProgress(currentDate);
            
            return true;
          } else {
            set({
              error: result.message || 'Failed to update food entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      deleteFoodEntry: async (id: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await foodEntryService.delete(id);
          
          if (result.success) {
            const { foodEntries, currentDate } = get();
            const filteredEntries = foodEntries.filter(entry => entry.id !== id);
            
            set({
              foodEntries: filteredEntries,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Recalculate nutrition
            get().calculateDailyNutrition(currentDate);
            get().calculateMealProgress(currentDate);
            
            return true;
          } else {
            set({
              error: result.message || 'Failed to delete food entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      setCurrentDate: (date: string) => {
        set({ currentDate: date });
        get().loadFoodEntriesForDate(date);
      },

      loadFoodEntriesForDate: async (date: string): Promise<void> => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        
        try {
          const result = await foodEntryService.getFoodEntriesForDateRange(user.id, date, date);
          
          if (result.success) {
            set({
              foodEntries: result.data || [],
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Calculate nutrition for the loaded date
            get().calculateDailyNutrition(date);
            get().calculateMealProgress(date);
          } else {
            set({
              error: result.message || 'Failed to load food entries',
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
        }
      },

      calculateDailyNutrition: (date: string): DailyNutritionSummary => {
        const { foodEntries } = get();
        const dayEntries = foodEntries.filter(entry => entry.date === date);
        
        const totalCalories = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);
        const totalMacros = dayEntries.reduce((acc, entry) => ({
          protein: acc.protein + entry.macros.protein,
          carbs: acc.carbs + entry.macros.carbs,
          fat: acc.fat + entry.macros.fat,
          fiber: acc.fiber + entry.macros.fiber,
        }), { ...initialMacros });
        
        const mealBreakdown = dayEntries.reduce((acc, entry) => ({
          ...acc,
          [entry.mealType]: (acc[entry.mealType] || 0) + 1,
        }), {} as Record<MealType, number>);
        
        const summary: DailyNutritionSummary = {
          date,
          totalCalories,
          totalMacros,
          mealBreakdown,
          entriesCount: dayEntries.length,
        };
        
        // Update the daily nutrition record
        set(state => ({
          dailyNutrition: {
            ...state.dailyNutrition,
            [date]: summary,
          },
        }));
        
        return summary;
      },

      calculateMealProgress: (date: string): Record<MealType, MealProgress> => {
        const { foodEntries } = get();
        const dayEntries = foodEntries.filter(entry => entry.date === date);
        
        const mealProgress: Record<MealType, MealProgress> = {
          breakfast: { calories: 0, macros: { ...initialMacros } },
          lunch: { calories: 0, macros: { ...initialMacros } },
          dinner: { calories: 0, macros: { ...initialMacros } },
          morning_snack: { calories: 0, macros: { ...initialMacros } },
          evening_snack: { calories: 0, macros: { ...initialMacros } },
        };
        
        dayEntries.forEach(entry => {
          mealProgress[entry.mealType].calories += entry.calories;
          mealProgress[entry.mealType].macros.protein += entry.macros.protein;
          mealProgress[entry.mealType].macros.carbs += entry.macros.carbs;
          mealProgress[entry.mealType].macros.fat += entry.macros.fat;
          mealProgress[entry.mealType].macros.fiber += entry.macros.fiber;
        });
        
        set({ mealProgress });
        return mealProgress;
      },

      updateNutritionGoals: (goals: Partial<MacroNutrients & { calories: number }>) => {
        set(state => ({
          nutritionGoals: { ...state.nutritionGoals, ...goals },
          lastUpdated: Timestamp.now(),
        }));
      },

      subscribeToFoodEntries: (): Unsubscribe => {
        const user = useAuthStore.getState().user;
        if (!user) {
          return () => {};
        }

        return foodEntryService.subscribeToQuery(
          [{ field: 'userId', operator: '==', value: user.id }],
          (entries) => {
            const { currentDate } = get();
            set({ 
              foodEntries: entries,
              lastUpdated: Timestamp.now(),
            });
            
            // Recalculate nutrition when data changes
            get().calculateDailyNutrition(currentDate);
            get().calculateMealProgress(currentDate);
          },
          'createdAt'
        );
      },

      initializeNutrition: async (): Promise<void> => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true });

        try {
          const { currentDate } = get();
          await get().loadFoodEntriesForDate(currentDate);

          set({
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
        }
      },

      getAvailableDates: async (userId: string, startDate: string, endDate: string): Promise<string[]> => {
        try {
          const result = await foodEntryService.getFoodEntriesForDateRange(userId, startDate, endDate);

          if (result.success && result.data) {
            const uniqueDates = Array.from(new Set(result.data.map(entry => entry.date)));
            return uniqueDates.sort();
          }

          return [];
        } catch (error) {
          console.error('Failed to get available dates:', error);
          return [];
        }
      },

      hasDataForDate: (date: string): boolean => {
        const { foodEntries } = get();
        return foodEntries.some(entry => entry.date === date);
      },

      getDailySummary: (date: string): DailyNutritionSummary | undefined => {
        const { dailyNutrition } = get();
        return dailyNutrition[date];
      },

      getFoodEntriesForMeal: (mealType: MealType, date: string): FoodEntry[] => {
        const { foodEntries } = get();
        return foodEntries.filter(entry => entry.date === date && entry.mealType === mealType);
      },

      subscribeToDate: (date: string) => {
        // Return a function that unsubscribes from date-specific updates
        // For now, this is a placeholder that returns a no-op function
        return () => {};
      },

      // Base store actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'nutrition-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dailyNutrition: state.dailyNutrition,
        nutritionGoals: state.nutritionGoals,
        currentDate: state.currentDate,
      }),
    }
  )
);

// Selector hooks for commonly used nutrition state
export const useFoodEntries = () => useNutritionStore((state) => state.foodEntries);
export const useDailyNutrition = () => useNutritionStore((state) => state.dailyNutrition);
export const useCurrentDate = () => useNutritionStore((state) => state.currentDate);
export const useMealProgress = () => useNutritionStore((state) => state.mealProgress);
export const useNutritionGoals = () => useNutritionStore((state) => state.nutritionGoals);
export const useNutritionLoading = () => useNutritionStore((state) => state.isLoading);
export const useNutritionError = () => useNutritionStore((state) => state.error);