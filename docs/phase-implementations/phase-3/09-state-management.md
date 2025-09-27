# Phase 3: State Management Architecture
## Zustand Stores for Health Data

---

## State Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand State Layer                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Auth Store    │ Nutrition Store │    Health Store         │
│                 │                 │                         │
│ - User data     │ - Daily meals   │ - Weight tracking       │
│ - Session mgmt  │ - Food entries  │ - Water intake          │
│ - Permissions   │ - Nutrition     │ - Steps & workouts      │
├─────────────────┼─────────────────┼─────────────────────────┤
│   UI Store      │  Cache Store    │    Sync Store           │
│                 │                 │                         │
│ - Loading states│ - Cached data   │ - Queue operations      │
│ - Error states  │ - Images        │ - Network status        │
│ - Navigation    │ - Preferences   │ - Sync status           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Auth Store

### User Authentication State
```typescript
// src/stores/authStore.ts
interface AuthState {
  // User data
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  
  // Session management
  token: string | null;
  tokenExpiry: Date | null;
  lastActivity: Date | null;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Session management
  checkAuthState: () => Promise<void>;
  extendSession: () => void;
  handleTokenExpiry: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      token: null,
      tokenExpiry: null,
      lastActivity: null,
      isLoading: false,
      isInitializing: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, token } = await AuthService.login(email, password);
          const profile = await AuthService.getUserProfile(user.uid);
          
          set({
            user,
            profile,
            token,
            isAuthenticated: true,
            tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            lastActivity: new Date(),
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await AuthService.logout();
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          tokenExpiry: null,
          lastActivity: null
        });
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        token: state.token,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

## Nutrition Store

### Food Tracking State Management
```typescript
// src/stores/nutritionStore.ts
interface NutritionState {
  // Current date data
  selectedDate: string; // YYYY-MM-DD
  dailyData: DailyNutrition | null;
  
  // Meal data
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    morningSnack: Meal;
    eveningSnack: Meal;
  };
  
  // Aggregated nutrition
  totalNutrition: NutritionInfo;
  nutritionProgress: ProgressInfo;
  
  // Goals
  nutritionGoals: NutritionGoals;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  lastUpdated: Date | null;
  
  // Actions
  setSelectedDate: (date: string) => Promise<void>;
  addFoodItem: (mealType: MealType, food: FoodItem) => Promise<void>;
  updateFoodItem: (mealType: MealType, foodId: string, updates: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (mealType: MealType, foodId: string) => Promise<void>;
  
  // Nutrition calculations
  calculateMealTotals: (mealType: MealType) => NutritionInfo;
  calculateDailyTotals: () => NutritionInfo;
  updateNutritionProgress: () => void;
  
  // Goals management
  updateNutritionGoals: (goals: Partial<NutritionGoals>) => Promise<void>;
  
  // Data management
  loadDailyData: (date: string) => Promise<void>;
  syncToFirebase: () => Promise<void>;
  clearCache: () => void;
}

const useNutritionStore = create<NutritionState>()(
  subscribeWithSelector((set, get) => ({
    selectedDate: new Date().toISOString().split('T')[0],
    dailyData: null,
    meals: {
      breakfast: { id: 'breakfast', type: 'breakfast', foods: [], totalNutrition: EMPTY_NUTRITION },
      lunch: { id: 'lunch', type: 'lunch', foods: [], totalNutrition: EMPTY_NUTRITION },
      dinner: { id: 'dinner', type: 'dinner', foods: [], totalNutrition: EMPTY_NUTRITION },
      morningSnack: { id: 'morningSnack', type: 'morningSnack', foods: [], totalNutrition: EMPTY_NUTRITION },
      eveningSnack: { id: 'eveningSnack', type: 'eveningSnack', foods: [], totalNutrition: EMPTY_NUTRITION }
    },
    totalNutrition: EMPTY_NUTRITION,
    nutritionProgress: EMPTY_PROGRESS,
    nutritionGoals: DEFAULT_NUTRITION_GOALS,
    isLoading: false,
    isSyncing: false,
    lastUpdated: null,

    addFoodItem: async (mealType: MealType, food: FoodItem) => {
      const state = get();
      
      // Optimistic update
      const updatedMeal = {
        ...state.meals[mealType],
        foods: [...state.meals[mealType].foods, food]
      };
      updatedMeal.totalNutrition = NutritionService.calculateMealTotals(updatedMeal.foods);
      
      set({
        meals: { ...state.meals, [mealType]: updatedMeal },
        lastUpdated: new Date()
      });
      
      // Recalculate totals
      get().calculateDailyTotals();
      get().updateNutritionProgress();
      
      // Sync to Firebase
      await get().syncToFirebase();
    },

    calculateDailyTotals: () => {
      const state = get();
      const totalNutrition = Object.values(state.meals).reduce(
        (total, meal) => NutritionService.addNutrition(total, meal.totalNutrition),
        EMPTY_NUTRITION
      );
      
      set({ totalNutrition });
      return totalNutrition;
    }
  }))
);
```

## Health Store

### Health Metrics State Management
```typescript
// src/stores/healthStore.ts
interface HealthState {
  // Current date
  selectedDate: string;
  
  // Health metrics
  weight: WeightEntry | null;
  waterIntake: WaterTracking;
  steps: StepsTracking;
  workouts: WorkoutSession[];
  
  // Goals
  healthGoals: HealthGoals;
  
  // Progress tracking
  weightProgress: WeightProgress;
  waterProgress: number; // percentage
  stepsProgress: number; // percentage
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  
  // Actions
  updateWeight: (weight: WeightEntry) => Promise<void>;
  addWaterIntake: (amount: number) => Promise<void>;
  updateSteps: (steps: number) => Promise<void>;
  addWorkout: (workout: WorkoutSession) => Promise<void>;
  
  // Progress calculations
  calculateWeightProgress: () => WeightProgress;
  calculateWaterProgress: () => number;
  calculateStepsProgress: () => number;
  
  // Data management
  loadHealthData: (date: string) => Promise<void>;
  syncHealthData: () => Promise<void>;
}

const useHealthStore = create<HealthState>()((set, get) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  weight: null,
  waterIntake: {
    totalIntake: 0,
    goalAmount: 2000, // ml
    entries: [],
    completionPercentage: 0
  },
  steps: {
    count: 0,
    goal: 10000,
    manual: true,
    timestamp: new Date()
  },
  workouts: [],
  healthGoals: DEFAULT_HEALTH_GOALS,
  weightProgress: EMPTY_WEIGHT_PROGRESS,
  waterProgress: 0,
  stepsProgress: 0,
  isLoading: false,
  isSyncing: false,

  addWaterIntake: async (amount: number) => {
    const state = get();
    const newEntry: WaterEntry = {
      amount,
      timestamp: new Date(),
      type: 'custom'
    };
    
    const updatedWaterIntake = {
      ...state.waterIntake,
      totalIntake: state.waterIntake.totalIntake + amount,
      entries: [...state.waterIntake.entries, newEntry]
    };
    
    updatedWaterIntake.completionPercentage = 
      (updatedWaterIntake.totalIntake / updatedWaterIntake.goalAmount) * 100;
    
    set({ 
      waterIntake: updatedWaterIntake,
      waterProgress: updatedWaterIntake.completionPercentage
    });
    
    await get().syncHealthData();
  }
}));
```

## UI Store

### Application UI State
```typescript
// src/stores/uiStore.ts
interface UIState {
  // Loading states
  globalLoading: boolean;
  screenLoading: Record<string, boolean>;
  
  // Error states
  errors: UIError[];
  warnings: UIWarning[];
  
  // Modals and overlays
  activeModal: string | null;
  modalData: any;
  
  // Navigation
  currentScreen: string;
  navigationHistory: string[];
  
  // Form states
  formData: Record<string, any>;
  formErrors: Record<string, string[]>;
  
  // Actions
  setLoading: (screen: string, loading: boolean) => void;
  showError: (error: UIError) => void;
  clearErrors: () => void;
  showModal: (modalId: string, data?: any) => void;
  hideModal: () => void;
  setFormData: (formId: string, data: any) => void;
  clearFormData: (formId: string) => void;
}
```

## Store Integration & Persistence

### Cross-Store Communication
```typescript
// Subscribe to auth state changes in other stores
useNutritionStore.subscribe(
  (state) => state.selectedDate,
  (selectedDate) => {
    if (useAuthStore.getState().isAuthenticated) {
      useNutritionStore.getState().loadDailyData(selectedDate);
      useHealthStore.getState().loadHealthData(selectedDate);
    }
  }
);

// Auto-sync when coming online
useSyncStore.subscribe(
  (state) => state.isOnline,
  (isOnline) => {
    if (isOnline) {
      useNutritionStore.getState().syncToFirebase();
      useHealthStore.getState().syncHealthData();
    }
  }
);
```

### State Persistence Strategy
```typescript
// Persist critical data only
const persistConfig = {
  name: 'health-dashboard-store',
  partialize: (state) => ({
    // Auth data
    user: state.user,
    token: state.token,
    
    // Current day data only
    selectedDate: state.selectedDate,
    nutritionGoals: state.nutritionGoals,
    healthGoals: state.healthGoals,
    
    // UI preferences
    theme: state.theme,
    notifications: state.notifications
  }),
  version: 1,
  migrate: (persistedState, version) => {
    // Handle store migrations
    return persistedState;
  }
};
```

## Performance Optimizations

### State Update Patterns
- **Batch Updates**: Group related state changes
- **Selective Subscriptions**: Only subscribe to needed state slices
- **Computed Values**: Use derived state for expensive calculations
- **Debounced Actions**: Prevent excessive API calls
- **Memory Management**: Clean up subscriptions and cached data