import { Timestamp } from 'firebase/firestore';

// Food and Nutrition Types
export interface FoodEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  calories: number;
  macros: MacroNutrients;
  photoURL?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Health preferences
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
  dailyCalorieGoal: number;
  dailyWaterGoal: number; // in ml
  dailyStepsGoal: number;
  
  // Personal info
  dateOfBirth?: Timestamp;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

// Food and Nutrition Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'morning_snack' | 'evening_snack';

export interface MealCategory {
  type: MealType;
  name: string;
  currentCalories: number;
  allocatedCalories: number;
  itemCount: number;
  icon?: string;
}

export type MealCategoryState = 'empty' | 'partial' | 'goal_met' | 'over_goal' | 'loading';

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
  cholesterol?: number; // in mg
}

export interface FoodItem {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  
  // Food details
  foodName: string;
  brand?: string;
  quantity: number;
  unit: string; // 'g', 'ml', 'cup', 'piece', etc.
  
  // Nutrition information (calculated/random for Phase 3)
  nutrition: NutritionInfo;
  
  // Optional photo
  photoURL?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

// Health Metrics Types
export interface WeightEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  weight: number; // Always stored in kg for consistency
  unit: 'kg' | 'lbs'; // User's preferred display unit
  bmi?: number; // Calculated if height available
  bmiCategory?: BMICategory;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  notes?: string;
}

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese_class_1' | 'obese_class_2' | 'obese_class_3';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type TrendStrength = 'strong' | 'moderate' | 'weak';

export interface WeightAnalysis {
  currentEntry: WeightEntry;
  previousEntry?: WeightEntry;
  changeFromPrevious: {
    absolute: number; // +/- kg
    percentage: number; // +/- %
    direction: TrendDirection;
    daysSincePrevious: number;
  };
  weeklyAverage?: number; // kg
  monthlyAverage?: number; // kg
  trend: {
    direction: TrendDirection;
    strength: TrendStrength;
    confidenceLevel: number; // 0-1
  };
  goalProgress?: {
    targetWeight: number; // kg
    currentProgress: number; // percentage toward goal
    estimatedDaysToGoal?: number;
    isOnTrack: boolean;
  };
}

export interface WeightGoal {
  targetWeight: number; // kg
  targetDate?: string; // YYYY-MM-DD
  weeklyGoal: number; // kg per week target change
  goalType: 'lose' | 'gain' | 'maintain';
}

export interface WeightStats {
  totalEntries: number;
  firstEntryDate?: string;
  lastEntryDate: string;
  lowestWeight: { weight: number; date: string };
  highestWeight: { weight: number; date: string };
  averageWeight: number;
  weightRange: number; // difference between highest and lowest
  averageWeeklyChange: number;
}

export interface WaterEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  amount: number; // Always stored in ml for consistency
  unit: 'ml' | 'fl_oz' | 'cups'; // User's preferred input unit
  timestamp: Timestamp; // When entry was logged
  source?: 'water' | 'coffee' | 'tea' | 'juice' | 'other'; // Type of liquid
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface WaterGoal {
  dailyTarget: number; // ml per day
  unit: 'ml' | 'fl_oz' | 'cups'; // User's preferred display unit
  reminderInterval?: number; // minutes between reminders
  reminderStartTime?: string; // HH:MM format
  reminderEndTime?: string; // HH:MM format
  isActive: boolean;
}

export interface WaterAnalysis {
  date: string;
  totalConsumed: number; // ml
  goal: number; // ml
  percentageAchieved: number; // 0-100+
  remaining: number; // ml (negative if over goal)
  entries: WaterEntry[];
  entriesCount: number;
  avgEntrySize: number; // ml
  goalAchieved: boolean;
  hourlyDistribution: Array<{
    hour: number; // 0-23
    amount: number; // ml
  }>;
  streak: {
    current: number; // consecutive days meeting goal
    longest: number; // all-time longest streak
  };
}

export interface WaterStats {
  totalDays: number;
  totalVolume: number; // ml
  averageDaily: number; // ml
  goalAchievementRate: number; // percentage
  currentStreak: number;
  longestStreak: number;
  favoriteHour: number; // 0-23, most common logging time
  averageEntriesPerDay: number;
  bestDay: {
    date: string;
    amount: number; // ml
  };
}

// Water unit conversion helpers
export type WaterUnit = 'ml' | 'fl_oz' | 'cups';

export interface WaterQuickAdd {
  amount: number; // in user's preferred unit
  label: string;
  icon?: string;
}

export interface StepsEntry {
  id: string;
  userId: string;
  steps: number;
  date: string;             // YYYY-MM-DD format
  source: StepsSource;
  caloriesBurned: number;   // Estimated from steps
  goalProgress: {
    dailyGoal: number;
    achieved: boolean;
    percentage: number;
  };
  timestamp: Timestamp;     // When entry was logged
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format

  // Workout details
  type: WorkoutType;
  name: string; // e.g., 'Morning Run', 'Chest Day'
  duration: number; // in minutes
  intensity: WorkoutIntensity;
  caloriesBurned: number; // Calculated based on type, intensity, duration

  // Optional details
  distance?: number; // For cardio activities (km)
  sets?: number; // For strength training
  reps?: number; // For strength training
  weight?: number; // For strength training (kg)

  // Metadata
  timestamp: Timestamp; // When workout was logged
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  notes?: string;
}

// Activity tracking types
export type WorkoutType =
  | 'cardio' | 'running' | 'walking' | 'cycling' | 'swimming'
  | 'strength' | 'weightlifting' | 'bodyweight' | 'powerlifting'
  | 'sports' | 'basketball' | 'football' | 'tennis' | 'soccer'
  | 'flexibility' | 'yoga' | 'pilates' | 'stretching'
  | 'dance' | 'martial_arts' | 'hiking' | 'climbing' | 'other';

export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface WorkoutTypeInfo {
  type: WorkoutType;
  name: string;
  category: 'cardio' | 'strength' | 'sports' | 'flexibility' | 'other';
  icon: string;
  baseCaloriesPerMinute: number; // Base calories burned per minute
  intensityMultipliers: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface StepsGoal {
  dailyTarget: number; // steps per day
  isActive: boolean;
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
}

export interface ActivityAnalysis {
  date: string;
  stepsEntry?: StepsEntry;
  workoutEntries: WorkoutEntry[];

  // Steps analysis
  totalSteps: number;
  stepsGoal: number;
  stepsGoalAchieved: boolean;
  stepsCaloriesBurned: number;
  stepsProgress: number; // percentage 0-100+

  // Workout analysis
  totalWorkouts: number;
  totalWorkoutDuration: number; // minutes
  workoutCaloriesBurned: number;
  workoutsByType: Record<WorkoutType, number>;
  avgWorkoutDuration: number;

  // Combined analysis
  totalCaloriesBurned: number;
  totalActiveMinutes: number;
  activityScore: number; // 0-100 based on goals and activity

  // Streaks and goals
  streaks: {
    stepsGoalDays: number;
    workoutDays: number;
    activeMinutesDays: number;
  };
}

export interface ActivityStats {
  totalDays: number;

  // Steps statistics
  totalSteps: number;
  averageSteps: number;
  stepsGoalAchievementRate: number; // percentage
  bestStepsDay: { date: string; steps: number };

  // Workout statistics
  totalWorkouts: number;
  totalWorkoutMinutes: number;
  averageWorkoutsPerDay: number;
  favoriteWorkoutType: WorkoutType;
  longestWorkout: { date: string; duration: number; type: WorkoutType };

  // Calorie statistics
  totalCaloriesBurned: number;
  averageCaloriesPerDay: number;
  bestCalorieDay: { date: string; calories: number };

  // Streaks
  currentStepsStreak: number;
  longestStepsStreak: number;
  currentWorkoutStreak: number;
  longestWorkoutStreak: number;
}

// Daily Summary Types
export interface DailyNutritionSummary {
  date: string; // YYYY-MM-DD format
  userId: string;
  
  // Totals from all meals
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  
  // Goals and progress
  calorieGoal: number;
  caloriesRemaining: number;
  
  // Meal breakdown
  mealBreakdown: {
    [key in MealType]: {
      calories: number;
      itemCount: number;
    };
  };
  
  lastUpdated: Timestamp;
}

export interface DailyHealthSummary {
  date: string; // YYYY-MM-DD format
  userId: string;
  
  // Water tracking
  waterIntake: number; // in ml
  waterGoal: number; // in ml
  
  // Activity tracking
  steps: number;
  stepsGoal: number;
  
  // Weight tracking
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  
  // Workout tracking
  totalWorkoutDuration: number; // in minutes
  totalCaloriesBurned: number;
  workoutCount: number;
  
  lastUpdated: Timestamp;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Store State Types (for Zustand)
export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface HealthDataState {
  // Current selected date
  selectedDate: string;
  
  // Food data
  foodItems: FoodItem[];
  dailyNutrition: DailyNutritionSummary | null;
  
  // Health metrics
  dailyHealth: DailyHealthSummary | null;
  weightEntries: WeightEntry[];
  waterEntries: WaterEntry[];
  stepsEntries: StepsEntry[];
  workoutEntries: WorkoutEntry[];
  
  // Loading states
  isLoadingFood: boolean;
  isLoadingHealth: boolean;
  
  // Error states
  foodError: string | null;
  healthError: string | null;
}

// Form Types
export interface AddFoodForm {
  foodName: string;
  mealType: MealType;
  quantity: number;
  unit: string;
  brand?: string;
  notes?: string;
}

// Enhanced Food Entry Form Types for Story 7.2
export type MeasurementUnit = 'cups' | 'ounces' | 'grams' | 'pounds' | 'pieces' | 'slices' | 'tablespoons' | 'teaspoons' | 'liters' | 'milliliters';

export interface FoodEntryFormData {
  name: string;
  quantity: string;          // String for user input, converted to number
  unit: MeasurementUnit;
  mealType: MealType;
  date: string;             // YYYY-MM-DD format
  notes?: string;
  photoUri?: string;        // Local photo URI before upload
}

export interface FoodEntryFormState {
  data: FoodEntryFormData;
  errors: Partial<Record<keyof FoodEntryFormData, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  nutritionPreview: NutritionInfo | null;
  recentFoods: FoodSuggestion[];
}

export interface FoodSuggestion {
  name: string;
  commonUnits: MeasurementUnit[];
  frequency: number;         // How often user has logged this food
  lastUsed: Timestamp;
}

export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | true;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export interface AddWeightForm {
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface AddWaterForm {
  amount: string; // String for user input, converted to number
  unit: WaterUnit;
  source?: 'water' | 'coffee' | 'tea' | 'juice' | 'other';
  notes?: string;
}

export interface WaterFormState {
  data: AddWaterForm;
  errors: Partial<Record<keyof AddWaterForm, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface AddStepsForm {
  steps: string; // String for user input, converted to number
  goal?: number;
  notes?: string;
}

export interface StepsFormState {
  data: AddStepsForm;
  errors: Partial<Record<keyof AddStepsForm, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface AddWorkoutForm {
  type: WorkoutType;
  name: string;
  duration: string; // String for user input, converted to number
  intensity: WorkoutIntensity;
  distance?: string; // Optional for cardio (km)
  sets?: string; // Optional for strength training
  reps?: string; // Optional for strength training
  weight?: string; // Optional for strength training (kg)
  notes?: string;
}

export interface WorkoutFormState {
  data: AddWorkoutForm;
  errors: Partial<Record<keyof AddWorkoutForm, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  calorieEstimate: number;
}

// Additional types for Story 8.5 requirements
export type StepsSource = 'manual' | 'device' | 'estimated' | 'healthkit' | 'google_fit';

export interface DailyActivitySummary {
  date: string;
  steps: {
    total: number;
    goal: number;
    caloriesBurned: number;
    goalAchieved: boolean;
    source: StepsSource;
  };
  workouts: {
    sessions: WorkoutEntry[];
    totalDuration: number;    // minutes
    totalCaloriesBurned: number;
    activeMinutes: number;    // high + medium intensity minutes
  };
  combined: {
    totalCaloriesBurned: number;
    totalActiveMinutes: number;
    activityScore: number;    // 0-100 based on goals achievement
  };
  goals: {
    stepsGoal: number;
    activeMinutesGoal: number;
    workoutsPerWeekGoal: number;
  };
}

export interface ActivityGoals {
  dailySteps: number;          // Default: 10,000
  weeklyWorkouts: number;      // Default: 3
  dailyActiveMinutes: number;  // Default: 30
  caloriesBurnGoal?: number;   // Optional daily calorie burn target
}