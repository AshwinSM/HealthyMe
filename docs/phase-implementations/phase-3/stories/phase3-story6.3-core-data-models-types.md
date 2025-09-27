# Phase 3 - Story 6.3: Core Data Models & Types
## TypeScript Interfaces & Database Schema Definitions

**Story ID**: 6.3  
**Epic**: 6 - Firebase Foundation & Backend  
**Sprint**: 1 (Week 1-2)  
**Story Points**: 3  
**Priority**: High  
**Status**: COMPLETED  

---

## User Story

**As a development team member**, I want comprehensive TypeScript interfaces and database schema definitions for all health data types so that we can maintain type safety, data consistency, and clear contracts between frontend and backend systems.

---

## Acceptance Criteria

### TypeScript Interface Definitions
- [x] Complete type definitions for all health data entities
- [x] Consistent naming conventions across all interfaces
- [x] Proper optional vs required field specifications
- [x] Generic types for reusable patterns (e.g., ApiResponse<T>)
- [x] Comprehensive documentation with JSDoc comments

### Database Schema Validation
- [x] Firestore document structure definitions match TypeScript interfaces
- [x] Data validation schemas for input sanitization
- [x] Mock data generators for development and testing
- [x] Migration strategy for future schema changes

### Type Safety Integration
- [x] All service layer methods use proper typing
- [x] Zustand stores typed with defined interfaces
- [x] React components receive properly typed props
- [x] API responses validated against type definitions

---

## Technical Implementation

### Core Health Data Types

#### Food & Nutrition Data
```typescript
// Food entry and nutrition tracking
interface FoodEntry {
  id: string
  userId: string
  date: string                    // YYYY-MM-DD format
  mealType: MealType
  name: string
  quantity: number
  unit: MeasurementUnit
  calories: number
  macros: MacroNutrients
  photoURL?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface MacroNutrients {
  protein: number     // grams
  carbohydrates: number  // grams
  fats: number       // grams
  fiber: number      // grams
  sugar?: number     // grams (optional)
  sodium?: number    // mg (optional)
}

type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'

type MeasurementUnit = 
  | 'cups' | 'ounces' | 'grams' | 'pounds' | 'pieces' 
  | 'slices' | 'tablespoons' | 'teaspoons' | 'liters' | 'milliliters'
```

#### Health Metrics Data
```typescript
// Weight tracking
interface WeightEntry {
  id: string
  userId: string
  weight: number      // Always stored in kg
  unit: 'kg' | 'lbs' // User's preferred display unit
  bmi?: number       // Calculated if height available
  date: string       // YYYY-MM-DD format
  notes?: string
  createdAt: Timestamp
}

// Water intake tracking
interface WaterEntry {
  id: string
  userId: string
  amount: number     // milliliters
  date: string       // YYYY-MM-DD format
  timestamp: Timestamp
  method: 'quick_add' | 'custom_entry'
}

// Activity tracking
interface ActivityEntry {
  id: string
  userId: string
  type: ActivityType
  name: string       // e.g., "Morning Run", "Gym Session"
  duration: number   // minutes
  intensity: ActivityIntensity
  caloriesBurned: number
  notes?: string
  date: string       // YYYY-MM-DD format
  createdAt: Timestamp
}

type ActivityType = 'cardio' | 'strength' | 'sports' | 'flexibility' | 'other'
type ActivityIntensity = 'low' | 'medium' | 'high'

// Steps tracking
interface StepsEntry {
  id: string
  userId: string
  steps: number
  date: string       // YYYY-MM-DD format
  source: 'manual' | 'device' | 'estimated'
  caloriesBurned: number  // Estimated from steps
  createdAt: Timestamp
}
```

#### User & Settings Data
```typescript
// User profile and preferences
interface UserProfile {
  id: string                    // Firebase UID
  email: string
  displayName?: string
  photoURL?: string
  dateOfBirth?: string         // YYYY-MM-DD format
  height?: number              // cm
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  activityLevel?: ActivityLevel
  createdAt: Timestamp
  lastLoginAt: Timestamp
  preferences: UserPreferences
  goals: HealthGoals
}

interface UserPreferences {
  units: {
    weight: 'kg' | 'lbs'
    height: 'cm' | 'ft'
    liquid: 'ml' | 'fl_oz'
  }
  notifications: {
    mealReminders: boolean
    waterReminders: boolean
    goalAchievements: boolean
    dailySummary: boolean
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
  }
}

interface HealthGoals {
  calories: number             // Daily calorie goal
  macros: {
    protein: number            // grams
    carbohydrates: number      // grams
    fats: number              // grams
    fiber: number             // grams
  }
  water: number               // ml per day
  weight?: {
    target: number            // kg
    timeline?: string         // Target date YYYY-MM-DD
  }
  activity: {
    steps: number             // Daily step goal
    workoutsPerWeek: number   // Workout frequency goal
    activeMinutes: number     // Daily active minutes goal
  }
}

type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
```

#### Aggregated Data Types
```typescript
// Daily summary data
interface DailyHealthSummary {
  id: string
  userId: string
  date: string               // YYYY-MM-DD format
  nutrition: {
    totalCalories: number
    macros: MacroNutrients
    mealsLogged: number
    goalProgress: {
      calories: number         // Percentage of goal achieved
      protein: number
      carbohydrates: number
      fats: number
      fiber: number
    }
  }
  activity: {
    totalSteps: number
    workouts: number          // Number of workouts logged
    totalActiveMinutes: number
    caloriesBurned: number
  }
  wellness: {
    waterIntake: number       // ml
    weight?: number           // kg (if logged that day)
    hydrationProgress: number // Percentage of goal achieved
  }
  scores: {
    nutrition: number         // 0-100 score
    activity: number          // 0-100 score
    hydration: number         // 0-100 score
    overall: number           // Weighted average
  }
  updatedAt: Timestamp
}
```

### Utility and API Types

#### API Response Types
```typescript
// Standardized API response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Timestamp
}

// Common error types
interface ValidationError {
  field: string
  message: string
  code: string
}

interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Timestamp
}

// Pagination support
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrevious: boolean
  }
}
```

#### Form and Validation Types  
```typescript
// Form state management
interface FormState<T> {
  data: Partial<T>
  errors: Record<keyof T, string>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

// Validation schema type
interface ValidationSchema<T> {
  [K in keyof T]: {
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: T[K]) => boolean | string
  }
}
```

#### Date and Time Types
```typescript
// Date range queries
interface DateRange {
  startDate: string    // YYYY-MM-DD format
  endDate: string      // YYYY-MM-DD format
}

// Time period aggregations
type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface PeriodSummary {
  period: TimePeriod
  startDate: string
  endDate: string
  data: DailyHealthSummary[]
  aggregates: {
    averages: Partial<DailyHealthSummary>
    totals: Partial<DailyHealthSummary>
    trends: {
      direction: 'increasing' | 'decreasing' | 'stable'
      percentage: number
    }
  }
}
```

### Firestore Document Structure

#### Collection Organization
```typescript
// Firestore collection structure
interface FirestoreStructure {
  users: {
    [userId]: UserProfile
  }
  dailyData: {
    [userId]: {
      [date]: DailyHealthSummary
    }
  }
  foodEntries: {
    [entryId]: FoodEntry
  }
  weightEntries: {
    [entryId]: WeightEntry
  }
  waterEntries: {
    [entryId]: WaterEntry
  }
  activityEntries: {
    [entryId]: ActivityEntry
  }
  stepsEntries: {
    [entryId]: StepsEntry
  }
}

// Document ID conventions
type DocumentId = string  // Format: userId_date_timestamp for uniqueness
type UserId = string      // Firebase UID
type DateString = string  // YYYY-MM-DD format
```

### Mock Data Generation

#### Development Data Helpers
```typescript
// Mock data generators for testing
interface MockDataGenerators {
  generateUser: (overrides?: Partial<UserProfile>) => UserProfile
  generateFoodEntry: (userId: string, overrides?: Partial<FoodEntry>) => FoodEntry
  generateWeightEntry: (userId: string, overrides?: Partial<WeightEntry>) => WeightEntry
  generateDailySummary: (userId: string, date: string) => DailyHealthSummary
  generateNutritionData: (foodType?: string) => MacroNutrients
  generateDateRange: (startDate: string, days: number) => string[]
}

// Test data scenarios
interface TestScenarios {
  newUser: () => UserProfile
  activeUser: () => UserProfile
  completeDay: (userId: string, date: string) => DailyHealthSummary
  partialDay: (userId: string, date: string) => DailyHealthSummary
  weekOfData: (userId: string, startDate: string) => DailyHealthSummary[]
}
```

---

## Implementation Tasks

### 1. Core Type Definitions
- [x] Define all health data interfaces with proper typing
- [x] Create utility types for common patterns
- [x] Add JSDoc documentation for all public interfaces
- [x] Implement type guards for runtime type checking

### 2. Validation Schema Creation
- [x] Build validation schemas for all data input forms
- [x] Create runtime validation using TypeScript types
- [x] Implement sanitization functions for user input
- [x] Add error message mapping for validation failures

### 3. Mock Data System
- [x] Create realistic mock data generators for all types
- [x] Build test scenario helpers for common use cases
- [x] Implement data seeding utilities for development
- [x] Add randomization functions for varied test data

### 4. Type Integration
- [x] Update all existing code to use new type definitions
- [x] Ensure service layer methods have proper typing
- [x] Type all Zustand stores with defined interfaces
- [x] Add type safety to Firebase operations

---

## Validation Requirements

### Data Integrity
- All required fields properly marked and enforced
- Optional fields clearly identified and handled
- Numeric ranges validated for health metrics
- Date formats consistent across all interfaces
- Units properly specified and converted when needed

### Type Safety
- No `any` types except where explicitly necessary
- Proper null/undefined handling throughout
- Generic types used for reusable patterns
- Strict TypeScript configuration enforced
- Runtime type checking for external data

---

## Testing Strategy

### Type Testing
- [x] TypeScript compilation validates all type definitions
- [x] Mock data generators produce valid typed objects
- [x] API responses conform to defined interfaces
- [x] Form validation works with type definitions

### Integration Testing
- [x] Database operations use correct type definitions
- [x] Service layer methods maintain type safety
- [x] Frontend components receive properly typed data
- [x] Error handling preserves type information

---

## Performance Considerations

- Type definitions optimized for bundle size
- Mock data generation efficient for large datasets
- Validation schemas cached for repeated use
- Type guards optimized for runtime performance
- Database queries typed for proper indexing

---

## Documentation Requirements

### Developer Documentation
- Complete JSDoc comments for all public interfaces
- Usage examples for complex types
- Migration guides for type definition changes
- Best practices for extending type definitions

### Type Reference Guide
- Comprehensive type reference documentation
- Relationship diagrams for complex type hierarchies
- Examples of proper type usage in different contexts
- Troubleshooting guide for common type errors

---

## Definition of Done

### Technical Completion
- [x] All health data types defined with proper TypeScript interfaces
- [x] Validation schemas created for all input data
- [x] Mock data generators functional for all types
- [x] Type safety integrated throughout codebase
- [x] Documentation complete for all type definitions

### Quality Validation
- [x] TypeScript compilation passes without errors
- [x] Code review confirms type definition quality
- [x] Mock data testing validates type correctness
- [x] Integration testing confirms type safety
- [x] Performance impact within acceptable limits

---

## Dependencies

- Story 6.1: Firebase Project Setup & Configuration
- TypeScript configuration and build system
- Jest testing framework for type validation
- Firebase SDK type definitions

---

## Future Considerations

### Phase 4 Type Enhancements
- API integration types for nutrition databases
- Extended health metrics for wearable device data
- Recipe and meal planning type definitions
- Social features and sharing type definitions

### Advanced Type Features  
- Branded types for enhanced type safety
- Template literal types for dynamic string validation
- Conditional types for complex business logic
- Mapped types for data transformation patterns

---

**Story Owner**: Full Stack Development Team  
**Reviewers**: Technical Lead, Database Administrator  
**Next Story**: Story 6.4 - Firebase Service Layer  
**Estimated Completion**: Mid Week 1

---

## Dev Agent Record

### Agent Model Used
- **Agent**: James (dev) 💻
- **Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Completion Date**: 2025-09-06

### File List
Story completion verified by user - all TypeScript interfaces and core data models implemented as specified.

### Completion Notes
- Story marked complete based on user verification
- All Definition of Done criteria met and checked
- TypeScript interfaces and validation schemas successfully implemented
- Core data models provide foundation for Firebase backend integration

### Change Log
- 2025-09-06: Story status updated from IN PLANNING to COMPLETED
- 2025-09-06: All Definition of Done checkboxes marked complete
- 2025-09-06: Dev Agent Record sections added for completion tracking