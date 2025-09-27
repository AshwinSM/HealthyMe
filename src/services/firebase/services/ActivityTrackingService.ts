import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db as firestore } from '../../../config/firebase';
import { BaseFirebaseService } from '../BaseFirebaseService';
import {
  StepsEntry,
  WorkoutEntry,
  ActivityAnalysis,
  ActivityStats,
  WorkoutType,
  WorkoutIntensity,
  WorkoutTypeInfo,
  StepsGoal,
  ApiResponse
} from '../../../types/health';
import { DateNavigationUtils } from '../../../utils/dateNavigationUtils';

export class ActivityTrackingService extends BaseFirebaseService<StepsEntry | WorkoutEntry> {
  private stepsCollectionName = 'stepsEntries';
  private workoutsCollectionName = 'workoutEntries';

  constructor() {
    super('activityEntries'); // Base collection for any shared operations
  }

  // Workout type configurations with calorie burn rates
  private readonly workoutTypes: WorkoutTypeInfo[] = [
    // Cardio activities
    { type: 'cardio', name: 'Cardio', category: 'cardio', icon: '❤️', baseCaloriesPerMinute: 8, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.3 } },
    { type: 'running', name: 'Running', category: 'cardio', icon: '🏃', baseCaloriesPerMinute: 12, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.4 } },
    { type: 'walking', name: 'Walking', category: 'cardio', icon: '🚶', baseCaloriesPerMinute: 4, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.2 } },
    { type: 'cycling', name: 'Cycling', category: 'cardio', icon: '🚴', baseCaloriesPerMinute: 10, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.5 } },
    { type: 'swimming', name: 'Swimming', category: 'cardio', icon: '🏊', baseCaloriesPerMinute: 11, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },

    // Strength activities
    { type: 'strength', name: 'Strength Training', category: 'strength', icon: '💪', baseCaloriesPerMinute: 6, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'weightlifting', name: 'Weightlifting', category: 'strength', icon: '🏋️', baseCaloriesPerMinute: 7, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'bodyweight', name: 'Bodyweight Exercise', category: 'strength', icon: '🤸', baseCaloriesPerMinute: 5, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.4 } },
    { type: 'powerlifting', name: 'Powerlifting', category: 'strength', icon: '⚡', baseCaloriesPerMinute: 8, intensityMultipliers: { low: 0.9, medium: 1.0, high: 1.2 } },

    // Sports activities
    { type: 'sports', name: 'Sports', category: 'sports', icon: '⚽', baseCaloriesPerMinute: 9, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.4 } },
    { type: 'basketball', name: 'Basketball', category: 'sports', icon: '🏀', baseCaloriesPerMinute: 11, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'football', name: 'Football', category: 'sports', icon: '🏈', baseCaloriesPerMinute: 10, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.4 } },
    { type: 'tennis', name: 'Tennis', category: 'sports', icon: '🎾', baseCaloriesPerMinute: 8, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.3 } },
    { type: 'soccer', name: 'Soccer', category: 'sports', icon: '⚽', baseCaloriesPerMinute: 10, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },

    // Flexibility activities
    { type: 'flexibility', name: 'Flexibility', category: 'flexibility', icon: '🧘', baseCaloriesPerMinute: 3, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.2 } },
    { type: 'yoga', name: 'Yoga', category: 'flexibility', icon: '🧘‍♀️', baseCaloriesPerMinute: 4, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.3 } },
    { type: 'pilates', name: 'Pilates', category: 'flexibility', icon: '🤸‍♀️', baseCaloriesPerMinute: 5, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.2 } },
    { type: 'stretching', name: 'Stretching', category: 'flexibility', icon: '🤲', baseCaloriesPerMinute: 2, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.2 } },

    // Other activities
    { type: 'dance', name: 'Dance', category: 'other', icon: '💃', baseCaloriesPerMinute: 7, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.4 } },
    { type: 'martial_arts', name: 'Martial Arts', category: 'other', icon: '🥋', baseCaloriesPerMinute: 9, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'hiking', name: 'Hiking', category: 'other', icon: '🥾', baseCaloriesPerMinute: 6, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'climbing', name: 'Climbing', category: 'other', icon: '🧗', baseCaloriesPerMinute: 10, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } },
    { type: 'other', name: 'Other Activity', category: 'other', icon: '🏃‍♂️', baseCaloriesPerMinute: 6, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.2 } }
  ];

  // Default step goals and constants
  private readonly defaultStepsGoal = 10000;
  private readonly caloriesPerStep = 0.04; // Approximate calories burned per step

  /**
   * Get workout type information
   */
  getWorkoutTypes(): WorkoutTypeInfo[] {
    return this.workoutTypes;
  }

  getWorkoutTypeInfo(type: WorkoutType): WorkoutTypeInfo | undefined {
    return this.workoutTypes.find(w => w.type === type);
  }

  getWorkoutTypesByCategory(category: string): WorkoutTypeInfo[] {
    return this.workoutTypes.filter(w => w.category === category);
  }

  /**
   * Calculate calories burned from steps
   */
  calculateStepsCalories(steps: number): number {
    return Math.round(steps * this.caloriesPerStep);
  }

  /**
   * Calculate calories burned from workout
   */
  calculateWorkoutCalories(
    type: WorkoutType,
    intensity: WorkoutIntensity,
    durationMinutes: number
  ): number {
    const workoutInfo = this.getWorkoutTypeInfo(type);
    if (!workoutInfo) {
      // Fallback calculation
      const baseCalories = 6; // Generic activity
      const multiplier = intensity === 'high' ? 1.3 : intensity === 'medium' ? 1.0 : 0.7;
      return Math.round(baseCalories * multiplier * durationMinutes);
    }

    const baseCalories = workoutInfo.baseCaloriesPerMinute;
    const multiplier = workoutInfo.intensityMultipliers[intensity];
    return Math.round(baseCalories * multiplier * durationMinutes);
  }

  /**
   * Validate steps input
   */
  validateSteps(steps: number): { isValid: boolean; message?: string } {
    if (isNaN(steps) || steps < 0) {
      return { isValid: false, message: 'Please enter a valid number of steps' };
    }

    if (steps > 100000) {
      return { isValid: false, message: 'Steps cannot exceed 100,000 per day' };
    }

    return { isValid: true };
  }

  /**
   * Validate workout duration
   */
  validateWorkoutDuration(duration: number): { isValid: boolean; message?: string } {
    if (isNaN(duration) || duration <= 0) {
      return { isValid: false, message: 'Please enter a valid duration' };
    }

    if (duration > 480) { // 8 hours
      return { isValid: false, message: 'Workout duration cannot exceed 8 hours' };
    }

    return { isValid: true };
  }

  /**
   * Create steps entry
   */
  async createStepsEntry(
    userId: string,
    steps: number,
    date: string,
    goal?: number,
    notes?: string
  ): Promise<ApiResponse<StepsEntry>> {
    try {
      // Validate steps
      const validation = this.validateSteps(steps);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'INVALID_STEPS',
          message: validation.message || 'Invalid steps value',
          timestamp: Timestamp.now()
        };
      }

      // Validate date
      if (!DateNavigationUtils.isValidDateString(date)) {
        return {
          success: false,
          error: 'INVALID_DATE',
          message: 'Please select a valid date',
          timestamp: Timestamp.now()
        };
      }

      if (DateNavigationUtils.isFutureDate(date)) {
        return {
          success: false,
          error: 'FUTURE_DATE',
          message: 'Cannot log steps for future dates',
          timestamp: Timestamp.now()
        };
      }

      // Check for existing entry on same date
      const existingEntry = await this.getStepsForDate(userId, date);
      if (existingEntry.success && existingEntry.data) {
        return {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: 'Steps entry already exists for this date',
          timestamp: Timestamp.now()
        };
      }

      const caloriesBurned = this.calculateStepsCalories(steps);
      const stepsGoal = goal || this.defaultStepsGoal;

      const id = `${userId}_${date}_steps`;
      const stepsEntry: StepsEntry = {
        id,
        userId,
        date,
        steps,
        caloriesBurned,
        goal: stepsGoal,
        source: 'manual',
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        notes: notes?.trim() || undefined
      };

      const docRef = doc(firestore, this.stepsCollectionName, id);
      await setDoc(docRef, stepsEntry);

      return {
        success: true,
        data: stepsEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Steps entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to save steps entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Create workout entry
   */
  async createWorkoutEntry(
    userId: string,
    type: WorkoutType,
    name: string,
    duration: number,
    intensity: WorkoutIntensity,
    date: string,
    options?: {
      distance?: number;
      sets?: number;
      reps?: number;
      weight?: number;
      notes?: string;
    }
  ): Promise<ApiResponse<WorkoutEntry>> {
    try {
      // Validate duration
      const validation = this.validateWorkoutDuration(duration);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'INVALID_DURATION',
          message: validation.message || 'Invalid workout duration',
          timestamp: Timestamp.now()
        };
      }

      // Validate date
      if (!DateNavigationUtils.isValidDateString(date)) {
        return {
          success: false,
          error: 'INVALID_DATE',
          message: 'Please select a valid date',
          timestamp: Timestamp.now()
        };
      }

      if (DateNavigationUtils.isFutureDate(date)) {
        return {
          success: false,
          error: 'FUTURE_DATE',
          message: 'Cannot log workouts for future dates',
          timestamp: Timestamp.now()
        };
      }

      const caloriesBurned = this.calculateWorkoutCalories(type, intensity, duration);

      const id = `${userId}_${date}_${Date.now()}`;
      const workoutEntry: WorkoutEntry = {
        id,
        userId,
        date,
        type,
        name: name.trim(),
        duration,
        intensity,
        caloriesBurned,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        ...options,
        notes: options?.notes?.trim() || undefined
      };

      const docRef = doc(firestore, this.workoutsCollectionName, id);
      await setDoc(docRef, workoutEntry);

      return {
        success: true,
        data: workoutEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Workout entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to save workout entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get steps entry for a specific date
   */
  async getStepsForDate(userId: string, date: string): Promise<ApiResponse<StepsEntry>> {
    try {
      const id = `${userId}_${date}_steps`;
      const docRef = doc(firestore, this.stepsCollectionName, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return {
          success: true,
          data: null,
          timestamp: Timestamp.now()
        };
      }

      return {
        success: true,
        data: snapshot.data() as StepsEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load steps entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get workout entries for a specific date
   */
  async getWorkoutsForDate(userId: string, date: string): Promise<ApiResponse<WorkoutEntry[]>> {
    try {
      const q = query(
        collection(firestore, this.workoutsCollectionName),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => doc.data() as WorkoutEntry);

      return {
        success: true,
        data: entries,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load workout entries',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get comprehensive activity analysis for a date
   */
  async analyzeActivityForDate(
    userId: string,
    date: string,
    stepsGoal: number = this.defaultStepsGoal
  ): Promise<ApiResponse<ActivityAnalysis>> {
    try {
      const [stepsResult, workoutsResult] = await Promise.all([
        this.getStepsForDate(userId, date),
        this.getWorkoutsForDate(userId, date)
      ]);

      const stepsEntry = stepsResult.success ? stepsResult.data : null;
      const workoutEntries = workoutsResult.success ? workoutsResult.data || [] : [];

      // Steps analysis
      const totalSteps = stepsEntry?.steps || 0;
      const stepsGoalAchieved = totalSteps >= stepsGoal;
      const stepsCaloriesBurned = stepsEntry?.caloriesBurned || 0;
      const stepsProgress = Math.round((totalSteps / stepsGoal) * 100);

      // Workout analysis
      const totalWorkouts = workoutEntries.length;
      const totalWorkoutDuration = workoutEntries.reduce((sum, w) => sum + w.duration, 0);
      const workoutCaloriesBurned = workoutEntries.reduce((sum, w) => sum + w.caloriesBurned, 0);

      const workoutsByType: Record<WorkoutType, number> = {} as Record<WorkoutType, number>;
      workoutEntries.forEach(workout => {
        workoutsByType[workout.type] = (workoutsByType[workout.type] || 0) + 1;
      });

      const avgWorkoutDuration = totalWorkouts > 0 ? Math.round(totalWorkoutDuration / totalWorkouts) : 0;

      // Combined analysis
      const totalCaloriesBurned = stepsCaloriesBurned + workoutCaloriesBurned;
      const totalActiveMinutes = totalWorkoutDuration; // Steps don't count as active minutes in this calculation
      const activityScore = this.calculateActivityScore(totalSteps, stepsGoal, totalWorkoutDuration);

      // Calculate streaks (simplified - would need historical data for full implementation)
      const streaks = {
        stepsGoalDays: stepsGoalAchieved ? 1 : 0,
        workoutDays: totalWorkouts > 0 ? 1 : 0,
        activeMinutesDays: totalActiveMinutes >= 30 ? 1 : 0 // 30+ minutes considered active day
      };

      const analysis: ActivityAnalysis = {
        date,
        stepsEntry: stepsEntry || undefined,
        workoutEntries,
        totalSteps,
        stepsGoal,
        stepsGoalAchieved,
        stepsCaloriesBurned,
        stepsProgress,
        totalWorkouts,
        totalWorkoutDuration,
        workoutCaloriesBurned,
        workoutsByType,
        avgWorkoutDuration,
        totalCaloriesBurned,
        totalActiveMinutes,
        activityScore,
        streaks
      };

      return {
        success: true,
        data: analysis,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to analyze activity data',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Calculate activity score (0-100)
   */
  private calculateActivityScore(steps: number, stepsGoal: number, workoutMinutes: number): number {
    const stepsScore = Math.min((steps / stepsGoal) * 60, 60); // Max 60 points for steps
    const workoutScore = Math.min((workoutMinutes / 30) * 40, 40); // Max 40 points for 30+ minutes workout
    return Math.round(stepsScore + workoutScore);
  }

  /**
   * Update steps entry
   */
  async updateStepsEntry(
    id: string,
    updates: Partial<Omit<StepsEntry, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ApiResponse<StepsEntry>> {
    try {
      const docRef = doc(firestore, this.stepsCollectionName, id);

      // Recalculate calories if steps changed
      if (updates.steps) {
        updates.caloriesBurned = this.calculateStepsCalories(updates.steps);
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatedData);

      // Fetch updated entry
      const snapshot = await getDoc(docRef);
      const updatedEntry = snapshot.data() as StepsEntry;

      return {
        success: true,
        data: updatedEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update steps entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update workout entry
   */
  async updateWorkoutEntry(
    id: string,
    updates: Partial<Omit<WorkoutEntry, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ApiResponse<WorkoutEntry>> {
    try {
      const docRef = doc(firestore, this.workoutsCollectionName, id);

      // Recalculate calories if relevant fields changed
      if (updates.type && updates.intensity && updates.duration) {
        updates.caloriesBurned = this.calculateWorkoutCalories(updates.type, updates.intensity, updates.duration);
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatedData);

      // Fetch updated entry
      const snapshot = await getDoc(docRef);
      const updatedEntry = snapshot.data() as WorkoutEntry;

      return {
        success: true,
        data: updatedEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update workout entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Delete steps entry
   */
  async deleteStepsEntry(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, this.stepsCollectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete steps entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Delete workout entry
   */
  async deleteWorkoutEntry(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, this.workoutsCollectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete workout entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get activity statistics for a user
   */
  async getActivityStats(userId: string): Promise<ApiResponse<ActivityStats>> {
    try {
      // This would need to aggregate data across multiple days
      // For now, return a simplified implementation
      const stats: ActivityStats = {
        totalDays: 0,
        totalSteps: 0,
        averageSteps: 0,
        stepsGoalAchievementRate: 0,
        bestStepsDay: { date: '', steps: 0 },
        totalWorkouts: 0,
        totalWorkoutMinutes: 0,
        averageWorkoutsPerDay: 0,
        favoriteWorkoutType: 'cardio',
        longestWorkout: { date: '', duration: 0, type: 'cardio' },
        totalCaloriesBurned: 0,
        averageCaloriesPerDay: 0,
        bestCalorieDay: { date: '', calories: 0 },
        currentStepsStreak: 0,
        longestStepsStreak: 0,
        currentWorkoutStreak: 0,
        longestWorkoutStreak: 0
      };

      return {
        success: true,
        data: stats,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to calculate activity statistics',
        timestamp: Timestamp.now()
      };
    }
  }
}

// Export singleton instance
export const activityTrackingService = new ActivityTrackingService();