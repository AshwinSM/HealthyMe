# Phase 3: Data Models & Database Schema
## Firebase Firestore Structure

---

## Database Hierarchy

```
users/{userId}/
├── profile/
│   ├── email: string
│   ├── dailyCalorieGoal: number
│   ├── dailyWaterGoal: number (liters)
│   ├── dailyStepsGoal: number  
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
├── dailyData/{date}/
│   ├── meals/
│   │   ├── breakfast/
│   │   │   ├── foods: FoodItem[]
│   │   │   └── totalNutrition: NutritionInfo
│   │   ├── lunch/
│   │   ├── dinner/
│   │   ├── morningSnack/
│   │   └── eveningSnack/
│   ├── healthMetrics/
│   │   ├── weight: { value: number, unit: string, timestamp: Date }
│   │   ├── water: { intake: number, goal: number, entries: WaterEntry[] }
│   │   ├── steps: { count: number, goal: number, manual: boolean }
│   │   └── workouts: WorkoutSession[]
│   └── summary/
│       ├── totalCalories: number
│       ├── totalNutrition: NutritionInfo
│       └── completedMetrics: string[]
└── goals/
    ├── nutrition: NutritionGoals
    └── health: HealthGoals
```

## Core Data Types

### Nutrition Models

```typescript
interface NutritionInfo {
  calories: number;
  protein: number;    // grams
  carbs: number;      // grams  
  fats: number;       // grams
  fiber: number;      // grams
}

interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  nutrition: NutritionInfo;
  timestamp: Date;
  photoUrl?: string;
  photoPath?: string; // Firebase Storage path
}

interface Meal {
  id: string;
  type: MealType;
  foods: FoodItem[];
  totalNutrition: NutritionInfo;
  lastUpdated: Date;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'eveningSnack';

type MeasurementUnit = 
  | 'grams' | 'kg' | 'cup' | 'bowl' | 'oz' | 'ltr' | 'ml'
  | 'serving' | 'piece' | 'teacup' | 'tablespoon' | 'teaspoon';
```

### Health Metrics Models

```typescript
interface WeightEntry {
  value: number;      // Always stored in kg
  unit: 'kg' | 'lbs'; // Display unit
  timestamp: Date;
  trend?: 'up' | 'down' | 'stable';
  changeFromPrevious?: number;
}

interface WaterEntry {
  amount: number;     // ml
  timestamp: Date;
  type: 'glass' | 'bottle' | 'cup' | 'custom';
}

interface WaterTracking {
  totalIntake: number;  // ml
  goalAmount: number;   // ml
  entries: WaterEntry[];
  completionPercentage: number;
}

interface StepsTracking {
  count: number;
  goal: number;
  manual: boolean;
  timestamp: Date;
  source?: 'manual' | 'healthkit' | 'googlefit';
}

interface WorkoutSession {
  id: string;
  type: WorkoutType;
  name: string;
  duration: number;     // minutes
  caloriesBurned: number;
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
  timestamp: Date;
}

type WorkoutType = 'cardio' | 'strength' | 'sports' | 'flexibility' | 'other';
```

### Daily Summary Model

```typescript
interface DailyNutrition {
  date: string;         // YYYY-MM-DD
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    morningSnack: Meal;
    eveningSnack: Meal;
  };
  totalNutrition: NutritionInfo;
  healthMetrics: {
    weight?: WeightEntry;
    water: WaterTracking;
    steps: StepsTracking;
    workouts: WorkoutSession[];
  };
  summary: {
    totalCalories: number;
    caloriesFromExercise: number;
    netCalories: number;
    metricsCompleted: string[];
  };
  lastUpdated: Date;
}
```

## Firestore Collections Structure

### Users Collection
```
/users/{userId}
- Stores user profile and preferences
- Security: User can only access their own document
```

### Daily Data Subcollection
```
/users/{userId}/dailyData/{YYYY-MM-DD}
- Date-partitioned for optimal querying
- Automatic cleanup of old data (>2 years)
- Indexed on date for historical queries
```

### Goals Subcollection
```
/users/{userId}/goals/nutrition
/users/{userId}/goals/health
- Separate goal tracking from daily data
- Allows for goal history and adjustments
```

## Data Validation Rules

### Input Validation
```typescript
// Nutrition bounds
const NUTRITION_BOUNDS = {
  calories: { min: 0, max: 5000 },
  protein: { min: 0, max: 300 },
  carbs: { min: 0, max: 800 },
  fats: { min: 0, max: 200 },
  fiber: { min: 0, max: 100 }
};

// Health metrics bounds  
const HEALTH_BOUNDS = {
  weight: { min: 20, max: 300 }, // kg
  water: { min: 0, max: 10000 }, // ml per day
  steps: { min: 0, max: 100000 },
  workoutDuration: { min: 1, max: 480 } // minutes
};
```

## Indexing Strategy

### Composite Indexes
```javascript
// For historical nutrition queries
{ userId: 'asc', date: 'desc' }

// For meal type filtering
{ userId: 'asc', 'meals.breakfast.lastUpdated': 'desc' }

// For workout tracking
{ userId: 'asc', 'healthMetrics.workouts.timestamp': 'desc' }
```

### Single Field Indexes
```javascript
// Automatic indexes on:
- userId
- date  
- timestamp fields
- lastUpdated fields
```

## Migration Strategy

### Version 1.0 Schema
- Current Phase 3 implementation
- Random nutrition generation
- Basic health metrics

### Version 2.0 Schema (Phase 4)
- Add nutrition API integration fields
- Barcode and product ID references
- Recipe and meal template storage

### Backward Compatibility
- Use schema versioning in documents
- Graceful handling of missing fields
- Migration scripts for data updates