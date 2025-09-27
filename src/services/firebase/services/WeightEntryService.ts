import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';
import { BaseFirebaseService, QueryFilter } from '../base/BaseFirebaseService';
import { WeightEntry, ApiResponse } from '../../../types';
import { userProfileService } from './UserProfileService';

// Firestore converter for WeightEntry
const weightEntryConverter: FirestoreDataConverter<WeightEntry> = {
  toFirestore: (weightEntry: WeightEntry) => {
    return {
      id: weightEntry.id,
      userId: weightEntry.userId,
      weight: weightEntry.weight,
      unit: weightEntry.unit,
      bmi: weightEntry.bmi,
      date: weightEntry.date,
      notes: weightEntry.notes,
      createdAt: weightEntry.createdAt
    };
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: data.id,
      userId: data.userId,
      weight: data.weight,
      unit: data.unit,
      bmi: data.bmi,
      date: data.date,
      notes: data.notes,
      createdAt: data.createdAt
    } as WeightEntry;
  }
};

/**
 * Service for managing weight entries in Firestore
 * Handles weight tracking, BMI calculation, and trend analysis
 */
export class WeightEntryService extends BaseFirebaseService<WeightEntry> {
  constructor() {
    super('weightEntries', weightEntryConverter);
  }

  /**
   * Create a new weight entry with BMI calculation
   */
  async create(weightData: Omit<WeightEntry, 'id' | 'createdAt'>): Promise<ApiResponse<WeightEntry>> {
    try {
      const now = Timestamp.now();
      const id = this.generateWeightEntryId(weightData.userId, weightData.date);
      
      // Calculate BMI if user has height in profile
      const bmi = await this.calculateBMI(weightData.userId, weightData.weight);
      
      const weightEntry: WeightEntry = {
        ...weightData,
        id,
        bmi,
        createdAt: now
      };

      return super.create(weightEntry as any);
    } catch (error: any) {
      console.error('Weight entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to log weight entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get weight entries for a date range
   */
  async getWeightTrend(userId: string, days: number = 30): Promise<ApiResponse<WeightEntry[]>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'date', operator: '>=', value: this.formatDate(startDate) },
        { field: 'date', operator: '<=', value: this.formatDate(endDate) }
      ];

      return this.query(filters, 'date', 'asc');
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to retrieve weight trend data',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get latest weight entry for a user
   */
  async getLatestWeight(userId: string): Promise<ApiResponse<WeightEntry | null>> {
    try {
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId }
      ];

      const result = await this.query(filters, 'date', 'desc');
      
      if (result.success && result.data && result.data.length > 0) {
        return {
          success: true,
          data: result.data[0],
          message: 'Latest weight entry retrieved',
          timestamp: Timestamp.now()
        };
      } else {
        return {
          success: true,
          data: null,
          message: 'No weight entries found',
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to get latest weight entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get weight entry for a specific date
   */
  async getWeightForDate(userId: string, date: string): Promise<ApiResponse<WeightEntry | null>> {
    try {
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'date', operator: '==', value: date }
      ];

      const result = await this.query(filters);
      
      if (result.success && result.data && result.data.length > 0) {
        return {
          success: true,
          data: result.data[0], // Should only be one entry per date
          message: 'Weight entry for date retrieved',
          timestamp: Timestamp.now()
        };
      } else {
        return {
          success: true,
          data: null,
          message: 'No weight entry found for date',
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to get weight entry for date',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Calculate weight progress towards goal
   */
  async calculateWeightProgress(userId: string): Promise<ApiResponse<{
    currentWeight: number;
    targetWeight?: number;
    progressKg: number;
    progressPercentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>> {
    try {
      // Get user's weight goal
      const userProfile = await userProfileService.getById(userId);
      if (!userProfile.success) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: Timestamp.now()
        };
      }

      // Get latest weight
      const latestWeight = await this.getLatestWeight(userId);
      if (!latestWeight.success || !latestWeight.data) {
        return {
          success: false,
          error: 'NO_WEIGHT_DATA',
          message: 'No weight data available',
          timestamp: Timestamp.now()
        };
      }

      // Get weight trend (last 30 days)
      const trendData = await this.getWeightTrend(userId, 30);
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (trendData.success && trendData.data && trendData.data.length >= 2) {
        const firstWeight = trendData.data[0].weight;
        const lastWeight = trendData.data[trendData.data.length - 1].weight;
        const weightDiff = lastWeight - firstWeight;
        
        if (Math.abs(weightDiff) < 0.5) {
          trend = 'stable';
        } else if (weightDiff > 0) {
          trend = 'increasing';
        } else {
          trend = 'decreasing';
        }
      }

      const currentWeight = latestWeight.data.weight;
      const targetWeight = userProfile.data?.goals?.weight?.target;
      
      let progressKg = 0;
      let progressPercentage = 0;
      
      if (targetWeight) {
        // Assume initial weight was the first recorded weight
        if (trendData.success && trendData.data && trendData.data.length > 0) {
          const initialWeight = trendData.data[0].weight;
          const totalWeightToLose = initialWeight - targetWeight;
          const weightLostSoFar = initialWeight - currentWeight;
          
          progressKg = weightLostSoFar;
          progressPercentage = totalWeightToLose !== 0 ? 
            Math.round((weightLostSoFar / totalWeightToLose) * 100) : 0;
        }
      }

      return {
        success: true,
        data: {
          currentWeight,
          targetWeight,
          progressKg,
          progressPercentage,
          trend
        },
        message: 'Weight progress calculated successfully',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to calculate weight progress',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Calculate BMI for user
   */
  private async calculateBMI(userId: string, weight: number): Promise<number | undefined> {
    try {
      return await userProfileService.calculateBMI(userId, weight);
    } catch (error) {
      console.warn('BMI calculation failed:', error);
      return undefined;
    }
  }

  /**
   * Generate unique weight entry ID
   */
  protected generateWeightEntryId(userId: string, date: string): string {
    // One weight entry per user per date
    return `${userId}_${date}_weight`;
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate weight entry data
   */
  protected validateData(data: WeightEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.date || !this.isValidDate(data.date)) {
      errors.push('Valid date is required (YYYY-MM-DD format)');
    }

    if (!data.weight || data.weight <= 0) {
      errors.push('Weight must be greater than 0');
    }

    if (data.weight > 1000) {
      errors.push('Weight must be less than 1000kg');
    }

    if (!data.unit || (data.unit !== 'kg' && data.unit !== 'lbs')) {
      errors.push('Unit must be kg or lbs');
    }

    // BMI validation if provided
    if (data.bmi && (data.bmi < 10 || data.bmi > 100)) {
      errors.push('BMI must be between 10 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
}

export const weightEntryService = new WeightEntryService();