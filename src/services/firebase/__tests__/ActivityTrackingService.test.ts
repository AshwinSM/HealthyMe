import { ActivityTrackingService } from '../services/ActivityTrackingService';
import { Timestamp } from 'firebase/firestore';
import { StepsEntry, WorkoutEntry, WorkoutType, WorkoutIntensity } from '../../../types/health';

// Mock all Firebase modules to avoid ES module issues
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: () => ({ seconds: 1640995200, nanoseconds: 0 }),
    fromMillis: (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0 })
  }
}));

jest.mock('firebase/app', () => ({}));
jest.mock('@firebase/app', () => ({}));
jest.mock('@firebase/firestore', () => ({}));

// Mock Firebase config with the actual import path used in the service
jest.mock('../config', () => ({
  firestore: {}
}));

// Mock DateNavigationUtils
jest.mock('../../../utils/dateNavigationUtils', () => ({
  DateNavigationUtils: {
    isValidDateString: jest.fn((date: string) => date.match(/^\d{4}-\d{2}-\d{2}$/)),
    isFutureDate: jest.fn((date: string) => {
      const today = new Date().toISOString().split('T')[0];
      return date > today;
    }),
    formatDateString: jest.fn((date: Date) => date.toISOString().split('T')[0]),
    getTodayString: jest.fn(() => '2024-01-01')
  }
}));

describe('ActivityTrackingService', () => {
  let service: ActivityTrackingService;
  const mockUserId = 'test-user-id';
  const mockDate = '2024-01-01';

  beforeEach(() => {
    service = new ActivityTrackingService();
    jest.clearAllMocks();
  });

  describe('Workout Type Management', () => {
    test('should get all workout types', () => {
      const types = service.getWorkoutTypes();
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty('type');
      expect(types[0]).toHaveProperty('name');
      expect(types[0]).toHaveProperty('icon');
      expect(types[0]).toHaveProperty('baseCaloriesPerMinute');
    });

    test('should get specific workout type info', () => {
      const cardioInfo = service.getWorkoutTypeInfo('cardio');
      expect(cardioInfo).toBeDefined();
      expect(cardioInfo?.type).toBe('cardio');
      expect(cardioInfo?.name).toBe('Cardio');
      expect(cardioInfo?.baseCaloriesPerMinute).toBeGreaterThan(0);
    });

    test('should get workout types by category', () => {
      const cardioTypes = service.getWorkoutTypesByCategory('cardio');
      expect(cardioTypes.length).toBeGreaterThan(0);
      cardioTypes.forEach(type => {
        expect(type.category).toBe('cardio');
      });
    });

    test('should return undefined for unknown workout type', () => {
      const unknownType = service.getWorkoutTypeInfo('unknown' as WorkoutType);
      expect(unknownType).toBeUndefined();
    });
  });

  describe('Calorie Calculations', () => {
    test('should calculate steps calories correctly', () => {
      const steps = 10000;
      const expectedCalories = Math.round(steps * 0.04);
      const calories = service.calculateStepsCalories(steps);
      expect(calories).toBe(expectedCalories);
    });

    test('should calculate workout calories for known workout type', () => {
      const calories = service.calculateWorkoutCalories('running', 'high', 30);
      expect(calories).toBeGreaterThan(0);

      // High intensity should burn more than medium
      const mediumCalories = service.calculateWorkoutCalories('running', 'medium', 30);
      expect(calories).toBeGreaterThan(mediumCalories);
    });

    test('should calculate workout calories for unknown workout type', () => {
      const calories = service.calculateWorkoutCalories('unknown' as WorkoutType, 'medium', 30);
      expect(calories).toBeGreaterThan(0); // Should use fallback calculation
    });

    test('should calculate different intensities correctly', () => {
      const lowCalories = service.calculateWorkoutCalories('cardio', 'low', 30);
      const mediumCalories = service.calculateWorkoutCalories('cardio', 'medium', 30);
      const highCalories = service.calculateWorkoutCalories('cardio', 'high', 30);

      expect(lowCalories).toBeLessThan(mediumCalories);
      expect(mediumCalories).toBeLessThan(highCalories);
    });
  });

  describe('Validation', () => {
    describe('Steps Validation', () => {
      test('should validate valid steps', () => {
        const result = service.validateSteps(10000);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      test('should reject negative steps', () => {
        const result = service.validateSteps(-100);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });

      test('should reject steps over 100,000', () => {
        const result = service.validateSteps(150000);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });

      test('should reject NaN steps', () => {
        const result = service.validateSteps(NaN);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    describe('Workout Duration Validation', () => {
      test('should validate valid duration', () => {
        const result = service.validateWorkoutDuration(30);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      test('should reject zero or negative duration', () => {
        const result = service.validateWorkoutDuration(0);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });

      test('should reject duration over 8 hours', () => {
        const result = service.validateWorkoutDuration(500); // Over 480 minutes
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });

      test('should reject NaN duration', () => {
        const result = service.validateWorkoutDuration(NaN);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('Steps Entry Management', () => {
    beforeEach(() => {
      // Mock Firebase operations
      const mockDoc = { exists: jest.fn(() => false) };
      const mockSnapshot = { exists: jest.fn(() => false), data: jest.fn() };

      require('firebase/firestore').doc.mockReturnValue({});
      require('firebase/firestore').setDoc.mockResolvedValue(undefined);
      require('firebase/firestore').getDoc.mockResolvedValue(mockSnapshot);
    });

    test('should create steps entry successfully', async () => {
      const result = await service.createStepsEntry(mockUserId, 10000, mockDate);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.steps).toBe(10000);
      expect(result.data?.caloriesBurned).toBe(400); // 10000 * 0.04
      expect(result.data?.goal).toBe(10000); // default goal
    });

    test('should reject invalid steps', async () => {
      const result = await service.createStepsEntry(mockUserId, -100, mockDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_STEPS');
      expect(result.message).toBeDefined();
    });

    test('should reject invalid date', async () => {
      const result = await service.createStepsEntry(mockUserId, 10000, 'invalid-date');

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DATE');
      expect(result.message).toBeDefined();
    });

    test('should reject future date', async () => {
      const futureDate = '2025-12-31';
      const result = await service.createStepsEntry(mockUserId, 10000, futureDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('FUTURE_DATE');
      expect(result.message).toBeDefined();
    });

    test('should include custom goal when provided', async () => {
      const customGoal = 15000;
      const result = await service.createStepsEntry(mockUserId, 12000, mockDate, customGoal);

      expect(result.success).toBe(true);
      expect(result.data?.goal).toBe(customGoal);
    });

    test('should include notes when provided', async () => {
      const notes = 'Walked to work today';
      const result = await service.createStepsEntry(mockUserId, 10000, mockDate, undefined, notes);

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBe(notes);
    });
  });

  describe('Workout Entry Management', () => {
    beforeEach(() => {
      require('firebase/firestore').doc.mockReturnValue({});
      require('firebase/firestore').setDoc.mockResolvedValue(undefined);
    });

    test('should create workout entry successfully', async () => {
      const result = await service.createWorkoutEntry(
        mockUserId,
        'running',
        'Morning Run',
        30,
        'medium',
        mockDate
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe('running');
      expect(result.data?.name).toBe('Morning Run');
      expect(result.data?.duration).toBe(30);
      expect(result.data?.intensity).toBe('medium');
      expect(result.data?.caloriesBurned).toBeGreaterThan(0);
    });

    test('should reject invalid duration', async () => {
      const result = await service.createWorkoutEntry(
        mockUserId,
        'running',
        'Morning Run',
        0,
        'medium',
        mockDate
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DURATION');
      expect(result.message).toBeDefined();
    });

    test('should reject invalid date', async () => {
      const result = await service.createWorkoutEntry(
        mockUserId,
        'running',
        'Morning Run',
        30,
        'medium',
        'invalid-date'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DATE');
      expect(result.message).toBeDefined();
    });

    test('should reject future date', async () => {
      const futureDate = '2025-12-31';
      const result = await service.createWorkoutEntry(
        mockUserId,
        'running',
        'Morning Run',
        30,
        'medium',
        futureDate
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('FUTURE_DATE');
      expect(result.message).toBeDefined();
    });

    test('should include optional fields when provided', async () => {
      const options = {
        distance: 5.0,
        sets: 3,
        reps: 12,
        weight: 50,
        notes: 'Great workout!'
      };

      const result = await service.createWorkoutEntry(
        mockUserId,
        'strength',
        'Bench Press',
        45,
        'high',
        mockDate,
        options
      );

      expect(result.success).toBe(true);
      expect(result.data?.distance).toBe(5.0);
      expect(result.data?.sets).toBe(3);
      expect(result.data?.reps).toBe(12);
      expect(result.data?.weight).toBe(50);
      expect(result.data?.notes).toBe('Great workout!');
    });

    test('should trim and handle empty notes', async () => {
      const options = { notes: '  ' }; // Empty/whitespace notes

      const result = await service.createWorkoutEntry(
        mockUserId,
        'cardio',
        'Cardio Session',
        30,
        'medium',
        mockDate,
        options
      );

      expect(result.success).toBe(true);
      expect(result.data?.notes).toBeUndefined();
    });
  });

  describe('Activity Analysis', () => {
    beforeEach(() => {
      // Mock successful data retrieval
      const mockStepsEntry: StepsEntry = {
        id: 'steps-id',
        userId: mockUserId,
        date: mockDate,
        steps: 12000,
        caloriesBurned: 480,
        goal: 10000,
        source: 'manual',
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      const mockWorkoutEntries: WorkoutEntry[] = [
        {
          id: 'workout-1',
          userId: mockUserId,
          date: mockDate,
          type: 'running',
          name: 'Morning Run',
          duration: 30,
          intensity: 'medium',
          caloriesBurned: 300,
          timestamp: Timestamp.now(),
          createdAt: Timestamp.now()
        },
        {
          id: 'workout-2',
          userId: mockUserId,
          date: mockDate,
          type: 'strength',
          name: 'Weight Training',
          duration: 45,
          intensity: 'high',
          caloriesBurned: 270,
          timestamp: Timestamp.now(),
          createdAt: Timestamp.now()
        }
      ];

      // Mock service methods
      service.getStepsForDate = jest.fn().mockResolvedValue({
        success: true,
        data: mockStepsEntry,
        timestamp: Timestamp.now()
      });

      service.getWorkoutsForDate = jest.fn().mockResolvedValue({
        success: true,
        data: mockWorkoutEntries,
        timestamp: Timestamp.now()
      });
    });

    test('should analyze activity for date correctly', async () => {
      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const analysis = result.data!;
      expect(analysis.totalSteps).toBe(12000);
      expect(analysis.stepsGoal).toBe(10000);
      expect(analysis.stepsGoalAchieved).toBe(true);
      expect(analysis.stepsProgress).toBe(120);
      expect(analysis.totalWorkouts).toBe(2);
      expect(analysis.totalWorkoutDuration).toBe(75); // 30 + 45
      expect(analysis.totalCaloriesBurned).toBe(1050); // 480 + 300 + 270
      expect(analysis.activityScore).toBeGreaterThan(0);
    });

    test('should handle no steps entry', async () => {
      service.getStepsForDate = jest.fn().mockResolvedValue({
        success: true,
        data: null,
        timestamp: Timestamp.now()
      });

      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.totalSteps).toBe(0);
      expect(result.data?.stepsGoalAchieved).toBe(false);
      expect(result.data?.stepsCaloriesBurned).toBe(0);
    });

    test('should handle no workouts', async () => {
      service.getWorkoutsForDate = jest.fn().mockResolvedValue({
        success: true,
        data: [],
        timestamp: Timestamp.now()
      });

      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.totalWorkouts).toBe(0);
      expect(result.data?.totalWorkoutDuration).toBe(0);
      expect(result.data?.workoutCaloriesBurned).toBe(0);
    });

    test('should calculate workout breakdown by type', async () => {
      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.workoutsByType).toBeDefined();
      expect(result.data?.workoutsByType.running).toBe(1);
      expect(result.data?.workoutsByType.strength).toBe(1);
    });

    test('should calculate average workout duration', async () => {
      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.avgWorkoutDuration).toBe(38); // (30 + 45) / 2 rounded
    });

    test('should use custom steps goal', async () => {
      const customGoal = 15000;
      const result = await service.analyzeActivityForDate(mockUserId, mockDate, customGoal);

      expect(result.success).toBe(true);
      expect(result.data?.stepsGoal).toBe(customGoal);
      expect(result.data?.stepsProgress).toBe(80); // 12000 / 15000 * 100
      expect(result.data?.stepsGoalAchieved).toBe(false);
    });
  });

  describe('Update Operations', () => {
    beforeEach(() => {
      const mockUpdatedEntry = {
        id: 'test-id',
        steps: 15000,
        caloriesBurned: 600
      };

      require('firebase/firestore').updateDoc.mockResolvedValue(undefined);
      require('firebase/firestore').getDoc.mockResolvedValue({
        data: () => mockUpdatedEntry
      });
    });

    test('should update steps entry and recalculate calories', async () => {
      const updates = { steps: 15000 };
      const result = await service.updateStepsEntry('test-id', updates);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Verify updateDoc was called with recalculated calories
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          steps: 15000,
          caloriesBurned: 600, // 15000 * 0.04
          updatedAt: expect.anything()
        })
      );
    });

    test('should update workout entry and recalculate calories', async () => {
      const updates = {
        type: 'running' as WorkoutType,
        intensity: 'high' as WorkoutIntensity,
        duration: 60
      };

      const result = await service.updateWorkoutEntry('test-id', updates);

      expect(result.success).toBe(true);
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'running',
          intensity: 'high',
          duration: 60,
          caloriesBurned: expect.any(Number),
          updatedAt: expect.anything()
        })
      );
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      require('firebase/firestore').deleteDoc.mockResolvedValue(undefined);
    });

    test('should delete steps entry', async () => {
      const result = await service.deleteStepsEntry('test-id');

      expect(result.success).toBe(true);
      expect(require('firebase/firestore').deleteDoc).toHaveBeenCalled();
    });

    test('should delete workout entry', async () => {
      const result = await service.deleteWorkoutEntry('test-id');

      expect(result.success).toBe(true);
      expect(require('firebase/firestore').deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase errors in steps creation', async () => {
      const error = new Error('Firebase error');
      require('firebase/firestore').setDoc.mockRejectedValue(error);

      const result = await service.createStepsEntry(mockUserId, 10000, mockDate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firebase error');
      expect(result.message).toBe('Failed to save steps entry');
    });

    test('should handle Firebase errors in workout creation', async () => {
      const error = new Error('Firebase error');
      require('firebase/firestore').setDoc.mockRejectedValue(error);

      const result = await service.createWorkoutEntry(
        mockUserId,
        'running',
        'Test Run',
        30,
        'medium',
        mockDate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firebase error');
      expect(result.message).toBe('Failed to save workout entry');
    });

    test('should handle errors in activity analysis', async () => {
      const error = new Error('Analysis error');
      service.getStepsForDate = jest.fn().mockRejectedValue(error);

      const result = await service.analyzeActivityForDate(mockUserId, mockDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis error');
      expect(result.message).toBe('Failed to analyze activity data');
    });
  });

  describe('Activity Statistics', () => {
    test('should return placeholder activity stats', async () => {
      const result = await service.getActivityStats(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('totalDays');
      expect(result.data).toHaveProperty('totalSteps');
      expect(result.data).toHaveProperty('totalWorkouts');
      expect(result.data).toHaveProperty('totalCaloriesBurned');
    });
  });
});