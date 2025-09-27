/**
 * Basic ActivityTrackingService tests focusing on core logic without Firebase dependencies
 */

// Mock all Firebase imports before any imports
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ seconds: 1640995200, nanoseconds: 0 })
  }
}));

jest.mock('../config', () => ({
  firestore: {}
}));

jest.mock('../BaseFirebaseService', () => ({
  BaseFirebaseService: class MockBaseFirebaseService {
    constructor() {}
  }
}));

import { ActivityTrackingService } from '../services/ActivityTrackingService';

describe('ActivityTrackingService - Core Logic', () => {
  let service: ActivityTrackingService;

  beforeEach(() => {
    service = new ActivityTrackingService();
  });

  describe('Workout Type Management', () => {
    test('should get all workout types', () => {
      const types = service.getWorkoutTypes();

      expect(types).toBeDefined();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);

      // Check structure of first workout type
      const firstType = types[0];
      expect(firstType).toHaveProperty('type');
      expect(firstType).toHaveProperty('name');
      expect(firstType).toHaveProperty('icon');
      expect(firstType).toHaveProperty('baseCaloriesPerMinute');
      expect(firstType).toHaveProperty('intensityMultipliers');
      expect(firstType.intensityMultipliers).toHaveProperty('low');
      expect(firstType.intensityMultipliers).toHaveProperty('medium');
      expect(firstType.intensityMultipliers).toHaveProperty('high');
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

      expect(Array.isArray(cardioTypes)).toBe(true);
      expect(cardioTypes.length).toBeGreaterThan(0);

      cardioTypes.forEach(type => {
        expect(type.category).toBe('cardio');
      });
    });

    test('should return undefined for unknown workout type', () => {
      const unknownType = service.getWorkoutTypeInfo('unknown' as any);
      expect(unknownType).toBeUndefined();
    });
  });

  describe('Calorie Calculations', () => {
    test('should calculate steps calories correctly', () => {
      const testCases = [
        { steps: 0, expected: 0 },
        { steps: 1000, expected: 40 },
        { steps: 5000, expected: 200 },
        { steps: 10000, expected: 400 },
        { steps: 15000, expected: 600 }
      ];

      testCases.forEach(({ steps, expected }) => {
        const calories = service.calculateStepsCalories(steps);
        expect(calories).toBe(expected);
      });
    });

    test('should calculate workout calories for known workout types', () => {
      // Test cardio workout
      const cardioCalories = service.calculateWorkoutCalories('cardio', 'medium', 30);
      expect(cardioCalories).toBeGreaterThan(0);
      expect(cardioCalories).toBe(Math.round(8 * 1.0 * 30)); // baseCalories * multiplier * duration

      // Test running workout
      const runningCalories = service.calculateWorkoutCalories('running', 'high', 30);
      expect(runningCalories).toBeGreaterThan(cardioCalories); // Running should burn more than basic cardio
    });

    test('should calculate different intensities correctly', () => {
      const duration = 30;
      const workoutType = 'cardio';

      const lowCalories = service.calculateWorkoutCalories(workoutType, 'low', duration);
      const mediumCalories = service.calculateWorkoutCalories(workoutType, 'medium', duration);
      const highCalories = service.calculateWorkoutCalories(workoutType, 'high', duration);

      expect(lowCalories).toBeLessThan(mediumCalories);
      expect(mediumCalories).toBeLessThan(highCalories);
    });

    test('should handle unknown workout type with fallback calculation', () => {
      const calories = service.calculateWorkoutCalories('unknown' as any, 'medium', 30);

      expect(calories).toBeGreaterThan(0);
      expect(calories).toBe(Math.round(6 * 1.0 * 30)); // Fallback: 6 calories/min * 1.0 multiplier * 30 min
    });
  });

  describe('Validation Logic', () => {
    describe('Steps Validation', () => {
      test('should validate correct steps values', () => {
        const validSteps = [0, 1000, 5000, 10000, 50000, 100000];

        validSteps.forEach(steps => {
          const result = service.validateSteps(steps);
          expect(result.isValid).toBe(true);
          expect(result.message).toBeUndefined();
        });
      });

      test('should reject negative steps', () => {
        const result = service.validateSteps(-100);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
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
      test('should validate correct duration values', () => {
        const validDurations = [1, 30, 60, 120, 480]; // 1 min to 8 hours

        validDurations.forEach(duration => {
          const result = service.validateWorkoutDuration(duration);
          expect(result.isValid).toBe(true);
          expect(result.message).toBeUndefined();
        });
      });

      test('should reject zero or negative duration', () => {
        const invalidDurations = [0, -10, -1];

        invalidDurations.forEach(duration => {
          const result = service.validateWorkoutDuration(duration);
          expect(result.isValid).toBe(false);
          expect(result.message).toBeDefined();
        });
      });

      test('should reject duration over 8 hours (480 minutes)', () => {
        const result = service.validateWorkoutDuration(500);
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

  describe('Activity Score Calculation', () => {
    test('should calculate activity score correctly', () => {
      // Test the private method through analyzeActivityForDate if it uses it
      // For now, test the workout types provide sensible calorie estimates

      const workoutTypes = service.getWorkoutTypes();
      const cardioType = workoutTypes.find(t => t.type === 'cardio');

      expect(cardioType).toBeDefined();
      expect(cardioType!.baseCaloriesPerMinute).toBeGreaterThan(0);

      // Test intensity multipliers are sensible
      const intensities = cardioType!.intensityMultipliers;
      expect(intensities.low).toBeLessThan(intensities.medium);
      expect(intensities.medium).toBeLessThan(intensities.high);
      expect(intensities.medium).toBe(1.0); // Medium should be the baseline
    });
  });

  describe('Data Structure Integrity', () => {
    test('should have all required workout categories', () => {
      const expectedCategories = ['cardio', 'strength', 'sports', 'flexibility', 'other'];
      const workoutTypes = service.getWorkoutTypes();

      expectedCategories.forEach(category => {
        const typesInCategory = service.getWorkoutTypesByCategory(category);
        expect(typesInCategory.length).toBeGreaterThan(0);
      });
    });

    test('should have consistent data structure across all workout types', () => {
      const workoutTypes = service.getWorkoutTypes();

      workoutTypes.forEach(type => {
        // Required properties
        expect(typeof type.type).toBe('string');
        expect(typeof type.name).toBe('string');
        expect(typeof type.icon).toBe('string');
        expect(typeof type.category).toBe('string');
        expect(typeof type.baseCaloriesPerMinute).toBe('number');
        expect(type.baseCaloriesPerMinute).toBeGreaterThan(0);

        // Intensity multipliers
        expect(typeof type.intensityMultipliers.low).toBe('number');
        expect(typeof type.intensityMultipliers.medium).toBe('number');
        expect(typeof type.intensityMultipliers.high).toBe('number');
        expect(type.intensityMultipliers.low).toBeGreaterThan(0);
        expect(type.intensityMultipliers.medium).toBe(1.0); // Medium should be baseline
        expect(type.intensityMultipliers.high).toBeGreaterThan(1.0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle edge case calorie calculations', () => {
      // Zero duration
      const zeroCalories = service.calculateWorkoutCalories('cardio', 'medium', 0);
      expect(zeroCalories).toBe(0);

      // Very high duration
      const highDurationCalories = service.calculateWorkoutCalories('cardio', 'medium', 480);
      expect(highDurationCalories).toBeGreaterThan(0);
      expect(highDurationCalories).toBe(Math.round(8 * 1.0 * 480));
    });

    test('should handle zero steps calculation', () => {
      const calories = service.calculateStepsCalories(0);
      expect(calories).toBe(0);
    });

    test('should handle maximum valid steps', () => {
      const calories = service.calculateStepsCalories(100000);
      expect(calories).toBe(4000); // 100000 * 0.04
    });
  });
});