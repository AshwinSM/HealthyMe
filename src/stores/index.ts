// Central store exports and cross-store communication setup
export { useAuthStore, useUser, useIsAuthenticated, useAuthLoading, useAuthError } from './authStore';
export { useHealthStore } from './healthStore';
export { 
  useNutritionStore, 
  useFoodEntries, 
  useDailyNutrition, 
  useCurrentDate, 
  useMealProgress, 
  useNutritionGoals, 
  useNutritionLoading, 
  useNutritionError 
} from './nutritionStore';
export { 
  useHealthMetricsStore,
  useWeightEntries,
  useWaterEntries,
  useActivityEntries,
  useStepsEntries,
  useDailyProgress,
  useCurrentWeight,
  useDailyWaterIntake,
  useDailySteps,
  useDailyActivities,
  useHealthGoals,
  useHealthMetricsLoading,
  useHealthMetricsError
} from './healthMetricsStore';
export {
  useUIStore,
  useTheme,
  useIsDarkMode,
  useActiveTab,
  useActiveModal,
  useGlobalLoading,
  useSpecificLoading,
  useNotifications,
  useSyncStatus,
  useUIPreferences,
  useKeyboardVisible,
  useDashboardLayout,
  useBottomSheet,
  useUIError
} from './uiStore';

// Re-export types
export * from './types';
export * from './base/BaseStore';

import { useAuthStore } from './authStore';
import { useNutritionStore } from './nutritionStore';
import { useHealthMetricsStore } from './healthMetricsStore';
import { useUIStore } from './uiStore';
import { Unsubscribe } from './types';

/**
 * Store Manager for coordinating cross-store communication and lifecycle management
 */
class StoreManager {
  private unsubscribers: Unsubscribe[] = [];
  private isInitialized = false;

  /**
   * Initialize all stores and set up cross-store subscriptions
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const uiStore = useUIStore.getState();
    
    try {
      // Set global loading
      uiStore.setGlobalLoading(true);
      uiStore.setSyncStatus('syncing');
      
      // Initialize theme
      uiStore.initializeTheme();
      
      // Initialize auth first
      const authUnsubscribe = useAuthStore.getState().initializeAuth();
      this.unsubscribers.push(authUnsubscribe);
      
      // Wait for auth to be initialized
      await this.waitForAuthInitialization();
      
      const user = useAuthStore.getState().user;
      
      if (user) {
        // Initialize other stores if user is authenticated
        await Promise.all([
          useNutritionStore.getState().initializeNutrition(),
          useHealthMetricsStore.getState().initializeHealthMetrics(),
        ]);
        
        // Set up real-time subscriptions
        this.setupRealtimeSubscriptions();
        
        // Show welcome notification for new users
        if (uiStore.preferences.showWelcome) {
          uiStore.showNotification({
            type: 'info',
            title: 'Welcome!',
            message: 'Your health dashboard is ready to track your progress.',
            duration: 5000,
          });
        }
      }
      
      uiStore.setSyncStatus('idle');
      uiStore.setGlobalLoading(false);
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Store initialization failed:', error);
      uiStore.setSyncStatus('error');
      uiStore.setGlobalLoading(false);
      uiStore.showNotification({
        type: 'error',
        title: 'Initialization Failed',
        message: 'Failed to initialize the app. Please try restarting.',
        duration: 0, // Don't auto-dismiss errors
      });
    }
  }

  /**
   * Set up real-time subscriptions for authenticated user
   */
  private setupRealtimeSubscriptions(): void {
    const nutritionUnsubscribe = useNutritionStore.getState().subscribeToFoodEntries();
    const healthUnsubscribe = useHealthMetricsStore.getState().subscribeToHealthMetrics();
    
    this.unsubscribers.push(nutritionUnsubscribe, healthUnsubscribe);
  }

  /**
   * Wait for auth initialization to complete
   */
  private waitForAuthInitialization(): Promise<void> {
    return new Promise((resolve) => {
      const checkAuth = () => {
        const authState = useAuthStore.getState();
        if (authState.isInitialized) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  /**
   * Handle user login - initialize user-specific stores
   */
  async onUserLogin(): Promise<void> {
    const uiStore = useUIStore.getState();
    
    try {
      uiStore.setGlobalLoading(true);
      uiStore.setSyncStatus('syncing');
      
      // Initialize user-specific stores
      await Promise.all([
        useNutritionStore.getState().initializeNutrition(),
        useHealthMetricsStore.getState().initializeHealthMetrics(),
      ]);
      
      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      uiStore.setSyncStatus('idle');
      uiStore.setGlobalLoading(false);
      
      // Show success notification
      uiStore.showNotification({
        type: 'success',
        title: 'Logged In',
        message: 'Welcome back! Your data has been synced.',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Login initialization failed:', error);
      uiStore.setSyncStatus('error');
      uiStore.setGlobalLoading(false);
      uiStore.showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync your data. Please try again.',
        duration: 5000,
      });
    }
  }

  /**
   * Handle user logout - cleanup and reset stores
   */
  async onUserLogout(): Promise<void> {
    const uiStore = useUIStore.getState();
    
    try {
      // Cleanup subscriptions
      this.cleanup();
      
      // Reset all stores
      useNutritionStore.getState().reset();
      useHealthMetricsStore.getState().reset();
      
      // Keep UI preferences but reset other UI state
      uiStore.resetUI();
      
      uiStore.showNotification({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Logout cleanup failed:', error);
    }
  }

  /**
   * Force sync all data from Firebase
   */
  async forceSyncAll(): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const uiStore = useUIStore.getState();
    
    try {
      uiStore.setSyncStatus('syncing');
      
      const currentDate = useNutritionStore.getState().currentDate;
      
      await Promise.all([
        useNutritionStore.getState().loadFoodEntriesForDate(currentDate),
        useHealthMetricsStore.getState().loadMetricsForDate(currentDate),
      ]);
      
      uiStore.setSyncStatus('idle');
      uiStore.updateLastSyncTime();
      
      uiStore.showNotification({
        type: 'success',
        title: 'Sync Complete',
        message: 'Your data has been synchronized.',
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Force sync failed:', error);
      uiStore.setSyncStatus('error');
      uiStore.showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync data. Please check your connection.',
        duration: 5000,
      });
    }
  }

  /**
   * Get current sync status across all stores
   */
  getSyncStatus() {
    const authLoading = useAuthStore.getState().isLoading;
    const nutritionLoading = useNutritionStore.getState().isLoading;
    const healthLoading = useHealthMetricsStore.getState().isLoading;
    const uiSyncStatus = useUIStore.getState().syncStatus;
    
    return {
      isLoading: authLoading || nutritionLoading || healthLoading,
      syncStatus: uiSyncStatus,
      lastSyncTime: useUIStore.getState().lastSyncTime,
    };
  }

  /**
   * Get aggregated error state from all stores
   */
  getErrorState() {
    return {
      auth: useAuthStore.getState().error,
      nutrition: useNutritionStore.getState().error,
      health: useHealthMetricsStore.getState().error,
      ui: useUIStore.getState().error,
    };
  }

  /**
   * Clear all errors across stores
   */
  clearAllErrors(): void {
    useAuthStore.getState().clearError();
    useNutritionStore.getState().clearError();
    useHealthMetricsStore.getState().clearError();
    useUIStore.getState().clearError();
  }

  /**
   * Cleanup subscriptions and resources
   */
  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    this.unsubscribers = [];
    this.isInitialized = false;
  }

  /**
   * Reset all stores to initial state
   */
  resetAll(): void {
    this.cleanup();
    useAuthStore.getState().reset();
    useNutritionStore.getState().reset();
    useHealthMetricsStore.getState().reset();
    useUIStore.getState().reset();
  }
}

// Export singleton instance
export const storeManager = new StoreManager();

/**
 * Hook to access store manager functionality
 */
export function useStoreManager() {
  return {
    initialize: () => storeManager.initialize(),
    onUserLogin: () => storeManager.onUserLogin(),
    onUserLogout: () => storeManager.onUserLogout(),
    forceSyncAll: () => storeManager.forceSyncAll(),
    getSyncStatus: () => storeManager.getSyncStatus(),
    getErrorState: () => storeManager.getErrorState(),
    clearAllErrors: () => storeManager.clearAllErrors(),
    cleanup: () => storeManager.cleanup(),
    resetAll: () => storeManager.resetAll(),
  };
}

/**
 * Cross-store selector hooks for computed data
 */

// Combined dashboard data
export function useDashboardData() {
  const currentDate = useNutritionStore((state) => state.currentDate);
  const dailyNutrition = useNutritionStore((state) => state.dailyNutrition);
  const dailyProgress = useHealthMetricsStore((state) => state.dailyProgress);
  const currentWeight = useHealthMetricsStore((state) => state.currentWeight);
  const dailyWaterIntake = useHealthMetricsStore((state) => state.dailyWaterIntake);
  const dailySteps = useHealthMetricsStore((state) => state.dailySteps);
  const mealProgress = useNutritionStore((state) => state.mealProgress);
  
  return {
    currentDate,
    nutrition: dailyNutrition[currentDate],
    healthProgress: dailyProgress[currentDate],
    currentWeight,
    dailyWaterIntake,
    dailySteps,
    mealProgress,
  };
}

// Combined loading state
export function useAppLoading() {
  const authLoading = useAuthStore((state) => state.isLoading);
  const nutritionLoading = useNutritionStore((state) => state.isLoading);
  const healthLoading = useHealthMetricsStore((state) => state.isLoading);
  const globalLoading = useUIStore((state) => state.globalLoading);
  
  return authLoading || nutritionLoading || healthLoading || globalLoading;
}

// Combined error state
export function useAppError() {
  const authError = useAuthStore((state) => state.error);
  const nutritionError = useNutritionStore((state) => state.error);
  const healthError = useHealthMetricsStore((state) => state.error);
  const uiError = useUIStore((state) => state.error);
  
  return authError || nutritionError || healthError || uiError;
}