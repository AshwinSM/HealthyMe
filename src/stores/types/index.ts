import { Timestamp } from 'firebase/firestore';
import { 
  UserProfile, 
  FoodEntry, 
  WeightEntry, 
  WaterEntry, 
  ActivityEntry, 
  StepsEntry,
  MacroNutrients,
  MealType,
  HealthGoals,
  UserPreferences
} from '../../types';

// Re-export core types
export {
  UserProfile,
  FoodEntry,
  WeightEntry,
  WaterEntry,
  ActivityEntry,
  StepsEntry,
  MacroNutrients,
  MealType,
  HealthGoals,
  UserPreferences
};

/**
 * Daily nutrition summary calculated from food entries
 */
export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalMacros: MacroNutrients;
  mealBreakdown: Record<MealType, number>; // Count of entries per meal
  entriesCount: number;
}

/**
 * Progress data for each meal type
 */
export interface MealProgress {
  calories: number;
  macros: MacroNutrients;
}

/**
 * Daily health progress summary
 */
export interface DailyHealthProgress {
  date: string;
  weight?: number;
  waterIntake: number;
  totalSteps: number;
  activitiesCount: number;
  totalActiveMinutes: number;
  caloriesBurned: number;
  goalProgress: {
    water: number; // Percentage of goal achieved
    steps: number; // Percentage of goal achieved
    activity: number; // Percentage of goal achieved
  };
}

/**
 * App sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'error';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Store subscription cleanup function
 */
export type Unsubscribe = () => void;