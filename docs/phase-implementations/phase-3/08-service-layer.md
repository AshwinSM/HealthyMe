# Phase 3: Service Layer Architecture
## Firebase Services & Business Logic

---

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Firebase       │  Nutrition      │  Photo Service          │
│  Service        │  Service        │                         │
│  - Auth         │  - Calculations │  - Upload/Download      │
│  - Firestore    │  - Validation   │  - Compression          │
│  - Storage      │  - Aggregation  │  - Caching             │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Sync Service   │  Cache Service  │  Validation Service     │
│  - Queue Mgmt   │  - Local Cache  │  - Input Validation     │
│  - Retry Logic  │  - Invalidation │  - Data Sanitization    │
│  - Conflict Res │  - Persistence  │  - Business Rules       │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Firebase Service

### Implementation Structure
```typescript
// src/services/FirebaseService.ts
class FirebaseService {
  private static instance: FirebaseService;
  private db: FirebaseFirestore.Firestore;
  private auth: FirebaseAuth.Auth;
  private storage: FirebaseStorage.FirebaseStorage;

  // Authentication methods
  async signUp(email: string, password: string): Promise<UserCredential>
  async signIn(email: string, password: string): Promise<UserCredential>
  async signOut(): Promise<void>
  async resetPassword(email: string): Promise<void>

  // Firestore CRUD operations
  async createDocument(collection: string, data: any): Promise<string>
  async getDocument(collection: string, docId: string): Promise<any>
  async updateDocument(collection: string, docId: string, data: any): Promise<void>
  async deleteDocument(collection: string, docId: string): Promise<void>
  async queryDocuments(collection: string, filters: QueryFilter[]): Promise<any[]>

  // Real-time subscriptions
  subscribeToDocument(collection: string, docId: string, callback: Function): Function
  subscribeToCollection(collection: string, filters: QueryFilter[], callback: Function): Function
}
```

### Authentication Service
```typescript
// src/services/AuthService.ts
class AuthService {
  private firebaseService: FirebaseService;

  async login(email: string, password: string): Promise<User>
  async register(email: string, password: string, profile: UserProfile): Promise<User>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<User | null>
  async updateProfile(updates: Partial<UserProfile>): Promise<void>
  
  // Session management
  async refreshToken(): Promise<string>
  async validateSession(): Promise<boolean>
  onAuthStateChanged(callback: (user: User | null) => void): Function
}
```

## Nutrition Service

### Calculation Engine
```typescript
// src/services/NutritionService.ts
class NutritionService {
  // Phase 3: Random nutrition generation
  generateRandomNutrition(foodName: string, quantity: number, unit: MeasurementUnit): NutritionInfo {
    const baseCalories = this.getRandomInRange(150, 800);
    
    return {
      calories: baseCalories,
      protein: (baseCalories * this.getRandomInRange(0.10, 0.30)) / 4,
      carbs: (baseCalories * this.getRandomInRange(0.40, 0.65)) / 4,
      fats: (baseCalories * this.getRandomInRange(0.20, 0.35)) / 9,
      fiber: this.getRandomInRange(5, 15)
    };
  }

  // Meal aggregation
  calculateMealTotals(foods: FoodItem[]): NutritionInfo
  calculateDailyTotals(meals: Meal[]): NutritionInfo
  
  // Goal tracking
  calculateProgress(actual: NutritionInfo, goals: NutritionInfo): ProgressInfo
  generateRecommendations(current: NutritionInfo, goals: NutritionInfo): string[]

  // Unit conversions
  convertUnits(amount: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number
}
```

### Phase 4 API Integration (Future)
```typescript
// Future nutrition API integration
interface NutritionAPIAdapter {
  searchFood(query: string): Promise<FoodSearchResult[]>
  getFoodNutrition(foodId: string): Promise<NutritionInfo>
  analyzeFoodFromImage(imageUrl: string): Promise<FoodRecognitionResult>
}

class USDANutritionAdapter implements NutritionAPIAdapter {
  // USDA FoodData Central integration
}

class EdamamNutritionAdapter implements NutritionAPIAdapter {
  // Edamam Nutrition API integration
}
```

## Photo Service

### Image Handling
```typescript
// src/services/PhotoService.ts
class PhotoService {
  private storage: FirebaseStorage.FirebaseStorage;

  async capturePhoto(options: PhotoOptions): Promise<PhotoResult>
  async uploadPhoto(photoUri: string, userId: string, foodId: string): Promise<string>
  async downloadPhoto(photoUrl: string): Promise<string>
  async deletePhoto(photoUrl: string): Promise<void>

  // Image optimization
  private async compressImage(imageUri: string): Promise<string>
  private async generateThumbnail(imageUri: string): Promise<string>
  private async validateImage(imageUri: string): Promise<boolean>
}

interface PhotoOptions {
  quality: number;          // 0-1
  maxWidth: number;
  maxHeight: number;
  allowsEditing: boolean;
  storageOptions: {
    skipBackup: boolean;
    path: string;
  };
}
```

## Sync Service

### Offline/Online Synchronization
```typescript
// src/services/SyncService.ts
class SyncService {
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = true;

  // Queue management
  async queueOperation(operation: SyncOperation): Promise<void>
  async processQueue(): Promise<void>
  async retryFailedOperations(): Promise<void>

  // Network state management
  onNetworkStateChange(callback: (isOnline: boolean) => void): Function
  private async handleConnectionRestored(): Promise<void>
  private async handleConnectionLost(): Promise<void>

  // Conflict resolution
  private async resolveConflicts(localData: any, serverData: any): Promise<any>
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}
```

## Cache Service

### Multi-Level Caching
```typescript
// src/services/CacheService.ts
class CacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private asyncStorage: AsyncStorage;

  // Memory cache (L1)
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async invalidate(key: string): Promise<void>
  async clear(): Promise<void>

  // Persistent cache (L2)
  async getPersistent<T>(key: string): Promise<T | null>
  async setPersistent<T>(key: string, value: T): Promise<void>
  async invalidatePersistent(key: string): Promise<void>

  // Cache strategies
  async getWithFallback<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T>
}

interface CacheEntry {
  data: any;
  timestamp: Date;
  ttl: number;
  hits: number;
}
```

## Validation Service

### Input Validation & Business Rules
```typescript
// src/services/ValidationService.ts
class ValidationService {
  // Data validation
  validateFoodEntry(food: Partial<FoodItem>): ValidationResult
  validateNutritionData(nutrition: Partial<NutritionInfo>): ValidationResult
  validateHealthMetrics(metrics: Partial<HealthMetrics>): ValidationResult

  // Business rules
  validateDailyCalorieLimits(totalCalories: number, userGoal: number): ValidationResult
  validateMealTiming(mealType: MealType, timestamp: Date): ValidationResult
  validateWeightEntry(weight: WeightEntry, previousWeight?: WeightEntry): ValidationResult

  // Input sanitization
  sanitizeTextInput(input: string): string
  sanitizeNumericInput(input: number, bounds: NumberBounds): number
  sanitizeDateInput(input: Date): Date
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

## Error Handling & Logging

### Service-Level Error Management
```typescript
// src/services/ErrorService.ts
class ErrorService {
  private logger: Logger;

  // Error classification
  classifyError(error: Error): ErrorType
  shouldRetry(error: Error): boolean
  getRetryDelay(attemptCount: number): number

  // Error reporting
  reportError(error: Error, context: ErrorContext): Promise<void>
  reportWarning(warning: Warning, context: WarningContext): Promise<void>

  // Recovery strategies
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T>
}

enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication', 
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}
```

## Performance Optimization

### Service Performance Patterns
- **Connection Pooling**: Reuse Firebase connections
- **Request Batching**: Group multiple operations
- **Lazy Loading**: Load services on demand
- **Memory Management**: Cleanup unused service instances
- **Background Processing**: Non-blocking operations for heavy tasks