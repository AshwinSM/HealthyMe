import { WaterTrackingService } from '../../src/services/firebase/services/WaterTrackingService';
import { WaterEntry, WaterUnit } from '../../src/types/health';
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
    now: jest.fn(() => ({ toMillis: () => Date.now(), toDate: () => new Date() }))
  }
}));

jest.mock('../../src/services/firebase/config', () => ({
  firestore: {}
}));

describe('WaterTrackingService', () => {
  let waterTrackingService: WaterTrackingService;

  beforeEach(() => {
    waterTrackingService = new WaterTrackingService();
    jest.clearAllMocks();
  });

  describe('Unit Conversion', () => {
    it('should convert ml to fl_oz correctly', () => {
      const result = waterTrackingService.convertWaterAmount(1000, 'ml', 'fl_oz');
      expect(result).toBeCloseTo(33.814, 2);
    });

    it('should convert fl_oz to ml correctly', () => {
      const result = waterTrackingService.convertWaterAmount(33.814, 'fl_oz', 'ml');
      expect(result).toBeCloseTo(1000, 0);
    });

    it('should convert cups to ml correctly', () => {
      const result = waterTrackingService.convertWaterAmount(4, 'cups', 'ml');
      expect(result).toBeCloseTo(946.352, 2);
    });

    it('should convert ml to cups correctly', () => {
      const result = waterTrackingService.convertWaterAmount(946.352, 'ml', 'cups');
      expect(result).toBeCloseTo(4, 2);
    });

    it('should return same amount for same unit conversion', () => {
      expect(waterTrackingService.convertWaterAmount(500, 'ml', 'ml')).toBe(500);
      expect(waterTrackingService.convertWaterAmount(16, 'fl_oz', 'fl_oz')).toBe(16);
      expect(waterTrackingService.convertWaterAmount(2, 'cups', 'cups')).toBe(2);
    });
  });

  describe('Water Amount Formatting', () => {
    it('should format ml amounts correctly', () => {
      expect(waterTrackingService.formatWaterAmount(1000, 'ml')).toBe('1000 ml');
      expect(waterTrackingService.formatWaterAmount(500, 'ml')).toBe('500 ml');
      expect(waterTrackingService.formatWaterAmount(250.5, 'ml')).toBe('250.5 ml');
    });

    it('should format fl_oz amounts correctly', () => {
      expect(waterTrackingService.formatWaterAmount(473.176, 'fl_oz')).toBe('16 fl oz');
      expect(waterTrackingService.formatWaterAmount(236.588, 'fl_oz')).toBe('8 fl oz');
    });

    it('should format cups amounts correctly', () => {
      expect(waterTrackingService.formatWaterAmount(236.588, 'cups')).toBe('1 cup');
      expect(waterTrackingService.formatWaterAmount(473.176, 'cups')).toBe('2 cups');
      expect(waterTrackingService.formatWaterAmount(709.764, 'cups')).toBe('3 cups');
    });

    it('should handle singular vs plural for cups', () => {
      expect(waterTrackingService.formatWaterAmount(236.588, 'cups')).toBe('1 cup');
      expect(waterTrackingService.formatWaterAmount(473.176, 'cups')).toBe('2 cups');
    });
  });

  describe('Water Amount Validation', () => {
    it('should validate valid water amounts', () => {
      const validMl = waterTrackingService.validateWaterAmount(500, 'ml');
      expect(validMl.isValid).toBe(true);

      const validFlOz = waterTrackingService.validateWaterAmount(16, 'fl_oz');
      expect(validFlOz.isValid).toBe(true);

      const validCups = waterTrackingService.validateWaterAmount(2, 'cups');
      expect(validCups.isValid).toBe(true);
    });

    it('should reject invalid water amounts', () => {
      const tooSmallMl = waterTrackingService.validateWaterAmount(5, 'ml');
      expect(tooSmallMl.isValid).toBe(false);
      expect(tooSmallMl.message).toContain('too small');

      const tooLargeL = waterTrackingService.validateWaterAmount(3500, 'ml');
      expect(tooLargeL.isValid).toBe(false);
      expect(tooLargeL.message).toContain('too large');

      const invalidNaN = waterTrackingService.validateWaterAmount(NaN, 'ml');
      expect(invalidNaN.isValid).toBe(false);
      expect(invalidNaN.message).toBe('Please enter a valid amount');

      const invalidZero = waterTrackingService.validateWaterAmount(0, 'ml');
      expect(invalidZero.isValid).toBe(false);
      expect(invalidZero.message).toBe('Please enter a valid amount');

      const invalidNegative = waterTrackingService.validateWaterAmount(-100, 'ml');
      expect(invalidNegative.isValid).toBe(false);
      expect(invalidNegative.message).toBe('Please enter a valid amount');
    });

    it('should validate amounts in different units correctly', () => {
      // Test edge cases near limits
      const edgeCaseMl = waterTrackingService.validateWaterAmount(10, 'ml');
      expect(edgeCaseMl.isValid).toBe(true);

      const edgeCaseFlOz = waterTrackingService.validateWaterAmount(0.3, 'fl_oz'); // ~9ml
      expect(edgeCaseFlOz.isValid).toBe(false);

      const edgeCaseCups = waterTrackingService.validateWaterAmount(12.7, 'cups'); // ~3000ml
      expect(edgeCaseCups.isValid).toBe(false);
    });
  });

  describe('Default Goals and Quick Add Options', () => {
    it('should provide default water goal', () => {
      const defaultGoalMl = waterTrackingService.getDefaultWaterGoal('ml');
      expect(defaultGoalMl).toBe(2000);

      const defaultGoalFlOz = waterTrackingService.getDefaultWaterGoal('fl_oz');
      expect(defaultGoalFlOz).toBeCloseTo(67.628, 2);

      const defaultGoalCups = waterTrackingService.getDefaultWaterGoal('cups');
      expect(defaultGoalCups).toBeCloseTo(8.454, 2);
    });

    it('should provide quick-add options for different units', () => {
      const mlOptions = waterTrackingService.getQuickAddOptions('ml');
      expect(mlOptions).toHaveLength(4);
      expect(mlOptions[0].amount).toBe(250);
      expect(mlOptions[0].label).toBe('250ml');
      expect(mlOptions[0].icon).toBe('🥛');

      const flOzOptions = waterTrackingService.getQuickAddOptions('fl_oz');
      expect(flOzOptions).toHaveLength(4);
      expect(flOzOptions[0].amount).toBe(8);
      expect(flOzOptions[0].label).toBe('8 fl oz');

      const cupsOptions = waterTrackingService.getQuickAddOptions('cups');
      expect(cupsOptions).toHaveLength(4);
      expect(cupsOptions[0].amount).toBe(1);
      expect(cupsOptions[0].label).toBe('1 cup');
      expect(cupsOptions[0].icon).toBe('☕');
    });

    it('should fallback to ml options for unknown units', () => {
      const options = waterTrackingService.getQuickAddOptions('unknown' as WaterUnit);
      expect(options).toEqual(waterTrackingService.getQuickAddOptions('ml'));
    });
  });

  describe('Water Entry Creation', () => {
    const mockWaterEntries: WaterEntry[] = [
      {
        id: '1',
        userId: 'user1',
        date: '2023-06-15',
        amount: 500,
        unit: 'ml',
        timestamp: Timestamp.now(),
        source: 'water',
        createdAt: Timestamp.now()
      },
      {
        id: '2',
        userId: 'user1',
        date: '2023-06-15',
        amount: 250,
        unit: 'ml',
        timestamp: Timestamp.now(),
        source: 'coffee',
        notes: 'Morning coffee',
        createdAt: Timestamp.now()
      }
    ];

    beforeEach(() => {
      // Mock Firestore operations
      const mockDoc = { data: () => null };
      const mockSnapshot = { docs: [] };

      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);
      require('firebase/firestore').setDoc.mockResolvedValue(undefined);
    });

    it('should create water entry with valid data', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        500,
        'ml',
        '2023-06-15',
        'water',
        'Daily hydration'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.amount).toBe(500);
        expect(result.data.unit).toBe('ml');
        expect(result.data.date).toBe('2023-06-15');
        expect(result.data.source).toBe('water');
        expect(result.data.notes).toBe('Daily hydration');
      }
    });

    it('should convert lbs to ml when creating entry', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        16, // fl oz
        'fl_oz',
        '2023-06-15',
        'water'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.amount).toBeCloseTo(473.176, 2); // Converted to ml
        expect(result.data.unit).toBe('fl_oz'); // Original input unit preserved
      }
    });

    it('should reject water amount outside valid range', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        5, // Too small
        'ml',
        '2023-06-15'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_AMOUNT');
      expect(result.message).toContain('too small');
    });

    it('should handle invalid date', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        500,
        'ml',
        'invalid-date'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DATE');
    });

    it('should handle future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const result = await waterTrackingService.createWaterEntry(
        'user1',
        500,
        'ml',
        futureDateString
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('FUTURE_DATE');
    });
  });

  describe('Water Analysis', () => {
    const mockWaterEntries: WaterEntry[] = [
      {
        id: '1',
        userId: 'user1',
        date: '2023-06-15',
        amount: 500,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-15T08:00:00') } as Timestamp,
        source: 'water',
        createdAt: Timestamp.now()
      },
      {
        id: '2',
        userId: 'user1',
        date: '2023-06-15',
        amount: 300,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-15T12:00:00') } as Timestamp,
        source: 'coffee',
        createdAt: Timestamp.now()
      },
      {
        id: '3',
        userId: 'user1',
        date: '2023-06-15',
        amount: 250,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-15T16:00:00') } as Timestamp,
        source: 'water',
        createdAt: Timestamp.now()
      }
    ];

    beforeEach(() => {
      // Mock successful water entries fetch
      const mockSnapshot = { docs: mockWaterEntries.map(entry => ({ data: () => entry })) };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);
    });

    it('should analyze water intake correctly', async () => {
      const result = await waterTrackingService.analyzeWaterIntake('user1', '2023-06-15', 2000);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.totalConsumed).toBe(1050); // 500 + 300 + 250
        expect(result.data.goal).toBe(2000);
        expect(result.data.percentageAchieved).toBe(53); // 1050/2000 * 100 rounded
        expect(result.data.remaining).toBe(950); // 2000 - 1050
        expect(result.data.goalAchieved).toBe(false);
        expect(result.data.entriesCount).toBe(3);
        expect(result.data.avgEntrySize).toBe(350); // 1050/3 rounded
      }
    });

    it('should calculate hourly distribution correctly', async () => {
      const result = await waterTrackingService.analyzeWaterIntake('user1', '2023-06-15', 2000);

      expect(result.success).toBe(true);
      if (result.data) {
        const hourlyDistribution = result.data.hourlyDistribution;
        expect(hourlyDistribution).toHaveLength(24);

        // Check specific hours have correct amounts
        expect(hourlyDistribution[8].amount).toBe(500); // 8 AM
        expect(hourlyDistribution[12].amount).toBe(300); // 12 PM
        expect(hourlyDistribution[16].amount).toBe(250); // 4 PM

        // Check other hours are zero
        expect(hourlyDistribution[0].amount).toBe(0);
        expect(hourlyDistribution[23].amount).toBe(0);
      }
    });

    it('should handle goal achievement correctly', async () => {
      // Mock entries that exceed goal
      const goalExceedingEntries = [
        ...mockWaterEntries,
        {
          id: '4',
          userId: 'user1',
          date: '2023-06-15',
          amount: 1000,
          unit: 'ml',
          timestamp: { toDate: () => new Date('2023-06-15T20:00:00') } as Timestamp,
          source: 'water',
          createdAt: Timestamp.now()
        }
      ];

      const mockSnapshot = { docs: goalExceedingEntries.map(entry => ({ data: () => entry })) };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);

      const result = await waterTrackingService.analyzeWaterIntake('user1', '2023-06-15', 2000);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.totalConsumed).toBe(2050); // 1050 + 1000
        expect(result.data.percentageAchieved).toBe(103); // 2050/2000 * 100 rounded
        expect(result.data.remaining).toBe(-50); // 2000 - 2050
        expect(result.data.goalAchieved).toBe(true);
      }
    });

    it('should handle no water data gracefully', async () => {
      // Mock empty result
      const mockSnapshot = { docs: [] };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);

      const result = await waterTrackingService.analyzeWaterIntake('user1', '2023-06-15', 2000);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_WATER_DATA');
    });
  });

  describe('Water Statistics', () => {
    const mockHistoricalEntries: WaterEntry[] = [
      {
        id: '1',
        userId: 'user1',
        date: '2023-06-15',
        amount: 2000,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-15T10:00:00') } as Timestamp,
        source: 'water',
        createdAt: Timestamp.now()
      },
      {
        id: '2',
        userId: 'user1',
        date: '2023-06-14',
        amount: 1500,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-14T14:00:00') } as Timestamp,
        source: 'water',
        createdAt: Timestamp.now()
      },
      {
        id: '3',
        userId: 'user1',
        date: '2023-06-13',
        amount: 2500,
        unit: 'ml',
        timestamp: { toDate: () => new Date('2023-06-13T09:00:00') } as Timestamp,
        source: 'water',
        createdAt: Timestamp.now()
      }
    ];

    beforeEach(() => {
      const mockSnapshot = { docs: mockHistoricalEntries.map(entry => ({ data: () => entry })) };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);
    });

    it('should calculate water statistics correctly', async () => {
      const result = await waterTrackingService.getWaterStats('user1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.totalDays).toBe(3);
        expect(result.data.totalVolume).toBe(6000); // 2000 + 1500 + 2500
        expect(result.data.averageDaily).toBe(2000); // 6000 / 3
        expect(result.data.averageEntriesPerDay).toBe(1); // 3 entries / 3 days
        expect(result.data.favoriteHour).toBeGreaterThanOrEqual(0);
        expect(result.data.favoriteHour).toBeLessThan(24);
        expect(result.data.bestDay.amount).toBe(2500);
        expect(result.data.bestDay.date).toBe('2023-06-13');
      }
    });

    it('should handle empty water history gracefully', async () => {
      const mockSnapshot = { docs: [] };
      require('firebase/firestore').getDocs.mockResolvedValue(mockSnapshot);

      const result = await waterTrackingService.getWaterStats('user1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_DATA');
    });
  });

  describe('Water Entry CRUD Operations', () => {
    beforeEach(() => {
      require('firebase/firestore').updateDoc.mockResolvedValue(undefined);
      require('firebase/firestore').deleteDoc.mockResolvedValue(undefined);
      require('firebase/firestore').getDoc.mockResolvedValue({
        data: () => ({
          id: 'entry1',
          userId: 'user1',
          amount: 750,
          unit: 'ml',
          date: '2023-06-15',
          source: 'water',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      });
    });

    it('should update water entry successfully', async () => {
      const result = await waterTrackingService.updateWaterEntry('entry1', {
        amount: 750,
        unit: 'ml',
        source: 'coffee',
        notes: 'Updated entry'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.amount).toBe(750);
        expect(result.data.source).toBe('coffee');
      }
    });

    it('should delete water entry successfully', async () => {
      const result = await waterTrackingService.deleteWaterEntry('entry1');

      expect(result.success).toBe(true);
      expect(require('firebase/firestore').deleteDoc).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      require('firebase/firestore').updateDoc.mockRejectedValue(new Error('Update failed'));

      const result = await waterTrackingService.updateWaterEntry('entry1', {
        amount: 750,
        unit: 'ml'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update water entry');
    });

    it('should handle delete errors gracefully', async () => {
      require('firebase/firestore').deleteDoc.mockRejectedValue(new Error('Delete failed'));

      const result = await waterTrackingService.deleteWaterEntry('entry1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to delete water entry');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      require('firebase/firestore').setDoc.mockRejectedValue(
        new Error('Network error')
      );

      const result = await waterTrackingService.createWaterEntry(
        'user1',
        500,
        'ml',
        '2023-06-15'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.message).toBe('Failed to save water entry');
    });

    it('should handle very small decimal amounts correctly', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        10.5,
        'ml',
        '2023-06-15'
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.amount).toBe(10.5);
      }
    });

    it('should handle large water amounts correctly', async () => {
      const result = await waterTrackingService.createWaterEntry(
        'user1',
        2.5,
        'cups', // 2.5 cups = ~591ml
        '2023-06-15'
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.amount).toBeCloseTo(591.47, 1);
        expect(result.data.unit).toBe('cups');
      }
    });

    it('should handle missing user data', async () => {
      const result = await waterTrackingService.createWaterEntry(
        '', // Empty user ID
        500,
        'ml',
        '2023-06-15'
      );

      // Should still attempt to create but the ID generation will include empty userId
      expect(result).toBeDefined();
    });
  });
});