import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';
import { BaseFirebaseService } from '../base/BaseFirebaseService';
import { UserProfile, ApiResponse, HealthGoals, UserPreferences } from '../../../types';

// Firestore converter for UserProfile
const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore: (userProfile: UserProfile) => {
    return {
      id: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      dateOfBirth: userProfile.dateOfBirth,
      height: userProfile.height,
      gender: userProfile.gender,
      activityLevel: userProfile.activityLevel,
      createdAt: userProfile.createdAt,
      lastLoginAt: userProfile.lastLoginAt,
      preferences: userProfile.preferences,
      goals: userProfile.goals
    };
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      dateOfBirth: data.dateOfBirth,
      height: data.height,
      gender: data.gender,
      activityLevel: data.activityLevel,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
      preferences: data.preferences || {},
      goals: data.goals || {}
    } as UserProfile;
  }
};

/**
 * Service for managing user profiles in Firestore
 * Handles user data, preferences, and health goals
 */
export class UserProfileService extends BaseFirebaseService<UserProfile> {
  constructor() {
    super('users', userProfileConverter);
  }

  /**
   * Create a new user profile
   */
  async create(userData: Omit<UserProfile, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<ApiResponse<UserProfile>> {
    try {
      const now = Timestamp.now();
      
      // Generate user ID (typically from Firebase Auth UID)
      const userId = this.generateUserId(userData);
      
      const userProfile: UserProfile = {
        ...userData,
        id: userId,
        createdAt: now,
        lastLoginAt: now,
        // Set defaults if not provided
        preferences: userData.preferences || this.getDefaultPreferences(),
        goals: userData.goals || this.getDefaultGoals()
      };

      return super.create(userProfile as any);
    } catch (error: any) {
      console.error('UserProfile creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to create user profile',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.update(userId, { 
        lastLoginAt: Timestamp.now() 
      } as any);
      
      return {
        success: result.success,
        data: result.success,
        error: result.error,
        message: result.success ? 'Last login updated' : 'Failed to update last login',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to update login timestamp',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update user's health goals
   */
  async updateGoals(userId: string, goals: Partial<HealthGoals>): Promise<ApiResponse<boolean>> {
    try {
      // Get current profile to merge goals
      const currentProfile = await this.getById(userId);
      
      if (!currentProfile.success) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: Timestamp.now()
        };
      }

      const updatedGoals = {
        ...currentProfile.data!.goals,
        ...goals
      };

      const result = await this.update(userId, { 
        goals: updatedGoals 
      } as any);

      return {
        success: result.success,
        data: result.success,
        error: result.error,
        message: result.success ? 'Health goals updated' : 'Failed to update health goals',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to update health goals',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update user's preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<ApiResponse<boolean>> {
    try {
      // Get current profile to merge preferences
      const currentProfile = await this.getById(userId);
      
      if (!currentProfile.success) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: Timestamp.now()
        };
      }

      const updatedPreferences = {
        ...currentProfile.data!.preferences,
        ...preferences
      };

      const result = await this.update(userId, { 
        preferences: updatedPreferences 
      } as any);

      return {
        success: result.success,
        data: result.success,
        error: result.error,
        message: result.success ? 'User preferences updated' : 'Failed to update preferences',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to update user preferences',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get user's BMI if height is available
   */
  async calculateBMI(userId: string, weight: number): Promise<number | undefined> {
    try {
      const userResponse = await this.getById(userId);
      
      if (userResponse.success && userResponse.data?.height) {
        const heightInMeters = userResponse.data.height / 100; // Convert cm to meters
        return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
      }
    } catch (error) {
      console.warn('BMI calculation failed:', error);
    }
    return undefined;
  }

  /**
   * Generate user ID (typically from Firebase Auth UID)
   */
  private generateUserId(userData: any): string {
    // In real implementation, this would be Firebase Auth UID
    // For now, generate a unique ID
    return userData.email ? 
      `user_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}` :
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      units: {
        weight: 'kg',
        height: 'cm',
        liquid: 'ml'
      },
      notifications: {
        mealReminders: true,
        waterReminders: true,
        goalAchievements: true,
        dailySummary: false
      },
      privacy: {
        dataSharing: false,
        analytics: true
      }
    };
  }

  /**
   * Get default health goals
   */
  private getDefaultGoals(): HealthGoals {
    return {
      calories: 2000,
      macros: {
        protein: 150, // grams
        carbohydrates: 250, // grams  
        fats: 67, // grams
        fiber: 25 // grams
      },
      water: 2000, // ml per day
      activity: {
        steps: 10000,
        workoutsPerWeek: 3,
        activeMinutes: 30
      }
    };
  }

  /**
   * Validate user profile data
   */
  protected validateData(data: UserProfile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!data.id) {
      errors.push('User ID is required');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email address is required');
    }

    // Age validation if date of birth provided
    if (data.dateOfBirth && !this.isValidAge(data.dateOfBirth)) {
      errors.push('Invalid date of birth');
    }

    // Height validation if provided
    if (data.height && (data.height < 50 || data.height > 300)) {
      errors.push('Height must be between 50cm and 300cm');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate age (must be between 13 and 120 years old)
   */
  private isValidAge(dateOfBirth: string): boolean {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    return age >= 13 && age <= 120;
  }
}

export const userProfileService = new UserProfileService();