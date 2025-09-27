// Re-export all health-related types
export * from './health';

// Navigation types (existing)
export * from './navigation';

// Common utility types
export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
}

// Meal types for food tracking (matches health.ts definition)
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'morning_snack' | 'evening_snack';

export type CategoryState = 'empty' | 'partial' | 'goalMet' | 'overGoal';

export interface MealCategoryProps {
  mealType: MealType;
  currentCalories: number;
  allocatedCalories: number;
  mealCount: number;
  onPress: (mealType: MealType) => void;
  isLoading?: boolean;
}

export interface MealCategoryState {
  isEmpty: boolean;           // No foods logged yet
  currentCalories: number;    // Sum of all foods in meal
  allocatedCalories: number;  // Goal calories for this meal type
  isGoalMet: boolean;        // currentCalories >= allocatedCalories
  isOverGoal: boolean;       // currentCalories > allocatedCalories * 1.1
  lastUpdated: Date;         // For showing data freshness
}