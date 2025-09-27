import { UserProfileService } from '../services/UserProfileService';
import { UserProfile, HealthGoals, UserPreferences } from '../../../types';
import { Timestamp } from 'firebase/firestore';

// Mock the base service
jest.mock('../base/BaseFirebaseService');
jest.mock('firebase/firestore');
jest.mock('../../../config', () => ({ db: {} }));

describe('UserProfileService', () => {
  let service: UserProfileService;
  let mockCreate: jest.Mock;
  let mockGetById: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    service = new UserProfileService();
    
    // Mock the base class methods
    mockCreate = jest.fn();
    mockGetById = jest.fn();
    mockUpdate = jest.fn();
    
    (service as any).create = mockCreate;
    (service as any).getById = mockGetById;
    (service as any).update = mockUpdate;
    
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user profile with default preferences and goals', async () => {
      const userData = {
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const expectedProfile = {
        ...userData,
        id: expect.any(String),
        createdAt: expect.any(Object),
        lastLoginAt: expect.any(Object),
        preferences: expect.any(Object),
        goals: expect.any(Object)
      };

      mockCreate.mockResolvedValueOnce({
        success: true,
        data: expectedProfile,
        timestamp: Timestamp.now()
      });

      const result = await service.create(userData);

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
          preferences: expect.objectContaining({
            units: expect.objectContaining({
              weight: 'kg',
              height: 'cm',
              liquid: 'ml'
            }),
            notifications: expect.any(Object),
            privacy: expect.any(Object)
          }),
          goals: expect.objectContaining({
            calories: 2000,
            macros: expect.any(Object),
            water: 2000,
            activity: expect.any(Object)
          })
        })
      );
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'invalid-email',
        displayName: 'Test User'
      };

      const error = new Error('Invalid email');
      (error as any).code = 'invalid-email';
      mockCreate.mockRejectedValueOnce(error);

      const result = await service.create(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid-email');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp successfully', async () => {
      mockUpdate.mockResolvedValueOnce({
        success: true,
        data: { id: 'user123' },
        timestamp: Timestamp.now()
      });

      const result = await service.updateLastLogin('user123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith('user123', {
        lastLoginAt: expect.any(Object)
      });
    });

    it('should handle update errors', async () => {
      mockUpdate.mockResolvedValueOnce({
        success: false,
        error: 'User not found'
      });

      const result = await service.updateLastLogin('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update last login');
    });
  });

  describe('updateGoals', () => {
    it('should update health goals successfully', async () => {
      const currentProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        goals: {
          calories: 2000,
          macros: {
            protein: 150,
            carbohydrates: 250,
            fats: 67,
            fiber: 25
          },
          water: 2000,
          activity: {
            steps: 10000,
            workoutsPerWeek: 3,
            activeMinutes: 30
          }
        },
        preferences: {
          units: { weight: 'kg', height: 'cm', liquid: 'ml' },
          notifications: {
            mealReminders: true,
            waterReminders: true,
            goalAchievements: true,
            dailySummary: false
          },
          privacy: { dataSharing: false, analytics: true }
        },
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };

      const updatedGoals: Partial<HealthGoals> = {
        calories: 2200,
        water: 2500
      };

      mockGetById.mockResolvedValueOnce({
        success: true,
        data: currentProfile
      });

      mockUpdate.mockResolvedValueOnce({
        success: true,
        data: { ...currentProfile, goals: { ...currentProfile.goals, ...updatedGoals } }
      });

      const result = await service.updateGoals('user123', updatedGoals);

      expect(result.success).toBe(true);
      expect(mockGetById).toHaveBeenCalledWith('user123');
      expect(mockUpdate).toHaveBeenCalledWith('user123', {
        goals: expect.objectContaining({
          calories: 2200,
          water: 2500,
          macros: currentProfile.goals.macros,
          activity: currentProfile.goals.activity
        })
      });
    });

    it('should fail when user profile not found', async () => {
      mockGetById.mockResolvedValueOnce({
        success: false,
        error: 'User not found'
      });

      const result = await service.updateGoals('nonexistent', { calories: 2200 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences successfully', async () => {
      const currentProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        goals: {
          calories: 2000,
          macros: { protein: 150, carbohydrates: 250, fats: 67, fiber: 25 },
          water: 2000,
          activity: { steps: 10000, workoutsPerWeek: 3, activeMinutes: 30 }
        },
        preferences: {
          units: { weight: 'kg', height: 'cm', liquid: 'ml' },
          notifications: {
            mealReminders: true,
            waterReminders: true,
            goalAchievements: true,
            dailySummary: false
          },
          privacy: { dataSharing: false, analytics: true }
        },
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };

      const updatedPreferences: Partial<UserPreferences> = {
        units: { weight: 'lbs', height: 'ft', liquid: 'fl_oz' },
        notifications: {
          mealReminders: false,
          waterReminders: true,
          goalAchievements: true,
          dailySummary: true
        }
      };

      mockGetById.mockResolvedValueOnce({
        success: true,
        data: currentProfile
      });

      mockUpdate.mockResolvedValueOnce({
        success: true,
        data: { ...currentProfile, preferences: { ...currentProfile.preferences, ...updatedPreferences } }
      });

      const result = await service.updatePreferences('user123', updatedPreferences);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith('user123', {
        preferences: expect.objectContaining({
          units: { weight: 'lbs', height: 'ft', liquid: 'fl_oz' },
          notifications: {
            mealReminders: false,
            waterReminders: true,
            goalAchievements: true,
            dailySummary: true
          },
          privacy: currentProfile.preferences.privacy
        })
      });
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI when height is available', async () => {
      const userProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        height: 175, // cm
        goals: {
          calories: 2000,
          macros: { protein: 150, carbohydrates: 250, fats: 67, fiber: 25 },
          water: 2000,
          activity: { steps: 10000, workoutsPerWeek: 3, activeMinutes: 30 }
        },
        preferences: {
          units: { weight: 'kg', height: 'cm', liquid: 'ml' },
          notifications: {
            mealReminders: true,
            waterReminders: true,
            goalAchievements: true,
            dailySummary: false
          },
          privacy: { dataSharing: false, analytics: true }
        },
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };

      mockGetById.mockResolvedValueOnce({
        success: true,
        data: userProfile
      });

      const bmi = await service.calculateBMI('user123', 70); // kg

      // BMI = 70 / (1.75 * 1.75) = 22.9
      expect(bmi).toBeCloseTo(22.9, 1);
    });

    it('should return undefined when height is not available', async () => {
      const userProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        // height not specified
        goals: {
          calories: 2000,
          macros: { protein: 150, carbohydrates: 250, fats: 67, fiber: 25 },
          water: 2000,
          activity: { steps: 10000, workoutsPerWeek: 3, activeMinutes: 30 }
        },
        preferences: {
          units: { weight: 'kg', height: 'cm', liquid: 'ml' },
          notifications: {
            mealReminders: true,
            waterReminders: true,
            goalAchievements: true,
            dailySummary: false
          },
          privacy: { dataSharing: false, analytics: true }
        },
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };

      mockGetById.mockResolvedValueOnce({
        success: true,
        data: userProfile
      });

      const bmi = await service.calculateBMI('user123', 70);

      expect(bmi).toBeUndefined();
    });

    it('should return undefined when user not found', async () => {
      mockGetById.mockResolvedValueOnce({
        success: false,
        error: 'User not found'
      });

      const bmi = await service.calculateBMI('nonexistent', 70);

      expect(bmi).toBeUndefined();
    });
  });
});