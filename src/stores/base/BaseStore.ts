import { Timestamp } from 'firebase/firestore';

/**
 * Base interface for all store states
 * Provides common properties for loading, error handling, and timestamps
 */
export interface BaseStoreState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Timestamp | null;
}

/**
 * Base interface for all store actions
 * Provides common methods for error handling and state management
 */
export interface BaseStoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Combined base store type
 */
export type BaseStore<T extends BaseStoreState> = T & BaseStoreActions;

/**
 * Helper function to create base store implementation
 * Provides consistent error handling and loading state management
 */
export function createBaseStoreActions<T extends BaseStoreState>(
  initialState: T
): BaseStoreActions {
  return {
    setLoading: (loading: boolean) => ({ isLoading: loading }),
    setError: (error: string | null) => ({ error, isLoading: false }),
    clearError: () => ({ error: null }),
    reset: () => ({
      ...initialState,
      isLoading: false,
      error: null,
      lastUpdated: null
    })
  };
}

/**
 * Utility function to format dates consistently across stores
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Common error handling for async store actions
 */
export function handleAsyncError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}