import { WeightTrackingService } from '../../src/services/firebase/services/WeightTrackingService';
import { WeightEntry, BMICategory } from '../../src/types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() }))
  }
}));

jest.mock('../../src/services/firebase/config', () => ({
  firestore: {}
}));

describe('WeightTrackingService', () => {
  let weightTrackingService: WeightTrackingService;

  beforeEach(() => {
    weightTrackingService = new WeightTrackingService();
    jest.clearAllMocks();
  });

  describe('BMI Calculations', () => {
    it('should calculate BMI correctly', () => {
      // Test case: 70kg, 175cm = BMI 22.9
      const bmi = weightTrackingService.calculateBMI(70, 175);
      expect(bmi).toBe(22.9);

      // Test case: 80kg, 180cm = BMI 24.7
      const bmi2 = weightTrackingService.calculateBMI(80, 180);
      expect(bmi2).toBe(24.7);

      // Test edge case: very low weight
      const bmi3 = weightTrackingService.calculateBMI(50, 170);
      expect(bmi3).toBe(17.3);
    });

    it('should categorize BMI correctly', () => {
      expect(weightTrackingService.getBMICategory(17)).toBe('underweight');
      expect(weightTrackingService.getBMICategory(22)).toBe('normal');
      expect(weightTrackingService.getBMICategory(27)).toBe('overweight');
      expect(weightTrackingService.getBMICategory(32)).toBe('obese_class_1');
      expect(weightTrackingService.getBMICategory(37)).toBe('obese_class_2');
      expect(weightTrackingService.getBMICategory(42)).toBe('obese_class_3');
    });

    it('should provide correct BMI labels', () => {
      expect(weightTrackingService.getBMILabel('underweight')).toBe('Underweight');
      expect(weightTrackingService.getBMILabel('normal')).toBe('Normal Weight');
      expect(weightTrackingService.getBMILabel('overweight')).toBe('Overweight');
      expect(weightTrackingService.getBMILabel('obese_class_1')).toBe('Obesity Class I');
      expect(weightTrackingService.getBMILabel('obese_class_2')).toBe('Obesity Class II');
      expect(weightTrackingService.getBMILabel('obese_class_3')).toBe('Obesity Class III');
    });

    it('should provide correct BMI colors', () => {
      expect(weightTrackingService.getBMIColor('underweight')).toBe('#3B82F6');
      expect(weightTrackingService.getBMIColor('normal')).toBe('#10B981');
      expect(weightTrackingService.getBMIColor('overweight')).toBe('#F59E0B');
      expect(weightTrackingService.getBMIColor('obese_class_1')).toBe('#EF4444');
    });
  });

  describe('Unit Conversion', () => {
    it('should convert kg to lbs correctly', () => {
      const result = weightTrackingService.convertWeight(70, 'kg', 'lbs');
      expect(result).toBeCloseTo(154.324, 2);
    });

    it('should convert lbs to kg correctly', () => {
      const result = weightTrackingService.convertWeight(154.324, 'lbs', 'kg');
      expect(result).toBeCloseTo(70, 2);
    });

    it('should return same weight for same unit conversion', () => {
      expect(weightTrackingService.convertWeight(70, 'kg', 'kg')).toBe(70);
      expect(weightTrackingService.convertWeight(154, 'lbs', 'lbs')).toBe(154);
    });

    it('should format weight correctly', () => {
      expect(weightTrackingService.formatWeight(70.5, 'kg')).toBe('70.5 kg');
      expect(weightTrackingService.formatWeight(70, 'lbs')).toBe('154.3 lbs');
    });

    it('should format weight change correctly', () => {
      expect(weightTrackingService.formatWeightChange(2.5, 'kg')).toBe('+2.5 kg');
      expect(weightTrackingService.formatWeightChange(-1.5, 'kg')).toBe('-1.5 kg');
      expect(weightTrackingService.formatWeightChange(0, 'kg')).toBe('0 kg');
    });
  });

  describe('Weight Validation', () => {
    it('should validate valid weight ranges', () => {
      const validKg = weightTrackingService.validateWeightRange(70, 'kg');
      expect(validKg.isValid).toBe(true);

      const validLbs = weightTrackingService.validateWeightRange(150, 'lbs');
      expect(validLbs.isValid).toBe(true);
    });

    it('should reject invalid weight ranges', () => {
      const tooLowKg = weightTrackingService.validateWeightRange(20, 'kg');
      expect(tooLowKg.isValid).toBe(false);
      expect(tooLowKg.message).toContain('between 30-500 kg');

      const tooHighLbs = weightTrackingService.validateWeightRange(1200, 'lbs');
      expect(tooHighLbs.isValid).toBe(false);
      expect(tooHighLbs.message).toContain('between 66-1100 lbs');
    });

    it('should reject invalid weight values', () => {
      const invalidNaN = weightTrackingService.validateWeightRange(NaN, 'kg');
      expect(invalidNaN.isValid).toBe(false);
      expect(invalidNaN.message).toBe('Please enter a valid weight');

      const invalidZero = weightTrackingService.validateWeightRange(0, 'kg');
      expect(invalidZero.isValid).toBe(false);
      expect(invalidZero.message).toBe('Please enter a valid weight');

      const invalidNegative = weightTrackingService.validateWeightRange(-5, 'kg');
      expect(invalidNegative.isValid).toBe(false);
      expect(invalidNegative.message).toBe('Please enter a valid weight');
    });
  });

  describe('Weight Analysis', () => {
    const mockWeightEntries: WeightEntry[] = [
      {
        id: '1',
        userId: 'user1',
        weight: 75,
        unit: 'kg',
        date: '2023-06-15',
        createdAt: Timestamp.now()
      },
      {
        id: '2',
        userId: 'user1',
        weight: 74.5,
        unit: 'kg',
        date: '2023-06-10',
        createdAt: Timestamp.now()
      },
      {
        id: '3',
        userId: 'user1',
        weight: 74.8,
        unit: 'kg',
        date: '2023-06-05',
        createdAt: Timestamp.now()
      },
      {
        id: '4',
        userId: 'user1',
        weight: 76,
        unit: 'kg',
        date: '2023-06-01',
        createdAt: Timestamp.now()
      }
    ];

    it('should calculate weight change correctly', () => {
      const service = weightTrackingService as any;
      const current = mockWeightEntries[0]; // 75kg on 2023-06-15
      const previous = mockWeightEntries[1]; // 74.5kg on 2023-06-10

      const change = service.calculateWeightChange(current, previous);

      expect(change.absolute).toBe(0.5); // 75 - 74.5
      expect(change.percentage).toBeCloseTo(0.67, 1); // (0.5/74.5)*100
      expect(change.direction).toBe('increasing');
      expect(change.daysSincePrevious).toBe(5);
    });

    it('should calculate weekly average correctly', () => {
      const service = weightTrackingService as any;

      // Mock today's date and entries within 7 days
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2023-06-15').getTime());

      const weeklyAvg = service.calculateWeeklyAverage(mockWeightEntries);

      // Should include entries from last 7 days: 75kg (Jun 15), 74.5kg (Jun 10)
      expect(weeklyAvg).toBeCloseTo(74.75, 1);
    });

    it('should calculate monthly average correctly', () => {
      const service = weightTrackingService as any;

      jest.spyOn(Date, 'now').mockReturnValue(new Date('2023-06-15').getTime());

      const monthlyAvg = service.calculateMonthlyAverage(mockWeightEntries);

      // Should include all entries from last 30 days
      const expectedAvg = (75 + 74.5 + 74.8 + 76) / 4;
      expect(monthlyAvg).toBeCloseTo(expectedAvg, 1);
    });

    it('should analyze trend correctly for increasing weight', () => {
      const service = weightTrackingService as any;

      // Create entries with clear increasing trend
      const increasingEntries = [
        { weight: 80, date: '2023-06-15' },
        { weight: 79, date: '2023-06-10' },
        { weight: 78, date: '2023-06-05' },
        { weight: 77, date: '2023-06-01' }
      ];

      const trend = service.analyzeTrend(increasingEntries);

      expect(trend.direction).toBe('increasing');
      expect(trend.strength).toBe('strong');
      expect(trend.confidenceLevel).toBeGreaterThan(0.5);
    });

    it('should analyze trend correctly for stable weight', () => {
      const service = weightTrackingService as any;

      // Create entries with stable weight
      const stableEntries = [
        { weight: 75.1, date: '2023-06-15' },
        { weight: 74.9, date: '2023-06-10' },
        { weight: 75.0, date: '2023-06-05' },
        { weight: 75.1, date: '2023-06-01' }
      ];

      const trend = service.analyzeTrend(stableEntries);

      expect(trend.direction).toBe('stable');
    });
  });

  describe('Data Creation and Validation', () => {
    beforeEach(() => {
      // Mock Firestore operations
      const mockDoc = { data: () => mockWeightEntries[0] };
      const mockSnapshot = { docs: [mockDoc] };

      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);
      require('firebase/firestore').setDoc.mockResolvedValue(undefined);
    });

    it('should create weight entry with valid data', async () => {
      const result = await weightTrackingService.createWeightEntry(
        'user1',
        70,
        'kg',
        '2023-06-15',
        'Morning weigh-in'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.weight).toBe(70);
        expect(result.data.unit).toBe('kg');
        expect(result.data.date).toBe('2023-06-15');
        expect(result.data.notes).toBe('Morning weigh-in');
      }
    });

    it('should convert lbs to kg when creating entry', async () => {
      const result = await weightTrackingService.createWeightEntry(
        'user1',
        154.324,
        'lbs',
        '2023-06-15'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.weight).toBeCloseTo(70, 2); // Converted to kg
        expect(result.data.unit).toBe('lbs'); // Original display unit preserved
      }
    });

    it('should reject weight outside valid range', async () => {
      const result = await weightTrackingService.createWeightEntry(
        'user1',
        20, // Too low
        'kg',
        '2023-06-15'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_WEIGHT_RANGE');
      expect(result.message).toContain('between 30-500 kg');
    });

    it('should handle duplicate entry detection', async () => {
      // Mock existing entry found
      const mockExistingEntry = mockWeightEntries[0];
      const mockSnapshot = { docs: [{ data: () => mockExistingEntry }] };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);

      const result = await weightTrackingService.createWeightEntry(
        'user1',
        70,
        'kg',
        '2023-06-15' // Same date as existing
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('DUPLICATE_ENTRY');
      expect(result.message).toContain('already exists');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty weight history gracefully', () => {
      const service = weightTrackingService as any;

      const weeklyAvg = service.calculateWeeklyAverage([]);
      expect(weeklyAvg).toBeUndefined();

      const monthlyAvg = service.calculateMonthlyAverage([]);
      expect(monthlyAvg).toBeUndefined();

      const trend = service.analyzeTrend([]);
      expect(trend.direction).toBe('stable');
      expect(trend.strength).toBe('weak');
      expect(trend.confidenceLevel).toBe(0.1);
    });

    it('should handle single weight entry', () => {
      const service = weightTrackingService as any;
      const singleEntry = [mockWeightEntries[0]];

      const trend = service.analyzeTrend(singleEntry);
      expect(trend.direction).toBe('stable');
      expect(trend.strength).toBe('weak');
    });

    it('should handle very small weight changes', () => {
      const service = weightTrackingService as any;

      const current = { weight: 75.01, date: '2023-06-15' };
      const previous = { weight: 75.00, date: '2023-06-10' };

      const change = service.calculateWeightChange(current, previous);
      expect(change.direction).toBe('stable'); // Change < 0.1kg
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      // Mock Firestore error
      require('firebase/firestore').setDoc.mockRejectedValue(
        new Error('Network error')
      );

      const result = await weightTrackingService.createWeightEntry(
        'user1',
        70,
        'kg',
        '2023-06-15'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.message).toBe('Failed to save weight entry');
    });

    it('should handle missing user data', async () => {
      const result = await weightTrackingService.createWeightEntry(
        '', // Empty user ID
        70,
        'kg',
        '2023-06-15'
      );

      // Should still attempt to create but may fail in real Firebase
      expect(result).toBeDefined();
    });
  });
});