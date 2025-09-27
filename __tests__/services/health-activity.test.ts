import { HealthService } from '../../src/services/firebase/health';
import { ActivityGoals, StepsEntry, WorkoutEntry, DailyActivitySummary } from '../../src/types/health';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

jest.mock('../../src/config', () => ({
  db: {},
}));

// Mock data
const mockUser = { id: 'test-user-123' };
const mockDate = '2024-01-15';

const mockStepsEntry: StepsEntry = {
  id: 'steps-123',
  userId: mockUser.id,
  steps: 8500,
  date: mockDate,
  source: 'manual',
  caloriesBurned: 340,
  goalProgress: {
    dailyGoal: 10000,
    achieved: false,
    percentage: 85
  },
  timestamp: { toMillis: () => Date.now() } as any,
  createdAt: { toMillis: () => Date.now() } as any
};

const mockWorkoutEntry: WorkoutEntry = {
  id: 'workout-123',
  userId: mockUser.id,
  date: mockDate,
  type: 'cardio',
  name: 'Morning Run',
  duration: 30,
  intensity: 'medium',
  caloriesBurned: 300,
  timestamp: { toMillis: () => Date.now() } as any,
  createdAt: { toMillis: () => Date.now() } as any
};

describe('HealthService - Activity Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Steps Tracking', () => {
    it('should add a new steps entry with goal progress calculation', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'steps-123' });

      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({ docs: [] }); // No existing entry

      const result = await HealthService.addStepsEntry(mockUser.id, mockDate, 8500, 'manual', 10000);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.steps).toBe(8500);
      expect(result.data?.caloriesBurned).toBe(340); // 8500 * 0.04
      expect(result.data?.goalProgress.percentage).toBe(85);
      expect(result.data?.goalProgress.achieved).toBe(false);
    });

    it('should validate steps range and reject invalid input', async () => {
      const result = await HealthService.addStepsEntry(mockUser.id, mockDate, 150000); // Too high

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_STEPS_RANGE');
      expect(result.message).toBe('Steps must be between 0 and 100,000');
    });

    it('should update existing steps entry for the same date', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'existing-123', data: () => mockStepsEntry }]
      });

      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await HealthService.addStepsEntry(mockUser.id, mockDate, 12000);

      expect(result.success).toBe(true);
      // Should call updateStepsEntry instead of creating new entry
    });

    it('should calculate goal achievement correctly', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'steps-456' });

      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await HealthService.addStepsEntry(mockUser.id, mockDate, 12000, 'manual', 10000);

      expect(result.success).toBe(true);
      expect(result.data?.goalProgress.achieved).toBe(true);
      expect(result.data?.goalProgress.percentage).toBe(120);
    });
  });

  describe('Workout Tracking', () => {
    it('should add workout entry with correct calorie calculation', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'workout-123' });

      const workoutData = {
        type: 'cardio' as const,
        name: 'Morning Run',
        duration: 30,
        intensity: 'medium' as const,
        notes: 'Great run!'
      };

      const result = await HealthService.addWorkoutEntry(mockUser.id, mockDate, workoutData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.caloriesBurned).toBe(300); // 30 minutes * 10 cal/min for medium cardio
      expect(result.data?.name).toBe('Morning Run');
      expect(result.data?.notes).toBe('Great run!');
    });

    it('should validate workout duration and reject invalid input', async () => {
      const workoutData = {
        type: 'cardio' as const,
        name: 'Invalid Workout',
        duration: 800, // Too long (over 720 minutes)
        intensity: 'medium' as const
      };

      const result = await HealthService.addWorkoutEntry(mockUser.id, mockDate, workoutData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DURATION');
      expect(result.message).toBe('Workout duration must be between 1 and 720 minutes');
    });

    it('should calculate calories correctly for different workout types and intensities', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'workout-456' });

      // Test high intensity strength training
      const strengthWorkout = {
        type: 'strength' as const,
        name: 'Heavy Lifting',
        duration: 45,
        intensity: 'high' as const
      };

      const result = await HealthService.addWorkoutEntry(mockUser.id, mockDate, strengthWorkout);

      expect(result.success).toBe(true);
      expect(result.data?.caloriesBurned).toBe(360); // 45 minutes * 8 cal/min for high strength
    });

    it('should delete workout entry successfully', async () => {
      const mockDeleteDoc = require('firebase/firestore').deleteDoc;
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await HealthService.deleteWorkoutEntry('workout-123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Daily Activity Summary', () => {
    it('should generate comprehensive daily activity summary', async () => {
      // Mock steps and workouts data
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [{ id: 'steps-123', data: () => mockStepsEntry }]
        }) // Steps query
        .mockResolvedValueOnce({
          docs: [{ id: 'workout-123', data: () => mockWorkoutEntry }]
        }); // Workouts query

      const goals: ActivityGoals = {
        dailySteps: 10000,
        weeklyWorkouts: 3,
        dailyActiveMinutes: 30
      };

      const result = await HealthService.getDailyActivitySummary(mockUser.id, mockDate, goals);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const summary = result.data!;
      expect(summary.steps.total).toBe(8500);
      expect(summary.steps.caloriesBurned).toBe(340);
      expect(summary.steps.goalAchieved).toBe(false);

      expect(summary.workouts.sessions).toHaveLength(1);
      expect(summary.workouts.totalDuration).toBe(30);
      expect(summary.workouts.totalCaloriesBurned).toBe(300);
      expect(summary.workouts.activeMinutes).toBe(45); // 30 * 1.5 for medium intensity

      expect(summary.combined.totalCaloriesBurned).toBe(640); // 340 + 300
      expect(summary.combined.totalActiveMinutes).toBe(45);
      expect(summary.combined.activityScore).toBeGreaterThan(0);
    });

    it('should calculate activity score correctly', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;

      // Perfect day: 10000 steps, 30+ active minutes, 1+ workout
      const perfectStepsEntry = {
        ...mockStepsEntry,
        steps: 10000,
        caloriesBurned: 400,
        goalProgress: { dailyGoal: 10000, achieved: true, percentage: 100 }
      };

      const perfectWorkoutEntry = {
        ...mockWorkoutEntry,
        duration: 40,
        intensity: 'high' as const,
        caloriesBurned: 600
      };

      mockGetDocs
        .mockResolvedValueOnce({
          docs: [{ id: 'steps-123', data: () => perfectStepsEntry }]
        })
        .mockResolvedValueOnce({
          docs: [{ id: 'workout-123', data: () => perfectWorkoutEntry }]
        });

      const result = await HealthService.getDailyActivitySummary(mockUser.id, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.combined.activityScore).toBe(100); // Perfect score
    });

    it('should handle empty activity data gracefully', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({ docs: [] }); // No data

      const result = await HealthService.getDailyActivitySummary(mockUser.id, mockDate);

      expect(result.success).toBe(true);
      expect(result.data?.steps.total).toBe(0);
      expect(result.data?.workouts.sessions).toHaveLength(0);
      expect(result.data?.combined.totalCaloriesBurned).toBe(0);
      expect(result.data?.combined.activityScore).toBe(0);
    });
  });

  describe('Activity Statistics', () => {
    it('should calculate activity statistics over time period', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;

      // Mock multiple entries
      const stepsEntries = [
        { ...mockStepsEntry, date: '2024-01-15', steps: 8500 },
        { ...mockStepsEntry, date: '2024-01-14', steps: 12000, goalProgress: { ...mockStepsEntry.goalProgress, achieved: true } },
        { ...mockStepsEntry, date: '2024-01-13', steps: 6000 }
      ];

      const workoutEntries = [
        { ...mockWorkoutEntry, date: '2024-01-15', duration: 30, type: 'cardio' },
        { ...mockWorkoutEntry, date: '2024-01-14', duration: 45, type: 'strength' },
        { ...mockWorkoutEntry, date: '2024-01-13', duration: 20, type: 'cardio' }
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: stepsEntries.map((entry, i) => ({ id: `steps-${i}`, data: () => entry }))
        })
        .mockResolvedValueOnce({
          docs: workoutEntries.map((entry, i) => ({ id: `workout-${i}`, data: () => entry }))
        });

      const result = await HealthService.getActivityStats(mockUser.id, 30);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const stats = result.data!;
      expect(stats.totalSteps).toBe(26500); // Sum of all steps
      expect(stats.totalWorkouts).toBe(3);
      expect(stats.totalWorkoutMinutes).toBe(95); // 30 + 45 + 20
      expect(stats.stepsGoalAchievementRate).toBeCloseTo(33.33); // 1 out of 3 achieved
      expect(stats.favoriteWorkoutType).toBe('cardio'); // Most frequent type
    });

    it('should calculate streaks correctly', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;

      // Mock consecutive goal-achieving entries
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const streakStepsEntries = [
        { ...mockStepsEntry, date: today, goalProgress: { ...mockStepsEntry.goalProgress, achieved: true } },
        { ...mockStepsEntry, date: yesterday, goalProgress: { ...mockStepsEntry.goalProgress, achieved: true } }
      ];

      const streakWorkoutEntries = [
        { ...mockWorkoutEntry, date: today },
        { ...mockWorkoutEntry, date: yesterday }
      ];

      mockGetDocs
        .mockResolvedValueOnce({
          docs: streakStepsEntries.map((entry, i) => ({ id: `steps-${i}`, data: () => entry }))
        })
        .mockResolvedValueOnce({
          docs: streakWorkoutEntries.map((entry, i) => ({ id: `workout-${i}`, data: () => entry }))
        });

      const result = await HealthService.getActivityStats(mockUser.id, 30);

      expect(result.success).toBe(true);
      expect(result.data?.currentStepsStreak).toBeGreaterThan(0);
      expect(result.data?.currentWorkoutStreak).toBeGreaterThan(0);
    });
  });
});