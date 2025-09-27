import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';
import { BaseFirebaseService, QueryFilter } from '../base/BaseFirebaseService';
import { ActivityEntry, ActivityType, ActivityIntensity, ApiResponse } from '../../../types';

// Firestore converter for ActivityEntry
const activityEntryConverter: FirestoreDataConverter<ActivityEntry> = {
  toFirestore: (activityEntry: ActivityEntry) => {
    return {
      id: activityEntry.id,
      userId: activityEntry.userId,
      type: activityEntry.type,
      name: activityEntry.name,
      duration: activityEntry.duration,
      intensity: activityEntry.intensity,
      caloriesBurned: activityEntry.caloriesBurned,
      notes: activityEntry.notes,
      date: activityEntry.date,
      createdAt: activityEntry.createdAt
    };
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: data.id,
      userId: data.userId,
      type: data.type,
      name: data.name,
      duration: data.duration,
      intensity: data.intensity,
      caloriesBurned: data.caloriesBurned,
      notes: data.notes,
      date: data.date,
      createdAt: data.createdAt
    } as ActivityEntry;
  }
};

/**
 * Service for managing activity/workout entries in Firestore
 */
export class ActivityEntryService extends BaseFirebaseService<ActivityEntry> {
  constructor() {
    super('activityEntries', activityEntryConverter);
  }

  /**
   * Get activities for a specific date
   */
  async getActivitiesForDate(userId: string, date: string): Promise<ApiResponse<ActivityEntry[]>> {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date }
    ];

    return this.query(filters, 'createdAt', 'desc');
  }

  /**
   * Calculate total activity metrics for a date
   */
  async calculateDailyActivityMetrics(userId: string, date: string): Promise<ApiResponse<{
    totalDuration: number;
    totalCaloriesBurned: number;
    activitiesCount: number;
    byType: Record<ActivityType, { duration: number; calories: number; count: number }>;
  }>> {
    try {
      const activitiesResponse = await this.getActivitiesForDate(userId, date);
      
      if (!activitiesResponse.success) {
        return activitiesResponse as any;
      }

      const activities = activitiesResponse.data || [];
      let totalDuration = 0;
      let totalCaloriesBurned = 0;
      const byType: Record<ActivityType, { duration: number; calories: number; count: number }> = {
        cardio: { duration: 0, calories: 0, count: 0 },
        strength: { duration: 0, calories: 0, count: 0 },
        sports: { duration: 0, calories: 0, count: 0 },
        flexibility: { duration: 0, calories: 0, count: 0 },
        other: { duration: 0, calories: 0, count: 0 }
      };

      activities.forEach(activity => {
        totalDuration += activity.duration;
        totalCaloriesBurned += activity.caloriesBurned;
        
        byType[activity.type].duration += activity.duration;
        byType[activity.type].calories += activity.caloriesBurned;
        byType[activity.type].count += 1;
      });

      return {
        success: true,
        data: {
          totalDuration,
          totalCaloriesBurned,
          activitiesCount: activities.length,
          byType
        },
        message: 'Daily activity metrics calculated',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to calculate daily activity metrics',
        timestamp: Timestamp.now()
      };
    }
  }

  protected validateData(data: ActivityEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) errors.push('User ID is required');
    if (!data.name?.trim()) errors.push('Activity name is required');
    if (!data.type || !['cardio', 'strength', 'sports', 'flexibility', 'other'].includes(data.type)) {
      errors.push('Valid activity type is required');
    }
    if (!data.duration || data.duration <= 0) errors.push('Duration must be greater than 0');
    if (!data.intensity || !['low', 'medium', 'high'].includes(data.intensity)) {
      errors.push('Valid intensity is required');
    }
    if (data.caloriesBurned < 0) errors.push('Calories burned cannot be negative');
    if (!data.date) errors.push('Date is required');

    return { isValid: errors.length === 0, errors };
  }
}

export const activityEntryService = new ActivityEntryService();