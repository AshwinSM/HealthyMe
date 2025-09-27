# Phase 3: Testing Strategy
## Comprehensive Testing for Food Tracking System

---

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                         │
├─────────────────────────────────────────────────────────────┤
│  E2E Tests (10%)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Complete User Workflows                             │   │
│  │ - Food tracking flow                                │   │
│  │ - Health metrics flow                               │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Integration Tests (20%)                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Service Integration                                 │   │
│  │ - Firebase operations                               │   │
│  │ - Store interactions                                │   │
│  │ - Component integration                             │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests (70%)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Individual Components                               │   │
│  │ - Business logic                                    │   │
│  │ - Utility functions                                 │   │
│  │ - Component behavior                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Unit Testing Strategy

### Testing Framework Setup
```typescript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

// jest.setup.js
import '@testing-library/jest-native/extend-expect';
import { cleanup } from '@testing-library/react-native';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn()
}));

// Cleanup after each test
afterEach(cleanup);
```

### Nutrition Service Tests
```typescript
// src/services/__tests__/NutritionService.test.ts
describe('NutritionService', () => {
  describe('generateRandomNutrition', () => {
    it('should generate nutrition within expected ranges', () => {
      const nutrition = NutritionService.generateRandomNutrition('apple', 1, 'piece');
      
      expect(nutrition.calories).toBeGreaterThanOrEqual(150);
      expect(nutrition.calories).toBeLessThanOrEqual(800);
      expect(nutrition.protein).toBeGreaterThanOrEqual(0);
      expect(nutrition.carbs).toBeGreaterThanOrEqual(0);
      expect(nutrition.fats).toBeGreaterThanOrEqual(0);
      expect(nutrition.fiber).toBeGreaterThanOrEqual(5);
      expect(nutrition.fiber).toBeLessThanOrEqual(15);
    });

    it('should maintain consistent macro distribution', () => {
      const nutrition = NutritionService.generateRandomNutrition('chicken', 100, 'grams');
      
      const proteinCals = nutrition.protein * 4;
      const carbCals = nutrition.carbs * 4;
      const fatCals = nutrition.fats * 9;
      const totalMacroCals = proteinCals + carbCals + fatCals;
      
      // Allow 10% variance for randomization
      expect(Math.abs(totalMacroCals - nutrition.calories)).toBeLessThanOrEqual(nutrition.calories * 0.1);
    });
  });

  describe('calculateMealTotals', () => {
    it('should correctly sum nutrition from multiple foods', () => {
      const foods: FoodItem[] = [
        {
          id: '1',
          name: 'Apple',
          quantity: 1,
          unit: 'piece',
          nutrition: { calories: 100, protein: 0.5, carbs: 25, fats: 0.2, fiber: 4 },
          timestamp: new Date()
        },
        {
          id: '2', 
          name: 'Banana',
          quantity: 1,
          unit: 'piece',
          nutrition: { calories: 120, protein: 1.2, carbs: 30, fats: 0.3, fiber: 3 },
          timestamp: new Date()
        }
      ];

      const totals = NutritionService.calculateMealTotals(foods);

      expect(totals.calories).toBe(220);
      expect(totals.protein).toBe(1.7);
      expect(totals.carbs).toBe(55);
      expect(totals.fats).toBe(0.5);
      expect(totals.fiber).toBe(7);
    });
  });
});
```

### Store Tests
```typescript
// src/stores/__tests__/nutritionStore.test.ts
import { act, renderHook } from '@testing-library/react-hooks';
import { useNutritionStore } from '../nutritionStore';

describe('NutritionStore', () => {
  beforeEach(() => {
    useNutritionStore.getState().clearCache();
  });

  describe('addFoodItem', () => {
    it('should add food item to specified meal', async () => {
      const { result } = renderHook(() => useNutritionStore());
      
      const foodItem: FoodItem = {
        id: 'test-food',
        name: 'Test Food',
        quantity: 1,
        unit: 'serving',
        nutrition: { calories: 200, protein: 10, carbs: 30, fats: 5, fiber: 3 },
        timestamp: new Date()
      };

      await act(async () => {
        await result.current.addFoodItem('breakfast', foodItem);
      });

      expect(result.current.meals.breakfast.foods).toContainEqual(foodItem);
      expect(result.current.meals.breakfast.totalNutrition.calories).toBe(200);
    });

    it('should update daily totals after adding food', async () => {
      const { result } = renderHook(() => useNutritionStore());
      
      const foodItem: FoodItem = {
        id: 'test-food',
        name: 'Test Food',
        quantity: 1,
        unit: 'serving',
        nutrition: { calories: 300, protein: 15, carbs: 40, fats: 8, fiber: 5 },
        timestamp: new Date()
      };

      await act(async () => {
        await result.current.addFoodItem('lunch', foodItem);
      });

      expect(result.current.totalNutrition.calories).toBe(300);
      expect(result.current.totalNutrition.protein).toBe(15);
    });
  });
});
```

## Integration Testing

### Firebase Integration Tests
```typescript
// src/services/__tests__/FirebaseService.integration.test.ts
describe('FirebaseService Integration', () => {
  let firebaseService: FirebaseService;
  let testUserId: string;

  beforeAll(async () => {
    firebaseService = FirebaseService.getInstance();
    // Use Firebase emulator for testing
    await firebaseService.connectToEmulator();
  });

  beforeEach(async () => {
    // Create test user
    testUserId = await firebaseService.createTestUser();
  });

  afterEach(async () => {
    // Cleanup test data
    await firebaseService.deleteTestUser(testUserId);
  });

  describe('Daily Nutrition CRUD', () => {
    it('should create and retrieve daily nutrition data', async () => {
      const testData: DailyNutrition = {
        date: '2025-08-31',
        meals: {
          breakfast: {
            id: 'breakfast',
            type: 'breakfast',
            foods: [],
            totalNutrition: EMPTY_NUTRITION,
            lastUpdated: new Date()
          }
          // ... other meals
        },
        totalNutrition: EMPTY_NUTRITION,
        healthMetrics: {},
        summary: {},
        lastUpdated: new Date()
      };

      // Create
      await firebaseService.createDailyNutrition(testUserId, testData);

      // Retrieve
      const retrieved = await firebaseService.getDailyNutrition(testUserId, '2025-08-31');

      expect(retrieved.date).toBe('2025-08-31');
      expect(retrieved.meals.breakfast.type).toBe('breakfast');
    });

    it('should handle real-time updates', async () => {
      const updates: DailyNutrition[] = [];
      
      // Subscribe to changes
      const unsubscribe = firebaseService.subscribeToDailyNutrition(
        testUserId,
        '2025-08-31',
        (data) => updates.push(data)
      );

      // Make changes
      const testData = createTestDailyNutrition();
      await firebaseService.createDailyNutrition(testUserId, testData);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[updates.length - 1].date).toBe('2025-08-31');

      unsubscribe();
    });
  });
});
```

### Component Integration Tests
```typescript
// src/screens/__tests__/FoodTrackingScreen.integration.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FoodTrackingScreen } from '../FoodTrackingScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn()
};

describe('FoodTrackingScreen Integration', () => {
  it('should complete food entry workflow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <FoodTrackingScreen navigation={mockNavigation} />
    );

    // Select breakfast
    fireEvent.press(getByText('Breakfast'));

    // Enter food details
    fireEvent.changeText(getByPlaceholderText('Food name'), 'Apple');
    fireEvent.changeText(getByPlaceholderText('Quantity'), '1');
    
    // Select unit
    fireEvent.press(getByText('piece'));

    // Add food
    fireEvent.press(getByText('Add Food'));

    // Wait for nutrition calculation and display
    await waitFor(() => {
      expect(getByText(/Apple/)).toBeOnTheScreen();
      expect(getByText(/calories/)).toBeOnTheScreen();
    });
  });
});
```

## End-to-End Testing

### Complete User Workflows
```typescript
// e2e/foodTracking.e2e.ts
describe('Food Tracking E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full food tracking workflow', async () => {
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('testpassword');
    await element(by.id('login-button')).tap();

    // Navigate to food tracking
    await element(by.id('track-food-button')).tap();

    // Select meal type
    await element(by.id('breakfast-meal')).tap();

    // Enter food item
    await element(by.id('food-name-input')).typeText('Oatmeal');
    await element(by.id('quantity-input')).typeText('1');
    await element(by.id('unit-picker')).tap();
    await element(by.text('cup')).tap();

    // Add food
    await element(by.id('add-food-button')).tap();

    // Verify food appears in meal
    await expect(element(by.text('Oatmeal'))).toBeVisible();
    await expect(element(by.id('meal-calories'))).toBeVisible();

    // Navigate back to dashboard
    await element(by.id('back-button')).tap();

    // Verify dashboard updates
    await expect(element(by.id('total-calories'))).toBeVisible();
    await expect(element(by.id('nutrition-progress'))).toBeVisible();
  });

  it('should handle date navigation', async () => {
    // Open calendar
    await element(by.id('date-picker-button')).tap();

    // Select different date
    await element(by.text('30')).tap();
    await element(by.text('Done')).tap();

    // Verify date change
    await expect(element(by.text('30 Aug'))).toBeVisible();
    
    // Verify data loads for selected date
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);
  });
});
```

## Performance Testing

### Load Testing
```typescript
// src/__tests__/performance.test.ts
describe('Performance Tests', () => {
  it('should handle large amounts of historical data', async () => {
    const startTime = Date.now();
    
    // Generate 90 days of test data
    const historicalData = generateHistoricalData(90);
    
    // Load data
    await NutritionService.loadHistoricalData(historicalData);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
  });

  it('should maintain smooth scrolling with large food lists', async () => {
    const foods = generateLargeFoodList(500);
    const { getByTestId } = render(<FoodList foods={foods} />);
    
    const scrollView = getByTestId('food-scroll-view');
    
    // Measure scroll performance
    const scrollStart = Date.now();
    fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 1000 } } });
    const scrollTime = Date.now() - scrollStart;
    
    expect(scrollTime).toBeLessThan(16); // 60fps = 16ms per frame
  });
});
```

## Test Data Management

### Mock Data Factory
```typescript
// src/__tests__/helpers/mockData.ts
export const createMockFoodItem = (overrides?: Partial<FoodItem>): FoodItem => ({
  id: 'mock-food-1',
  name: 'Mock Food',
  quantity: 1,
  unit: 'serving',
  nutrition: {
    calories: 200,
    protein: 10,
    carbs: 30,
    fats: 5,
    fiber: 3
  },
  timestamp: new Date(),
  ...overrides
});

export const createMockDailyNutrition = (date: string): DailyNutrition => ({
  date,
  meals: {
    breakfast: createMockMeal('breakfast'),
    lunch: createMockMeal('lunch'),
    dinner: createMockMeal('dinner'),
    morningSnack: createMockMeal('morningSnack'),
    eveningSnack: createMockMeal('eveningSnack')
  },
  totalNutrition: EMPTY_NUTRITION,
  healthMetrics: {},
  summary: {},
  lastUpdated: new Date()
});
```

## CI/CD Testing Pipeline

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v1
        
      - name: Run E2E tests
        run: npm run test:e2e
```

## Coverage Goals

### Target Metrics
- **Unit Test Coverage**: >80% for all service layer code
- **Integration Test Coverage**: >70% for critical user workflows
- **E2E Test Coverage**: 100% of primary user journeys
- **Performance Tests**: All critical performance scenarios covered