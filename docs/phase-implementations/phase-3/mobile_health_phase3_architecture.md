# Mobile Health Dashboard - Phase 3 Architecture
## Firebase Integration & Food Tracking System

**Version**: 1.0  
**Date**: August 31, 2025  
**Status**: Architecture Design  

---

## Executive Summary

This document outlines the comprehensive technical architecture for Phase 3 of the Mobile Health Dashboard application. Phase 3 introduces Firebase as the backend solution, comprehensive food tracking capabilities, nutrition calculations, and expanded health metrics. The architecture is designed for scalability, security, and optimal mobile performance while maintaining the existing React Native + Expo foundation.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile Health Dashboard                       │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Native + Expo)                      │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │   Login     │  Dashboard  │ Food Track  │   Profile   │     │
│  │   Screen    │   Screen    │   Screen    │   Screen    │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  State Management Layer (Zustand)                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │   Auth      │  Nutrition  │   Health    │    User     │     │
│  │   Store     │    Store    │   Store     │   Store     │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Firebase   │  Nutrition  │  Photo      │   Sync      │     │
│  │  Service    │  Service    │  Service    │  Service    │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│  Local Storage & Caching                                       │
│  ┌─────────────┬─────────────┬─────────────────────────────┐   │
│  │   Async     │    Image    │       Offline Queue         │   │
│  │   Storage   │   Cache     │                             │   │
│  └─────────────┴─────────────┴─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Backend Services                                     │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Firestore  │  Firebase   │  Firebase   │  Firebase   │     │
│  │  Database   │    Auth     │   Storage   │  Functions  │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Extensions

**New Dependencies for Phase 3:**
```json
{
  "firebase": "^10.7.1",
  "react-hook-form": "^7.48.2",
  "react-native-image-picker": "^7.1.0",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "react-native-uuid": "^2.0.1",
  "@react-native-community/netinfo": "^11.2.1",
  "react-native-fs": "^2.20.0"
}
```

---

## 2. Firebase Integration Architecture

### 2.1 Firebase Configuration

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### 2.2 Firestore Database Schema

```typescript
// User Profile Structure
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  goals: {
    dailyCalories: number;
    macros: {
      proteinPercentage: number;
      carbsPercentage: number;
      fatsPercentage: number;
    };
    water: number; // in L
    steps: number;
    weight?: number; // target weight in kg
  };
  preferences: {
    units: 'metric' | 'imperial';
    waterUnit: 'ml' | 'oz' | 'cups' | 'glasses';
    timezone: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Daily Health Data Structure
interface DailyHealthData {
  id: string; // format: YYYY-MM-DD
  userId: string;
  date: string; // ISO date string
  meals: {
    breakfast: FoodEntry[];
    lunch: FoodEntry[];
    dinner: FoodEntry[];
    morningSnack: FoodEntry[];
    eveningSnack: FoodEntry[];
  };
  nutrition: {
    totalCalories: number;
    totalProtein: number; // grams
    totalCarbs: number;   // grams
    totalFats: number;    // grams
    totalFiber: number;   // grams
  };
  healthMetrics: {
    weight?: {
      value: number;
      unit: 'kg' | 'lbs';
      recordedAt: Timestamp;
    };
    water: {
      totalIntake: number;
      unit: 'ml' | 'oz' | 'cups' | 'glasses';
      entries: WaterEntry[];
    };
    steps?: {
      count: number;
      recordedAt: Timestamp;
      source: 'manual' | 'device';
    };
    workouts: WorkoutEntry[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Food Entry Structure
interface FoodEntry {
  id: string;
  name: string;
  quantity: number;
  unit: 'grams' | 'kg' | 'oz' | 'cup' | 'bowl' | 'ltr' | 'ml' | 'teacup' | 'tablespoon' | 'teaspoon' | 'serving' | 'piece';
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number;   // grams
    fats: number;    // grams
    fiber: number;   // grams
  };
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'eveningSnack';
  photoURL?: string;
  recordedAt: Timestamp;
}

// Water Entry Structure
interface WaterEntry {
  id: string;
  amount: number;
  unit: 'ml' | 'oz' | 'cups' | 'glasses';
  recordedAt: Timestamp;
}

// Workout Entry Structure
interface WorkoutEntry {
  id: string;
  type: 'cardio' | 'strength' | 'sports' | 'other';
  name: string;
  duration: number; // minutes
  caloriesBurned: number;
  recordedAt: Timestamp;
}
```

### 2.3 Firestore Collection Structure

```
/users/{userId}
├── profile (document)
└── dailyData/{date} (subcollection)
    └── {YYYY-MM-DD} (document)
        ├── meals (map)
        ├── nutrition (map)
        ├── healthMetrics (map)
        ├── createdAt
        └── updatedAt

/savedMeals/{userId} (collection)
└── {mealId} (document)
    ├── name
    ├── foodItems[]
    ├── totalNutrition
    └── createdAt
```

### 2.4 Firebase Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their saved meals
    match /savedMeals/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public nutrition database (if implemented)
    match /nutritionDatabase/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}

// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload and access their own food photos
    match /users/{userId}/food-photos/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Data Layer Architecture

### 3.1 Service Layer Design

```typescript
// src/services/firebase.service.ts
export class FirebaseService {
  private static instance: FirebaseService;
  
  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // User Profile Operations
  async getUserProfile(uid: string): Promise<UserProfile | null>;
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>;
  
  // Daily Health Data Operations
  async getDailyHealthData(uid: string, date: string): Promise<DailyHealthData | null>;
  async saveDailyHealthData(uid: string, data: DailyHealthData): Promise<void>;
  async updateDailyHealthData(uid: string, date: string, updates: Partial<DailyHealthData>): Promise<void>;
  
  // Food Entry Operations
  async addFoodEntry(uid: string, date: string, mealType: string, foodEntry: FoodEntry): Promise<void>;
  async updateFoodEntry(uid: string, date: string, mealType: string, entryId: string, updates: Partial<FoodEntry>): Promise<void>;
  async deleteFoodEntry(uid: string, date: string, mealType: string, entryId: string): Promise<void>;
  
  // Health Metrics Operations
  async updateWeightEntry(uid: string, date: string, weight: WeightEntry): Promise<void>;
  async addWaterEntry(uid: string, date: string, waterEntry: WaterEntry): Promise<void>;
  async updateStepsEntry(uid: string, date: string, steps: StepsEntry): Promise<void>;
  async addWorkoutEntry(uid: string, date: string, workout: WorkoutEntry): Promise<void>;
}
```

### 3.2 Nutrition Service

```typescript
// src/services/nutrition.service.ts
export class NutritionService {
  private static instance: NutritionService;
  
  static getInstance(): NutritionService {
    if (!NutritionService.instance) {
      NutritionService.instance = new NutritionService();
    }
    return NutritionService.instance;
  }

  // Phase 3: Random nutrition generation
  generateRandomNutrition(foodName: string, quantity: number, unit: string): NutritionInfo {
    const baseCalories = this.getBaseCaloricDensity(foodName);
    const adjustedCalories = this.adjustCaloriesForQuantity(baseCalories, quantity, unit);
    
    return {
      calories: adjustedCalories,
      protein: this.calculateProtein(adjustedCalories),
      carbs: this.calculateCarbs(adjustedCalories),
      fats: this.calculateFats(adjustedCalories),
      fiber: this.calculateFiber(adjustedCalories)
    };
  }

  // Future: API integration methods
  async getNutritionFromAPI(foodName: string, quantity: number, unit: string): Promise<NutritionInfo>;
  async searchFoodDatabase(query: string): Promise<FoodSearchResult[]>;
  async getNutritionFromBarcode(barcode: string): Promise<NutritionInfo>;

  private getBaseCaloricDensity(foodName: string): number {
    // Smart random generation based on food type
    const densityMap: Record<string, [number, number]> = {
      // [min, max] calories per 100g
      'rice': [150, 200],
      'chicken': [200, 300],
      'vegetable': [20, 80],
      'fruit': [40, 100],
      'default': [150, 800]
    };
    
    const category = this.categorizeFood(foodName);
    const [min, max] = densityMap[category] || densityMap['default'];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
```

### 3.3 Photo Service

```typescript
// src/services/photo.service.ts
export class PhotoService {
  async captureOrSelectPhoto(): Promise<string | null> {
    // Implementation for camera/gallery selection
  }
  
  async uploadFoodPhoto(uri: string, userId: string): Promise<string> {
    // Upload to Firebase Storage and return download URL
  }
  
  async deleteFoodPhoto(photoURL: string): Promise<void> {
    // Delete from Firebase Storage
  }
  
  // Future: AI nutrition analysis
  async analyzeFoodPhoto(photoURL: string): Promise<NutritionEstimate> {
    // Integration with food recognition API
  }
}
```

---

## 4. State Management Architecture

### 4.1 Zustand Store Structure

```typescript
// src/stores/auth.store.ts
interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

// src/stores/nutrition.store.ts
interface NutritionState {
  currentDate: string;
  dailyData: DailyHealthData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentDate: (date: string) => void;
  loadDailyData: (userId: string, date: string) => Promise<void>;
  addFoodEntry: (mealType: string, foodEntry: Omit<FoodEntry, 'id'>) => Promise<void>;
  updateFoodEntry: (mealType: string, entryId: string, updates: Partial<FoodEntry>) => Promise<void>;
  deleteFoodEntry: (mealType: string, entryId: string) => Promise<void>;
  
  // Computed values
  getTotalNutrition: () => NutritionSummary;
  getMealNutrition: (mealType: string) => NutritionSummary;
  getNutritionProgress: () => NutritionProgress;
}

// src/stores/health.store.ts
interface HealthState {
  currentDate: string;
  metrics: HealthMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateWeight: (weight: number, unit: 'kg' | 'lbs') => Promise<void>;
  addWaterIntake: (amount: number, unit: string) => Promise<void>;
  updateSteps: (steps: number) => Promise<void>;
  addWorkout: (workout: Omit<WorkoutEntry, 'id'>) => Promise<void>;
}

// src/stores/sync.store.ts
interface SyncState {
  isOnline: boolean;
  pendingOperations: PendingOperation[];
  lastSyncTime: Date | null;
  isSyncing: boolean;
  
  // Actions
  addPendingOperation: (operation: PendingOperation) => void;
  processPendingOperations: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
}
```

### 4.2 Store Persistence Strategy

```typescript
// src/stores/persistence.ts
export const createPersistentStore = <T extends object>(
  store: StateCreator<T>,
  name: string,
  partialPersist?: (state: T) => Partial<T>
) => {
  return persist(
    store,
    {
      name: `health-dashboard-${name}`,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: partialPersist,
      onRehydrateStorage: () => (state) => {
        console.log(`Store ${name} rehydrated`);
      },
    }
  );
};
```

---

## 5. Component Architecture

### 5.1 Screen-Level Components

```typescript
// src/screens/FoodTrackingScreen.tsx
export const FoodTrackingScreen: React.FC<Props> = () => {
  return (
    <SafeAreaContainer>
      <FoodTrackingHeader />
      <MealCategorySelector />
      <FoodEntryForm />
      <MealSummaryView />
    </SafeAreaContainer>
  );
};

// src/screens/NutritionDashboardScreen.tsx
export const NutritionDashboardScreen: React.FC<Props> = () => {
  return (
    <SafeAreaContainer>
      <DateNavigationHeader />
      <DailyNutritionOverview />
      <MacroBreakdownChart />
      <MealSummaryCards />
    </SafeAreaContainer>
  );
};
```

### 5.2 Feature-Specific Components

```typescript
// src/components/nutrition/MealCategoryCard.tsx
interface MealCategoryCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'eveningSnack';
  currentCalories: number;
  allocatedCalories: number;
  foodItems: FoodEntry[];
  onPress: () => void;
}

// src/components/nutrition/FoodEntryForm.tsx
interface FoodEntryFormProps {
  mealType: string;
  onSubmit: (foodEntry: FoodEntryFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<FoodEntryFormData>;
}

// src/components/nutrition/MacroProgressBar.tsx
interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  showPercentage?: boolean;
}

// src/components/health/HealthMetricCard.tsx
interface HealthMetricCardProps {
  type: 'weight' | 'water' | 'steps' | 'workout';
  title: string;
  current: number | string;
  target?: number | string;
  unit: string;
  progress?: number;
  onAdd: () => void;
  onView: () => void;
}
```

### 5.3 Form Management Strategy

```typescript
// src/hooks/useFormValidation.ts
export const useFormValidation = <T extends Record<string, any>>(
  schema: ValidationSchema<T>
) => {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const validate = (data: T): boolean => {
    const validationResult = schema.validate(data);
    if (validationResult.errors) {
      setErrors(validationResult.errors);
      return false;
    }
    setErrors({});
    return true;
  };
  
  return { errors, validate, clearErrors: () => setErrors({}) };
};

// src/components/forms/FoodEntryForm.tsx
export const FoodEntryForm: React.FC<FoodEntryFormProps> = ({ onSubmit, onCancel }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<FoodEntryFormData>({
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'grams',
    }
  });
  
  const { mutate: submitFood, isPending } = useMutation({
    mutationFn: async (data: FoodEntryFormData) => {
      const nutrition = NutritionService.getInstance().generateRandomNutrition(
        data.name, 
        data.quantity, 
        data.unit
      );
      return onSubmit({ ...data, nutrition });
    }
  });
  
  return (
    <ScrollView style={styles.container}>
      <FormField
        name="name"
        control={control}
        rules={{ required: 'Food name is required' }}
        render={({ field }) => (
          <Input
            placeholder="Enter food name"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.name?.message}
          />
        )}
      />
      {/* Additional form fields */}
    </ScrollView>
  );
};
```

---

## 6. Performance Optimization

### 6.1 Data Loading Strategy

```typescript
// src/hooks/useHealthData.ts
export const useHealthData = (userId: string, date: string) => {
  return useQuery({
    queryKey: ['healthData', userId, date],
    queryFn: () => FirebaseService.getInstance().getDailyHealthData(userId, date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Pagination for historical data
export const useHealthDataHistory = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['healthDataHistory', userId],
    queryFn: ({ pageParam = new Date() }) => 
      FirebaseService.getInstance().getHealthDataRange(userId, pageParam, 30),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 10 * 60 * 1000,
  });
};
```

### 6.2 Image Optimization

```typescript
// src/services/imageOptimization.service.ts
export class ImageOptimizationService {
  async optimizeImage(uri: string): Promise<string> {
    // Resize and compress image before upload
    const optimized = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 800 } }, // Max width 800px
      ],
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return optimized.uri;
  }

  async createThumbnail(uri: string): Promise<string> {
    const thumbnail = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 200 } }, // Small thumbnail
      ],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return thumbnail.uri;
  }
}
```

### 6.3 Memory Management

```typescript
// src/utils/memoryOptimization.ts
export const optimizeComponentMemory = () => {
  // Implement component cleanup strategies
  const memoizedComponents = useMemo(() => ({
    MealCard: React.memo(MealCard),
    NutritionChart: React.memo(NutritionChart),
    HealthMetric: React.memo(HealthMetric),
  }), []);

  // Debounce expensive operations
  const debouncedNutritionCalculation = useCallback(
    debounce((data: FoodEntry[]) => {
      return calculateTotalNutrition(data);
    }, 300),
    []
  );

  return { memoizedComponents, debouncedNutritionCalculation };
};
```

---

## 7. Offline/Online Synchronization

### 7.1 Offline Storage Strategy

```typescript
// src/services/offline.service.ts
export class OfflineService {
  private static instance: OfflineService;
  
  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async storeOfflineData(key: string, data: any): Promise<void> {
    const serialized = JSON.stringify({
      data,
      timestamp: Date.now(),
      synced: false,
    });
    await AsyncStorage.setItem(`offline_${key}`, serialized);
  }

  async getOfflineData(key: string): Promise<any | null> {
    const stored = await AsyncStorage.getItem(`offline_${key}`);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed.data;
  }

  async getUnsyncedOperations(): Promise<PendingOperation[]> {
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(key => key.startsWith('offline_'));
    
    const operations: PendingOperation[] = [];
    for (const key of offlineKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.synced) {
          operations.push({
            key,
            data: parsed.data,
            timestamp: parsed.timestamp,
          });
        }
      }
    }
    
    return operations.sort((a, b) => a.timestamp - b.timestamp);
  }

  async markAsSynced(key: string): Promise<void> {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.synced = true;
      await AsyncStorage.setItem(key, JSON.stringify(parsed));
    }
  }
}
```

### 7.2 Sync Manager

```typescript
// src/services/syncManager.service.ts
export class SyncManager {
  private syncQueue: PendingOperation[] = [];
  private isSyncing = false;
  private retryAttempts = 3;

  async addToSyncQueue(operation: PendingOperation): Promise<void> {
    this.syncQueue.push(operation);
    await this.processSyncQueue();
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;
    
    this.isSyncing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift()!;
        await this.executeOperation(operation);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // Re-add failed operations to queue for retry
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        await this.performSync(operation);
        await OfflineService.getInstance().markAsSynced(operation.key);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= this.retryAttempts) {
          throw error;
        }
        await this.delay(1000 * attempts); // Exponential backoff
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 8. Security & Privacy Architecture

### 8.1 Data Encryption

```typescript
// src/utils/encryption.ts
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

  static encryptSensitiveData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
  }

  static decryptSensitiveData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }
}

// Sensitive fields encryption
export const encryptHealthData = (data: DailyHealthData): DailyHealthData => {
  // Only encrypt sensitive fields if required by compliance
  return {
    ...data,
    // Example: encrypt weight data if highly sensitive
    healthMetrics: {
      ...data.healthMetrics,
      weight: data.healthMetrics.weight ? {
        ...data.healthMetrics.weight,
        value: parseFloat(EncryptionService.encryptSensitiveData(data.healthMetrics.weight.value.toString()))
      } : undefined
    }
  };
};
```

### 8.2 Privacy Controls

```typescript
// src/services/privacy.service.ts
export class PrivacyService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const profile = await FirebaseService.getInstance().getUserProfile(userId);
    const healthData = await this.getAllHealthData(userId);
    
    return {
      profile,
      healthData,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  async deleteAllUserData(userId: string): Promise<void> {
    // Delete from Firestore
    await this.deleteUserFirestoreData(userId);
    
    // Delete from Storage
    await this.deleteUserStorageData(userId);
    
    // Delete local cache
    await this.clearLocalUserData(userId);
  }

  async anonymizeUserData(userId: string): Promise<void> {
    // Replace identifiable information with anonymized data
    const anonymizedProfile = await this.createAnonymizedProfile(userId);
    await FirebaseService.getInstance().updateUserProfile(userId, anonymizedProfile);
  }
}
```

### 8.3 Authentication Flow

```typescript
// src/services/auth.service.ts
export class AuthService {
  async signInWithEmailPassword(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.initializeUserSession(userCredential.user);
      return userCredential;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async createUserWithEmailPassword(
    email: string, 
    password: string, 
    profile: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserProfile(userCredential.user.uid, profile);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  private async initializeUserSession(user: User): Promise<void> {
    // Load user profile and initialize stores
    const userProfile = await FirebaseService.getInstance().getUserProfile(user.uid);
    useAuthStore.getState().setUser(user, userProfile);
    
    // Initialize other stores with user data
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    await useNutritionStore.getState().loadDailyData(user.uid, currentDate);
  }
}
```

---

## 9. Testing Architecture

### 9.1 Testing Strategy

```typescript
// src/testing/setup.ts
import { configure } from '@testing-library/react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

// Mock React Native components
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

configure({
  testIdAttribute: 'testID',
});
```

### 9.2 Unit Test Examples

```typescript
// src/services/__tests__/nutrition.service.test.ts
describe('NutritionService', () => {
  let nutritionService: NutritionService;

  beforeEach(() => {
    nutritionService = NutritionService.getInstance();
  });

  describe('generateRandomNutrition', () => {
    it('should generate realistic nutrition values for common foods', () => {
      const result = nutritionService.generateRandomNutrition('chicken breast', 100, 'grams');
      
      expect(result.calories).toBeGreaterThan(150);
      expect(result.calories).toBeLessThan(300);
      expect(result.protein).toBeGreaterThan(20);
      expect(result.protein + result.carbs + result.fats).toBeCloseTo(result.calories / 4, 1);
    });

    it('should adjust calories based on quantity', () => {
      const result100g = nutritionService.generateRandomNutrition('rice', 100, 'grams');
      const result200g = nutritionService.generateRandomNutrition('rice', 200, 'grams');
      
      expect(result200g.calories).toBeCloseTo(result100g.calories * 2, 50);
    });
  });
});

// src/stores/__tests__/nutrition.store.test.ts
describe('NutritionStore', () => {
  beforeEach(() => {
    // Reset store state
    useNutritionStore.setState({
      currentDate: format(new Date(), 'yyyy-MM-dd'),
      dailyData: null,
      isLoading: false,
      error: null,
    });
  });

  it('should add food entry to correct meal', async () => {
    const mockFoodEntry = {
      name: 'Test Food',
      quantity: 100,
      unit: 'grams',
      nutrition: { calories: 200, protein: 20, carbs: 30, fats: 5, fiber: 2 }
    };

    await useNutritionStore.getState().addFoodEntry('breakfast', mockFoodEntry);
    
    const state = useNutritionStore.getState();
    expect(state.dailyData?.meals.breakfast).toHaveLength(1);
    expect(state.dailyData?.meals.breakfast[0].name).toBe('Test Food');
  });
});
```

### 9.3 Integration Test Examples

```typescript
// src/screens/__tests__/FoodTrackingScreen.integration.test.tsx
describe('FoodTrackingScreen Integration', () => {
  it('should complete full food entry flow', async () => {
    const mockUser = { uid: 'test-user' };
    const { getByTestId, getByText } = render(
      <TestWrapper user={mockUser}>
        <FoodTrackingScreen />
      </TestWrapper>
    );

    // Select breakfast meal
    fireEvent.press(getByText('Breakfast'));
    
    // Fill food entry form
    fireEvent.changeText(getByTestId('food-name-input'), 'Oatmeal');
    fireEvent.changeText(getByTestId('quantity-input'), '50');
    fireEvent.press(getByText('Save'));
    
    // Verify food was added
    await waitFor(() => {
      expect(getByText('Oatmeal')).toBeTruthy();
    });
  });
});
```

---

## 10. Deployment & DevOps

### 10.1 Environment Configuration

```typescript
// app.config.ts
export default {
  expo: {
    name: 'Health Dashboard',
    slug: 'health-dashboard',
    version: '1.0.0',
    platforms: ['ios', 'android'],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      environment: process.env.NODE_ENV || 'development',
    },
    plugins: [
      '@react-native-async-storage/async-storage',
      'expo-image-picker',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
    ],
  },
};
```

### 10.2 Build Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "NODE_ENV": "staging"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 11. Migration & Upgrade Strategy

### 11.1 Data Migration

```typescript
// src/services/migration.service.ts
export class MigrationService {
  private static readonly CURRENT_VERSION = '1.0.0';

  async checkAndRunMigrations(): Promise<void> {
    const currentVersion = await AsyncStorage.getItem('app_version');
    
    if (!currentVersion) {
      // First install
      await this.runInitialSetup();
    } else if (currentVersion !== MigrationService.CURRENT_VERSION) {
      await this.runMigrations(currentVersion, MigrationService.CURRENT_VERSION);
    }
    
    await AsyncStorage.setItem('app_version', MigrationService.CURRENT_VERSION);
  }

  private async runMigrations(from: string, to: string): Promise<void> {
    const migrations = this.getMigrationsToRun(from, to);
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.version}`);
      await migration.execute();
    }
  }
}
```

---

## 12. Monitoring & Analytics

### 12.1 Performance Monitoring

```typescript
// src/services/analytics.service.ts
export class AnalyticsService {
  async trackUserAction(action: string, properties?: Record<string, any>): Promise<void> {
    // Firebase Analytics implementation
    await analytics().logEvent(action, {
      ...properties,
      timestamp: Date.now(),
      app_version: Constants.expoConfig?.version,
    });
  }

  async trackPerformance(metric: string, value: number): Promise<void> {
    await analytics().logEvent('performance_metric', {
      metric,
      value,
      timestamp: Date.now(),
    });
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await crashlytics().recordError(error);
    
    await analytics().logEvent('app_error', {
      error_message: error.message,
      error_context: context || 'unknown',
      timestamp: Date.now(),
    });
  }
}
```

---

## 13. Future Architecture Considerations

### 13.1 API Integration Preparation

The architecture is designed to easily integrate with nutrition APIs in Phase 4:

```typescript
// Future API integration structure
interface NutritionAPIAdapter {
  searchFood(query: string): Promise<FoodSearchResult[]>;
  getNutritionInfo(foodId: string): Promise<DetailedNutritionInfo>;
  analyzeFoodPhoto(imageUrl: string): Promise<FoodRecognitionResult>;
}

// Planned API integrations
class USDAFoodDataAdapter implements NutritionAPIAdapter { /* ... */ }
class EdamamAdapter implements NutritionAPIAdapter { /* ... */ }
class SpoonacularAdapter implements NutritionAPIAdapter { /* ... */ }
```

### 13.2 Scalability Considerations

- **Database Sharding**: Prepare for user base growth with Firestore subcollections
- **CDN Integration**: Firebase Storage with CDN for global food photo access
- **Caching Strategy**: Multi-level caching (memory, local storage, CDN)
- **Background Processing**: Firebase Functions for nutrition calculations

---

## 14. Implementation Priority & Timeline

### Phase 3.1 - Firebase Foundation (Week 1-2)
1. **Firebase Setup & Configuration**
   - Project creation and security rules
   - Authentication integration
   - Basic Firestore operations

2. **Data Models & Services**
   - TypeScript interfaces and types
   - Firebase service layer
   - Basic CRUD operations

### Phase 3.2 - Food Tracking Core (Week 3-4)
1. **Food Entry System**
   - Meal category selection UI
   - Food entry form with validation
   - Random nutrition generation

2. **Nutrition Calculations**
   - Macro calculation logic
   - Daily nutrition aggregation
   - Progress tracking

### Phase 3.3 - Health Metrics Integration (Week 5-6)
1. **Additional Health Tracking**
   - Weight, water, steps, workout tracking
   - Data persistence and retrieval
   - Dashboard integration

2. **Date Navigation & History**
   - Calendar picker implementation
   - Historical data loading
   - Date-based data filtering

### Phase 3.4 - Performance & Polish (Week 7-8)
1. **Offline/Online Sync**
   - Offline storage implementation
   - Sync queue and conflict resolution
   - Network state management

2. **Testing & Security**
   - Comprehensive test coverage
   - Security audit and hardening
   - Performance optimization

---

## Conclusion

This Phase 3 architecture provides a robust, scalable foundation for the Mobile Health Dashboard's transition from a static UI to a fully functional health tracking application. The Firebase integration ensures reliable data persistence and synchronization, while the modular service layer design facilitates future API integrations and feature expansions.

Key architectural strengths:
- **Scalable Data Model**: Flexible Firestore schema supporting complex health data
- **Offline-First Design**: Robust offline capabilities with intelligent sync
- **Security-Focused**: Comprehensive privacy and security measures
- **Performance-Optimized**: Efficient data loading and caching strategies
- **Future-Ready**: Prepared for API integrations and advanced features

The architecture supports all Phase 3 requirements while establishing patterns and infrastructure for future enhancements, ensuring the application can evolve from a basic food tracker to a comprehensive health monitoring platform.

---

**Document Status**: ✅ Complete  
**Next Review**: September 7, 2025  
**Implementation Ready**: Yes