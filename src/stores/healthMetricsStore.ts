import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

import { 
  WeightEntry, 
  WaterEntry, 
  ActivityEntry, 
  StepsEntry,
  DailyHealthProgress,
  Unsubscribe 
} from './types';
import { BaseStoreState, BaseStoreActions, handleAsyncError, formatDate, getTodayDate } from './base/BaseStore';
import { weightService, waterService, activityService, stepsService } from '../services/firebase/services';
import { useAuthStore } from './authStore';

interface HealthMetricsState extends BaseStoreState {
  // Current data
  weightEntries: WeightEntry[];
  waterEntries: WaterEntry[];
  activityEntries: ActivityEntry[];
  stepsEntries: StepsEntry[];
  
  // Daily summaries
  dailyProgress: Record<string, DailyHealthProgress>;
  currentDate: string;
  
  // Current day values
  currentWeight: number | null;
  dailyWaterIntake: number;
  dailySteps: number;
  dailyActivities: ActivityEntry[];
  
  // Goals from user profile
  waterGoal: number; // mL
  stepsGoal: number;
  activityGoal: number; // minutes per day
  
  isInitialized: boolean;
}

interface HealthMetricsActions extends BaseStoreActions {
  // Weight tracking
  addWeightEntry: (weight: number, notes?: string) => Promise<boolean>;
  updateWeightEntry: (id: string, updates: Partial<WeightEntry>) => Promise<boolean>;
  deleteWeightEntry: (id: string) => Promise<boolean>;
  
  // Water tracking
  addWaterEntry: (amount: number) => Promise<boolean>;
  updateWaterEntry: (id: string, updates: Partial<WaterEntry>) => Promise<boolean>;
  deleteWaterEntry: (id: string) => Promise<boolean>;
  
  // Activity tracking
  addActivityEntry: (entry: Omit<ActivityEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateActivityEntry: (id: string, updates: Partial<ActivityEntry>) => Promise<boolean>;
  deleteActivityEntry: (id: string) => Promise<boolean>;
  
  // Steps tracking
  addStepsEntry: (steps: number, source?: string) => Promise<boolean>;
  updateStepsEntry: (id: string, updates: Partial<StepsEntry>) => Promise<boolean>;
  
  // Date navigation
  setCurrentDate: (date: string) => void;
  loadMetricsForDate: (date: string) => Promise<void>;
  loadHealthDataForDate: (date: string) => Promise<void>;
  getAvailableDates: (userId: string, startDate: string, endDate: string) => Promise<string[]>;
  hasDataForDate: (date: string) => boolean;
  getDailyMetrics: (date: string) => DailyHealthProgress | undefined;
  
  // Progress calculations
  calculateDailyProgress: (date: string) => DailyHealthProgress;
  updateHealthGoals: (goals: Partial<{ waterGoal: number; stepsGoal: number; activityGoal: number }>) => void;
  
  // Real-time sync
  subscribeToHealthMetrics: () => Unsubscribe;
  initializeHealthMetrics: () => Promise<void>;
  
  // Quick actions for current day
  quickAddWater: (amount: number) => Promise<boolean>;
  getWaterProgress: () => number; // percentage
  getStepsProgress: () => number; // percentage
  getActivityProgress: () => number; // percentage
}

type HealthMetricsStore = HealthMetricsState & HealthMetricsActions;

const initialState: HealthMetricsState = {
  weightEntries: [],
  waterEntries: [],
  activityEntries: [],
  stepsEntries: [],
  dailyProgress: {},
  currentDate: getTodayDate(),
  currentWeight: null,
  dailyWaterIntake: 0,
  dailySteps: 0,
  dailyActivities: [],
  waterGoal: 2000, // 2L in mL
  stepsGoal: 8000,
  activityGoal: 30, // 30 minutes
  isInitialized: false,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useHealthMetricsStore = create<HealthMetricsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Weight tracking methods
      addWeightEntry: async (weight: number, notes?: string): Promise<boolean> => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await weightService.create({
            userId: user.id,
            weight,
            unit: 'kg',
            notes: notes || '',
            date: get().currentDate,
          });
          
          if (result.success && result.data) {
            const { weightEntries } = get();
            set({
              weightEntries: [...weightEntries, result.data],
              currentWeight: weight,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Recalculate daily progress
            get().calculateDailyProgress(get().currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to add weight entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      updateWeightEntry: async (id: string, updates: Partial<WeightEntry>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await weightService.update(id, updates);
          
          if (result.success && result.data) {
            const { weightEntries } = get();
            const updatedEntries = weightEntries.map(entry => 
              entry.id === id ? result.data! : entry
            );
            
            set({
              weightEntries: updatedEntries,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            // Update current weight if it's today's entry
            if (result.data.date === get().currentDate) {
              set({ currentWeight: result.data.weight });
            }
            
            get().calculateDailyProgress(get().currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to update weight entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      deleteWeightEntry: async (id: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await weightService.delete(id);
          
          if (result.success) {
            const { weightEntries, currentDate } = get();
            const filteredEntries = weightEntries.filter(entry => entry.id !== id);
            
            // Find current weight for today
            const todayWeight = filteredEntries
              .filter(entry => entry.date === currentDate)
              .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];
            
            set({
              weightEntries: filteredEntries,
              currentWeight: todayWeight?.weight || null,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to delete weight entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      // Water tracking methods
      addWaterEntry: async (amount: number): Promise<boolean> => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await waterService.create({
            userId: user.id,
            amount,
            unit: 'ml',
            date: get().currentDate,
          });
          
          if (result.success && result.data) {
            const { waterEntries, dailyWaterIntake } = get();
            set({
              waterEntries: [...waterEntries, result.data],
              dailyWaterIntake: dailyWaterIntake + amount,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(get().currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to add water entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      updateWaterEntry: async (id: string, updates: Partial<WaterEntry>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await waterService.update(id, updates);
          
          if (result.success && result.data) {
            const { waterEntries, currentDate } = get();
            const updatedEntries = waterEntries.map(entry => 
              entry.id === id ? result.data! : entry
            );
            
            // Recalculate daily water intake
            const todayEntries = updatedEntries.filter(entry => entry.date === currentDate);
            const dailyTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
            
            set({
              waterEntries: updatedEntries,
              dailyWaterIntake: dailyTotal,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to update water entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      deleteWaterEntry: async (id: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await waterService.delete(id);
          
          if (result.success) {
            const { waterEntries, currentDate } = get();
            const filteredEntries = waterEntries.filter(entry => entry.id !== id);
            
            // Recalculate daily water intake
            const todayEntries = filteredEntries.filter(entry => entry.date === currentDate);
            const dailyTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
            
            set({
              waterEntries: filteredEntries,
              dailyWaterIntake: dailyTotal,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to delete water entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      // Activity tracking methods
      addActivityEntry: async (entryData): Promise<boolean> => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await activityService.create({
            ...entryData,
            userId: user.id,
          });
          
          if (result.success && result.data) {
            const { activityEntries, currentDate } = get();
            const newEntries = [...activityEntries, result.data];
            
            // Update daily activities if it's for current date
            const dailyActivities = result.data.date === currentDate 
              ? [...get().dailyActivities, result.data]
              : get().dailyActivities;
            
            set({
              activityEntries: newEntries,
              dailyActivities,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to add activity entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      updateActivityEntry: async (id: string, updates: Partial<ActivityEntry>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await activityService.update(id, updates);
          
          if (result.success && result.data) {
            const { activityEntries, currentDate } = get();
            const updatedEntries = activityEntries.map(entry => 
              entry.id === id ? result.data! : entry
            );
            
            const dailyActivities = updatedEntries.filter(entry => entry.date === currentDate);
            
            set({
              activityEntries: updatedEntries,
              dailyActivities,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to update activity entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      deleteActivityEntry: async (id: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await activityService.delete(id);
          
          if (result.success) {
            const { activityEntries, currentDate } = get();
            const filteredEntries = activityEntries.filter(entry => entry.id !== id);
            const dailyActivities = filteredEntries.filter(entry => entry.date === currentDate);
            
            set({
              activityEntries: filteredEntries,
              dailyActivities,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to delete activity entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      // Steps tracking methods
      addStepsEntry: async (steps: number, source = 'manual'): Promise<boolean> => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await stepsService.create({
            userId: user.id,
            steps,
            source,
            date: get().currentDate,
          });
          
          if (result.success && result.data) {
            const { stepsEntries, currentDate } = get();
            const newEntries = [...stepsEntries, result.data];
            
            // Calculate new daily steps total
            const todayEntries = newEntries.filter(entry => entry.date === currentDate);
            const dailySteps = todayEntries.reduce((sum, entry) => sum + entry.steps, 0);
            
            set({
              stepsEntries: newEntries,
              dailySteps,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to add steps entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      updateStepsEntry: async (id: string, updates: Partial<StepsEntry>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await stepsService.update(id, updates);
          
          if (result.success && result.data) {
            const { stepsEntries, currentDate } = get();
            const updatedEntries = stepsEntries.map(entry => 
              entry.id === id ? result.data! : entry
            );
            
            // Recalculate daily steps
            const todayEntries = updatedEntries.filter(entry => entry.date === currentDate);
            const dailySteps = todayEntries.reduce((sum, entry) => sum + entry.steps, 0);
            
            set({
              stepsEntries: updatedEntries,
              dailySteps,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            
            get().calculateDailyProgress(currentDate);
            return true;
          } else {
            set({
              error: result.message || 'Failed to update steps entry',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      // Date navigation and data loading
      setCurrentDate: (date: string) => {
        set({ currentDate: date });
        get().loadMetricsForDate(date);
      },

      loadMetricsForDate: async (date: string): Promise<void> => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        
        try {
          // Load all metrics for the date in parallel
          const [weightResult, waterResult, activityResult, stepsResult] = await Promise.all([
            weightService.getByDateRange(user.id, date, date),
            waterService.getByDateRange(user.id, date, date),
            activityService.getByDateRange(user.id, date, date),
            stepsService.getByDateRange(user.id, date, date),
          ]);

          const weightEntries = weightResult.success ? weightResult.data || [] : [];
          const waterEntries = waterResult.success ? waterResult.data || [] : [];
          const activityEntries = activityResult.success ? activityResult.data || [] : [];
          const stepsEntries = stepsResult.success ? stepsResult.data || [] : [];

          // Calculate daily totals
          const currentWeight = weightEntries.length > 0 
            ? weightEntries.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0].weight
            : null;
          
          const dailyWaterIntake = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
          const dailySteps = stepsEntries.reduce((sum, entry) => sum + entry.steps, 0);

          set({
            weightEntries,
            waterEntries,
            activityEntries,
            stepsEntries,
            currentWeight,
            dailyWaterIntake,
            dailySteps,
            dailyActivities: activityEntries,
            isLoading: false,
            lastUpdated: Timestamp.now(),
          });
          
          // Calculate daily progress
          get().calculateDailyProgress(date);
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
        }
      },

      // Progress calculations
      calculateDailyProgress: (date: string): DailyHealthProgress => {
        const { 
          weightEntries, 
          waterEntries, 
          activityEntries, 
          stepsEntries,
          waterGoal,
          stepsGoal,
          activityGoal
        } = get();
        
        const dayWeight = weightEntries
          .filter(entry => entry.date === date)
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];
        
        const dayWater = waterEntries
          .filter(entry => entry.date === date)
          .reduce((sum, entry) => sum + entry.amount, 0);
        
        const daySteps = stepsEntries
          .filter(entry => entry.date === date)
          .reduce((sum, entry) => sum + entry.steps, 0);
        
        const dayActivities = activityEntries.filter(entry => entry.date === date);
        const totalActiveMinutes = dayActivities.reduce((sum, entry) => sum + entry.duration, 0);
        const caloriesBurned = dayActivities.reduce((sum, entry) => sum + (entry.caloriesBurned || 0), 0);
        
        const progress: DailyHealthProgress = {
          date,
          weight: dayWeight?.weight,
          waterIntake: dayWater,
          totalSteps: daySteps,
          activitiesCount: dayActivities.length,
          totalActiveMinutes,
          caloriesBurned,
          goalProgress: {
            water: Math.round((dayWater / waterGoal) * 100),
            steps: Math.round((daySteps / stepsGoal) * 100),
            activity: Math.round((totalActiveMinutes / activityGoal) * 100),
          },
        };
        
        set(state => ({
          dailyProgress: {
            ...state.dailyProgress,
            [date]: progress,
          },
        }));
        
        return progress;
      },

      updateHealthGoals: (goals) => {
        set(state => ({
          ...state,
          ...goals,
          lastUpdated: Timestamp.now(),
        }));
        
        // Recalculate progress with new goals
        get().calculateDailyProgress(get().currentDate);
      },

      // Real-time subscriptions
      subscribeToHealthMetrics: (): Unsubscribe => {
        const user = useAuthStore.getState().user;
        if (!user) {
          return () => {};
        }

        // Subscribe to all metrics
        const unsubscribeWeight = weightService.subscribeToUserData(user.id, (entries) => {
          set({ weightEntries: entries });
          get().calculateDailyProgress(get().currentDate);
        });

        const unsubscribeWater = waterService.subscribeToUserData(user.id, (entries) => {
          const { currentDate } = get();
          const dailyWaterIntake = entries
            .filter(entry => entry.date === currentDate)
            .reduce((sum, entry) => sum + entry.amount, 0);
          
          set({ waterEntries: entries, dailyWaterIntake });
          get().calculateDailyProgress(currentDate);
        });

        const unsubscribeActivity = activityService.subscribeToUserData(user.id, (entries) => {
          const { currentDate } = get();
          const dailyActivities = entries.filter(entry => entry.date === currentDate);
          
          set({ activityEntries: entries, dailyActivities });
          get().calculateDailyProgress(currentDate);
        });

        const unsubscribeSteps = stepsService.subscribeToUserData(user.id, (entries) => {
          const { currentDate } = get();
          const dailySteps = entries
            .filter(entry => entry.date === currentDate)
            .reduce((sum, entry) => sum + entry.steps, 0);
          
          set({ stepsEntries: entries, dailySteps });
          get().calculateDailyProgress(currentDate);
        });

        // Return combined unsubscribe function
        return () => {
          unsubscribeWeight();
          unsubscribeWater();
          unsubscribeActivity();
          unsubscribeSteps();
        };
      },

      initializeHealthMetrics: async (): Promise<void> => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true });
        
        try {
          const { currentDate } = get();
          await get().loadMetricsForDate(currentDate);
          
          // Load user's health goals from profile if available
          if (user.goals) {
            set({
              waterGoal: user.goals.dailyWaterIntake || 2000,
              stepsGoal: user.goals.dailySteps || 8000,
              activityGoal: user.goals.weeklyActivityMinutes ? Math.round(user.goals.weeklyActivityMinutes / 7) : 30,
            });
          }
          
          set({ 
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
        }
      },

      // Quick actions
      quickAddWater: async (amount: number): Promise<boolean> => {
        return get().addWaterEntry(amount);
      },

      getWaterProgress: (): number => {
        const { dailyWaterIntake, waterGoal } = get();
        return Math.round((dailyWaterIntake / waterGoal) * 100);
      },

      getStepsProgress: (): number => {
        const { dailySteps, stepsGoal } = get();
        return Math.round((dailySteps / stepsGoal) * 100);
      },

      getActivityProgress: (): number => {
        const { dailyActivities, activityGoal } = get();
        const totalMinutes = dailyActivities.reduce((sum, activity) => sum + activity.duration, 0);
        return Math.round((totalMinutes / activityGoal) * 100);
      },

      loadHealthDataForDate: async (date: string): Promise<void> => {
        return get().loadMetricsForDate(date);
      },

      getAvailableDates: async (userId: string, startDate: string, endDate: string): Promise<string[]> => {
        try {
          const [weightResult, waterResult, activityResult, stepsResult] = await Promise.all([
            weightService.getByDateRange(userId, startDate, endDate),
            waterService.getByDateRange(userId, startDate, endDate),
            activityService.getByDateRange(userId, startDate, endDate),
            stepsService.getByDateRange(userId, startDate, endDate)
          ]);

          const allDates = new Set<string>();

          if (weightResult.success && weightResult.data) {
            weightResult.data.forEach(entry => allDates.add(entry.date));
          }

          if (waterResult.success && waterResult.data) {
            waterResult.data.forEach(entry => allDates.add(entry.date));
          }

          if (activityResult.success && activityResult.data) {
            activityResult.data.forEach(entry => allDates.add(entry.date));
          }

          if (stepsResult.success && stepsResult.data) {
            stepsResult.data.forEach(entry => allDates.add(entry.date));
          }

          return Array.from(allDates).sort();
        } catch (error) {
          console.error('Failed to get available health dates:', error);
          return [];
        }
      },

      hasDataForDate: (date: string): boolean => {
        const { weightEntries, waterEntries, activityEntries, stepsEntries } = get();
        return (
          weightEntries.some(entry => entry.date === date) ||
          waterEntries.some(entry => entry.date === date) ||
          activityEntries.some(entry => entry.date === date) ||
          stepsEntries.some(entry => entry.date === date)
        );
      },

      getDailyMetrics: (date: string): DailyHealthProgress | undefined => {
        const { dailyProgress } = get();
        return dailyProgress[date];
      },

      // Base store actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'health-metrics-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dailyProgress: state.dailyProgress,
        waterGoal: state.waterGoal,
        stepsGoal: state.stepsGoal,
        activityGoal: state.activityGoal,
        currentDate: state.currentDate,
      }),
    }
  )
);

// Selector hooks for commonly used health metrics state
export const useWeightEntries = () => useHealthMetricsStore((state) => state.weightEntries);
export const useWaterEntries = () => useHealthMetricsStore((state) => state.waterEntries);
export const useActivityEntries = () => useHealthMetricsStore((state) => state.activityEntries);
export const useStepsEntries = () => useHealthMetricsStore((state) => state.stepsEntries);
export const useDailyProgress = () => useHealthMetricsStore((state) => state.dailyProgress);
export const useCurrentWeight = () => useHealthMetricsStore((state) => state.currentWeight);
export const useDailyWaterIntake = () => useHealthMetricsStore((state) => state.dailyWaterIntake);
export const useDailySteps = () => useHealthMetricsStore((state) => state.dailySteps);
export const useDailyActivities = () => useHealthMetricsStore((state) => state.dailyActivities);
export const useWaterGoal = () => useHealthMetricsStore((state) => state.waterGoal);
export const useStepsGoal = () => useHealthMetricsStore((state) => state.stepsGoal);
export const useActivityGoal = () => useHealthMetricsStore((state) => state.activityGoal);
export const useHealthMetricsLoading = () => useHealthMetricsStore((state) => state.isLoading);
export const useHealthMetricsError = () => useHealthMetricsStore((state) => state.error);