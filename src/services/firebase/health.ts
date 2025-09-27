import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  WeightEntry,
  WaterEntry,
  StepsEntry,
  WorkoutEntry,
  DailyHealthSummary,
  DailyActivitySummary,
  ActivityGoals,
  ActivityStats,
  StepsSource,
  WorkoutType,
  WorkoutIntensity,
  AddWeightForm,
  AddWaterForm,
  AddWorkoutForm,
  ApiResponse
} from '../../types';

export class HealthService {
  private static readonly COLLECTIONS = {
    WEIGHT: 'weight_entries',
    WATER: 'water_entries',
    STEPS: 'steps_entries',
    WORKOUTS: 'workout_entries'
  };

  // Weight Tracking Methods
  static async addWeightEntry(
    userId: string, 
    date: string, 
    formData: AddWeightForm
  ): Promise<ApiResponse<WeightEntry>> {
    try {
      const weightEntry: Omit<WeightEntry, 'id'> = {
        userId,
        date,
        weight: formData.weight,
        unit: formData.unit,
        createdAt: Timestamp.now(),
        notes: formData.notes,
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.WEIGHT), weightEntry);
      
      const newEntry: WeightEntry = {
        id: docRef.id,
        ...weightEntry
      };

      return {
        success: true,
        data: newEntry,
        message: 'Weight entry added successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add weight entry'
      };
    }
  }

  static async getWeightEntries(userId: string, limitCount: number = 30): Promise<ApiResponse<WeightEntry[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.WEIGHT),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: WeightEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as WeightEntry);
      });

      return {
        success: true,
        data: entries,
        message: `Found ${entries.length} weight entries`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get weight entries'
      };
    }
  }

  // Water Tracking Methods
  static async addWaterEntry(
    userId: string, 
    date: string, 
    formData: AddWaterForm
  ): Promise<ApiResponse<WaterEntry>> {
    try {
      const waterEntry: Omit<WaterEntry, 'id'> = {
        userId,
        date,
        amount: formData.amount,
        createdAt: Timestamp.now(),
        notes: formData.notes,
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.WATER), waterEntry);
      
      const newEntry: WaterEntry = {
        id: docRef.id,
        ...waterEntry
      };

      return {
        success: true,
        data: newEntry,
        message: 'Water entry added successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add water entry'
      };
    }
  }

  static async getWaterEntriesByDate(userId: string, date: string): Promise<ApiResponse<WaterEntry[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.WATER),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const entries: WaterEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as WaterEntry);
      });

      return {
        success: true,
        data: entries,
        message: `Found ${entries.length} water entries for ${date}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get water entries'
      };
    }
  }

  // Steps Tracking Methods
  static async addStepsEntry(
    userId: string,
    date: string,
    steps: number,
    source: StepsSource = 'manual',
    dailyGoal: number = 10000
  ): Promise<ApiResponse<StepsEntry>> {
    try {
      // Validate steps range
      if (steps < 0 || steps > 100000) {
        return {
          success: false,
          error: 'INVALID_STEPS_RANGE',
          message: 'Steps must be between 0 and 100,000'
        };
      }

      // Check for existing entry for the date
      const existingResult = await this.getStepsEntryByDate(userId, date);
      if (existingResult.success && existingResult.data) {
        // Update existing entry
        return await this.updateStepsEntry(existingResult.data.id, steps, source, dailyGoal);
      }

      // Calculate calories burned (approximately 0.04 calories per step)
      const caloriesBurned = Math.round(steps * 0.04);

      const goalProgress = {
        dailyGoal,
        achieved: steps >= dailyGoal,
        percentage: Math.round((steps / dailyGoal) * 100)
      };

      const stepsEntry: Omit<StepsEntry, 'id'> = {
        userId,
        steps,
        date,
        source,
        caloriesBurned,
        goalProgress,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.STEPS), stepsEntry);

      const newEntry: StepsEntry = {
        id: docRef.id,
        ...stepsEntry
      };

      return {
        success: true,
        data: newEntry,
        message: 'Steps entry added successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add steps entry'
      };
    }
  }

  static async getStepsEntryByDate(userId: string, date: string): Promise<ApiResponse<StepsEntry | null>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.STEPS),
        where('userId', '==', userId),
        where('date', '==', date),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      const entry = querySnapshot.docs[0]?.data() as StepsEntry;

      if (entry) {
        return {
          success: true,
          data: { id: querySnapshot.docs[0].id, ...entry },
          message: 'Steps entry found'
        };
      }

      return {
        success: true,
        data: null,
        message: 'No steps entry found for this date'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get steps entry'
      };
    }
  }

  static async updateStepsEntry(
    entryId: string,
    steps: number,
    source?: StepsSource,
    dailyGoal?: number
  ): Promise<ApiResponse<StepsEntry>> {
    try {
      const updateData: any = {
        steps,
        updatedAt: Timestamp.now()
      };

      if (source) updateData.source = source;
      if (dailyGoal) {
        updateData.goalProgress = {
          dailyGoal,
          achieved: steps >= dailyGoal,
          percentage: Math.round((steps / dailyGoal) * 100)
        };
      }

      // Recalculate calories
      updateData.caloriesBurned = Math.round(steps * 0.04);

      await updateDoc(doc(db, this.COLLECTIONS.STEPS, entryId), updateData);

      // Fetch updated entry
      const updatedDoc = await getDocs(query(
        collection(db, this.COLLECTIONS.STEPS),
        where('__name__', '==', entryId)
      ));

      const updatedEntry = updatedDoc.docs[0]?.data() as StepsEntry;

      return {
        success: true,
        data: { id: entryId, ...updatedEntry },
        message: 'Steps entry updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update steps entry'
      };
    }
  }

  static async getStepsEntriesByDate(userId: string, date: string): Promise<ApiResponse<StepsEntry[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.STEPS),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const entries: StepsEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as StepsEntry);
      });

      return {
        success: true,
        data: entries,
        message: `Found ${entries.length} steps entries for ${date}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get steps entries'
      };
    }
  }

  // Workout Tracking Methods
  static async addWorkoutEntry(
    userId: string,
    date: string,
    workoutData: {
      type: WorkoutType;
      name: string;
      duration: number;
      intensity: WorkoutIntensity;
      notes?: string;
    }
  ): Promise<ApiResponse<WorkoutEntry>> {
    try {
      // Validate duration
      if (workoutData.duration <= 0 || workoutData.duration > 720) { // Max 12 hours
        return {
          success: false,
          error: 'INVALID_DURATION',
          message: 'Workout duration must be between 1 and 720 minutes'
        };
      }

      // Calculate calories burned based on workout type and intensity
      const caloriesBurned = this.calculateWorkoutCalories(
        workoutData.type,
        workoutData.intensity,
        workoutData.duration
      );

      const workoutEntry: Omit<WorkoutEntry, 'id'> = {
        userId,
        date,
        type: workoutData.type,
        name: workoutData.name.trim(),
        duration: workoutData.duration,
        intensity: workoutData.intensity,
        caloriesBurned,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        notes: workoutData.notes?.trim()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.WORKOUTS), workoutEntry);

      const newEntry: WorkoutEntry = {
        id: docRef.id,
        ...workoutEntry
      };

      return {
        success: true,
        data: newEntry,
        message: 'Workout entry added successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add workout entry'
      };
    }
  }

  static async deleteWorkoutEntry(workoutId: string): Promise<ApiResponse<boolean>> {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.WORKOUTS, workoutId));

      return {
        success: true,
        data: true,
        message: 'Workout entry deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete workout entry'
      };
    }
  }

  private static calculateWorkoutCalories(type: WorkoutType, intensity: WorkoutIntensity, duration: number): number {
    // Calories per minute based on workout type and intensity
    const calorieRates: Record<WorkoutType, Record<WorkoutIntensity, number>> = {
      cardio: { low: 6, medium: 10, high: 15 },
      running: { low: 8, medium: 12, high: 16 },
      walking: { low: 3, medium: 5, high: 7 },
      cycling: { low: 6, medium: 10, high: 14 },
      swimming: { low: 7, medium: 11, high: 15 },
      strength: { low: 4, medium: 6, high: 8 },
      weightlifting: { low: 4, medium: 6, high: 8 },
      bodyweight: { low: 3, medium: 5, high: 7 },
      powerlifting: { low: 5, medium: 7, high: 9 },
      sports: { low: 5, medium: 8, high: 12 },
      basketball: { low: 6, medium: 9, high: 13 },
      football: { low: 7, medium: 10, high: 14 },
      tennis: { low: 5, medium: 8, high: 11 },
      soccer: { low: 6, medium: 9, high: 13 },
      flexibility: { low: 2, medium: 3, high: 4 },
      yoga: { low: 2, medium: 3, high: 4 },
      pilates: { low: 3, medium: 4, high: 5 },
      stretching: { low: 2, medium: 3, high: 4 },
      dance: { low: 4, medium: 6, high: 8 },
      martial_arts: { low: 6, medium: 9, high: 12 },
      hiking: { low: 4, medium: 6, high: 9 },
      climbing: { low: 7, medium: 10, high: 14 },
      other: { low: 4, medium: 6, high: 8 }
    };

    const caloriesPerMinute = calorieRates[type]?.[intensity] || calorieRates.other[intensity];
    return Math.round(duration * caloriesPerMinute);
  }

  static async getWorkoutEntriesByDate(userId: string, date: string): Promise<ApiResponse<WorkoutEntry[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.WORKOUTS),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const entries: WorkoutEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        } as WorkoutEntry);
      });

      return {
        success: true,
        data: entries,
        message: `Found ${entries.length} workout entries for ${date}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get workout entries'
      };
    }
  }

  // Daily Health Summary
  static async calculateDailyHealthSummary(
    userId: string, 
    date: string,
    waterGoal: number = 2000,
    stepsGoal: number = 10000
  ): Promise<DailyHealthSummary> {
    try {
      // Get all health data for the date
      const [waterResult, stepsResult, workoutResult, weightResult] = await Promise.all([
        this.getWaterEntriesByDate(userId, date),
        this.getStepsEntriesByDate(userId, date),
        this.getWorkoutEntriesByDate(userId, date),
        this.getWeightEntries(userId, 1) // Get most recent weight
      ]);

      // Calculate water intake
      const waterIntake = waterResult.success 
        ? waterResult.data!.reduce((total, entry) => total + entry.amount, 0)
        : 0;

      // Calculate steps (use latest entry for the day)
      const steps = stepsResult.success && stepsResult.data!.length > 0
        ? stepsResult.data![0].steps
        : 0;

      // Calculate workout totals
      let totalWorkoutDuration = 0;
      let totalCaloriesBurned = 0;
      let workoutCount = 0;

      if (workoutResult.success) {
        workoutResult.data!.forEach(workout => {
          totalWorkoutDuration += workout.duration;
          totalCaloriesBurned += workout.caloriesBurned;
          workoutCount++;
        });
      }

      // Get latest weight
      const weight = weightResult.success && weightResult.data!.length > 0
        ? weightResult.data![0].weight
        : undefined;
      const weightUnit = weightResult.success && weightResult.data!.length > 0
        ? weightResult.data![0].unit
        : undefined;

      const summary: DailyHealthSummary = {
        date,
        userId,
        waterIntake,
        waterGoal,
        steps,
        stepsGoal,
        weight,
        weightUnit,
        totalWorkoutDuration,
        totalCaloriesBurned,
        workoutCount,
        lastUpdated: Timestamp.now()
      };

      return summary;
    } catch (error) {
      // Return empty summary on error
      return {
        date,
        userId,
        waterIntake: 0,
        waterGoal,
        steps: 0,
        stepsGoal,
        totalWorkoutDuration: 0,
        totalCaloriesBurned: 0,
        workoutCount: 0,
        lastUpdated: Timestamp.now()
      };
    }
  }

  // Delete Methods
  static async deleteEntry(collection: string, entryId: string): Promise<ApiResponse<null>> {
    try {
      await deleteDoc(doc(db, collection, entryId));
      
      return {
        success: true,
        message: 'Entry deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete entry'
      };
    }
  }

  // Daily Activity Summary
  static async getDailyActivitySummary(
    userId: string,
    date: string,
    goals?: ActivityGoals
  ): Promise<ApiResponse<DailyActivitySummary>> {
    try {
      // Default goals if not provided
      const defaultGoals: ActivityGoals = {
        dailySteps: 10000,
        weeklyWorkouts: 3,
        dailyActiveMinutes: 30
      };
      const activityGoals = { ...defaultGoals, ...goals };

      // Get steps and workouts for the date
      const [stepsResult, workoutsResult] = await Promise.all([
        this.getStepsEntryByDate(userId, date),
        this.getWorkoutEntriesByDate(userId, date)
      ]);

      // Process steps data
      const stepsEntry = stepsResult.success ? stepsResult.data : null;
      const steps = {
        total: stepsEntry?.steps || 0,
        goal: activityGoals.dailySteps,
        caloriesBurned: stepsEntry?.caloriesBurned || 0,
        goalAchieved: (stepsEntry?.steps || 0) >= activityGoals.dailySteps,
        source: stepsEntry?.source || 'manual' as StepsSource
      };

      // Process workouts data
      const workoutEntries = workoutsResult.success ? workoutsResult.data || [] : [];
      const totalDuration = workoutEntries.reduce((sum, workout) => sum + workout.duration, 0);
      const totalWorkoutCalories = workoutEntries.reduce((sum, workout) => sum + workout.caloriesBurned, 0);

      // Calculate active minutes (medium and high intensity get multipliers)
      const activeMinutes = workoutEntries.reduce((sum, workout) => {
        const multiplier = workout.intensity === 'high' ? 2 : workout.intensity === 'medium' ? 1.5 : 1;
        return sum + (workout.duration * multiplier);
      }, 0);

      const workouts = {
        sessions: workoutEntries,
        totalDuration,
        totalCaloriesBurned: totalWorkoutCalories,
        activeMinutes: Math.round(activeMinutes)
      };

      // Combined metrics
      const combined = {
        totalCaloriesBurned: steps.caloriesBurned + workouts.totalCaloriesBurned,
        totalActiveMinutes: workouts.activeMinutes,
        activityScore: this.calculateActivityScore(steps, workouts, activityGoals)
      };

      const summary: DailyActivitySummary = {
        date,
        steps,
        workouts,
        combined,
        goals: {
          stepsGoal: activityGoals.dailySteps,
          activeMinutesGoal: activityGoals.dailyActiveMinutes,
          workoutsPerWeekGoal: activityGoals.weeklyWorkouts
        }
      };

      return {
        success: true,
        data: summary,
        message: 'Daily activity summary generated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate activity summary'
      };
    }
  }

  private static calculateActivityScore(
    steps: DailyActivitySummary['steps'],
    workouts: DailyActivitySummary['workouts'],
    goals: ActivityGoals
  ): number {
    // Calculate score out of 100
    const stepsScore = Math.min((steps.total / goals.dailySteps) * 50, 50); // Max 50 points
    const activeMinutesScore = Math.min((workouts.activeMinutes / goals.dailyActiveMinutes) * 30, 30); // Max 30 points
    const workoutScore = workouts.sessions.length > 0 ? 20 : 0; // 20 points for any workout

    return Math.round(stepsScore + activeMinutesScore + workoutScore);
  }

  // Activity Statistics
  static async getActivityStats(userId: string, days: number = 30): Promise<ApiResponse<ActivityStats>> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get steps and workouts for the period
      const [stepsQuery, workoutsQuery] = await Promise.all([
        getDocs(query(
          collection(db, this.COLLECTIONS.STEPS),
          where('userId', '==', userId),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        )),
        getDocs(query(
          collection(db, this.COLLECTIONS.WORKOUTS),
          where('userId', '==', userId),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        ))
      ]);

      const stepsEntries = stepsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as StepsEntry));
      const workoutEntries = workoutsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutEntry));

      // Calculate statistics
      const totalWorkouts = workoutEntries.length;
      const totalActiveMinutes = workoutEntries.reduce((sum, w) => sum + w.duration, 0);
      const totalCaloriesBurned = stepsEntries.reduce((sum, s) => sum + s.caloriesBurned, 0) +
                                 workoutEntries.reduce((sum, w) => sum + w.caloriesBurned, 0);

      const totalSteps = stepsEntries.reduce((sum, s) => sum + s.steps, 0);
      const averageStepsPerDay = stepsEntries.length > 0 ? Math.round(totalSteps / stepsEntries.length) : 0;

      const weeksInPeriod = Math.max(1, Math.floor(days / 7));
      const averageWorkoutsPerWeek = Math.round(totalWorkouts / weeksInPeriod * 10) / 10;

      const longestWorkoutMinutes = workoutEntries.length > 0 ?
        Math.max(...workoutEntries.map(w => w.duration)) : 0;

      // Find most active day
      const dailyTotals = new Map<string, number>();
      workoutEntries.forEach(workout => {
        const current = dailyTotals.get(workout.date) || 0;
        dailyTotals.set(workout.date, current + workout.duration);
      });

      const mostActiveDay = dailyTotals.size > 0 ?
        Array.from(dailyTotals.entries()).reduce((max, [date, minutes]) =>
          minutes > max.totalMinutes ? { date, totalMinutes: minutes } : max
        , { date: '', totalMinutes: 0 }) : { date: '', totalMinutes: 0 };

      // Calculate current streaks (simplified)
      const currentStepsStreak = this.calculateCurrentStepsStreak(stepsEntries);
      const currentWorkoutStreak = this.calculateCurrentWorkoutStreak(workoutEntries);

      const stats: ActivityStats = {
        totalDays: days,
        totalSteps,
        averageSteps: averageStepsPerDay,
        stepsGoalAchievementRate: stepsEntries.filter(s => s.goalProgress.achieved).length / Math.max(stepsEntries.length, 1) * 100,
        bestStepsDay: stepsEntries.length > 0 ?
          stepsEntries.reduce((max, entry) => entry.steps > max.steps ? entry : max) : { date: '', steps: 0 },
        totalWorkouts,
        totalWorkoutMinutes: totalActiveMinutes,
        averageWorkoutsPerDay: totalWorkouts / days,
        favoriteWorkoutType: this.getFavoriteWorkoutType(workoutEntries),
        longestWorkout: workoutEntries.length > 0 ?
          workoutEntries.reduce((max, w) => w.duration > max.duration ? w : max) : { date: '', duration: 0, type: 'other' as WorkoutType },
        totalCaloriesBurned,
        averageCaloriesPerDay: totalCaloriesBurned / days,
        bestCalorieDay: { date: '', calories: 0 }, // Would need daily aggregation
        currentStepsStreak,
        longestStepsStreak: currentStepsStreak, // Simplified
        currentWorkoutStreak,
        longestWorkoutStreak: currentWorkoutStreak // Simplified
      };

      return {
        success: true,
        data: stats,
        message: 'Activity statistics calculated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to calculate activity statistics'
      };
    }
  }

  private static calculateCurrentStepsStreak(stepsEntries: StepsEntry[]): number {
    const sortedEntries = stepsEntries
      .filter(entry => entry.goalProgress.achieved)
      .sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedEntries.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (sortedEntries[i]?.date === expectedDate) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private static calculateCurrentWorkoutStreak(workoutEntries: WorkoutEntry[]): number {
    const workoutDates = new Set(workoutEntries.map(w => w.date));
    const sortedDates = Array.from(workoutDates).sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (sortedDates.includes(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private static getFavoriteWorkoutType(workoutEntries: WorkoutEntry[]): WorkoutType {
    const typeCounts = workoutEntries.reduce((counts, workout) => {
      counts[workout.type] = (counts[workout.type] || 0) + 1;
      return counts;
    }, {} as Record<WorkoutType, number>);

    return Object.entries(typeCounts).reduce((max, [type, count]) =>
      count > (typeCounts[max as WorkoutType] || 0) ? type as WorkoutType : max
    , 'other' as WorkoutType);
  }

  // Helper Methods (keep existing estimateCaloriesBurned for backwards compatibility)
  private static estimateCaloriesBurned(
    type: string,
    duration: number,
    intensity: 'low' | 'medium' | 'high'
  ): number {
    return this.calculateWorkoutCalories(type as WorkoutType, intensity, duration);
  }
}