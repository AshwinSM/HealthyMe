import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

import { auth } from '../config/firebase';
import { AuthService } from '../services/firebase/auth';
import { userProfileService } from '../services/firebase/services';
import { BaseStoreState, BaseStoreActions, handleAsyncError } from './base/BaseStore';
import { UserProfile, HealthGoals, UserPreferences, Unsubscribe } from './types';

/**
 * Authentication store state interface
 */
interface AuthState extends BaseStoreState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
  confirmationRequired: boolean;
  logoutError: string | null;
}

/**
 * Authentication store actions interface
 */
interface AuthActions extends BaseStoreActions {
  // Authentication actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  
  // Logout confirmation flow
  initiateLogout: () => void;
  confirmLogout: () => Promise<void>;
  cancelLogout: () => void;
  
  // State management actions
  setUser: (user: UserProfile | null) => void;
  initializeAuth: () => Unsubscribe;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updateHealthGoals: (goals: Partial<HealthGoals>) => Promise<boolean>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>;
}

/**
 * Combined authentication store type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Initial state for the auth store
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoggingOut: false,
  confirmationRequired: false,
  logoutError: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

/**
 * Authentication store implementation using Zustand
 * Handles user authentication, session management, and profile updates
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Authentication actions
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await AuthService.login(email, password);
          
          if (result.success && result.data) {
            set({
              user: result.data,
              isAuthenticated: true,
              isLoading: false,
              lastUpdated: Timestamp.now(),
              confirmationRequired: false,
              isLoggingOut: false,
              logoutError: null,
            });
            return true;
          } else {
            set({
              error: result.message || 'Login failed',
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

      register: async (email: string, password: string, displayName?: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await AuthService.register(email, password, displayName);
          
          if (result.success && result.data) {
            set({
              user: result.data,
              isAuthenticated: true,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            return true;
          } else {
            set({
              error: result.message || 'Registration failed',
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

      logout: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          const result = await AuthService.logout();
          
          if (result.success) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              lastUpdated: null,
            });
          } else {
            set({
              error: result.message || 'Logout failed',
              isLoading: false,
            });
          }
        } catch (error: any) {
          // Even if logout fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleAsyncError(error),
            lastUpdated: null,
          });
        }
      },

      sendPasswordReset: async (email: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await AuthService.sendPasswordResetEmail(email);
          
          set({
            isLoading: false,
            error: result.success ? null : result.message || 'Failed to send password reset email',
          });
          
          return result.success;
        } catch (error: any) {
          set({
            error: handleAsyncError(error),
            isLoading: false,
          });
          return false;
        }
      },

      // Logout confirmation flow
      initiateLogout: () => {
        set({ 
          confirmationRequired: true,
          logoutError: null 
        });
      },

      confirmLogout: async (): Promise<void> => {
        set({ 
          isLoggingOut: true,
          confirmationRequired: false,
          logoutError: null 
        });
        
        try {
          const result = await AuthService.logout();
          
          if (result.success) {
            set({
              user: null,
              isAuthenticated: false,
              isLoggingOut: false,
              confirmationRequired: false,
              logoutError: null,
              error: null,
              lastUpdated: null,
            });
          } else {
            set({
              logoutError: result.message || 'Logout failed',
              isLoggingOut: false,
              confirmationRequired: false,
            });
          }
        } catch (error: any) {
          // Even if logout fails, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoggingOut: false,
            confirmationRequired: false,
            logoutError: handleAsyncError(error),
            lastUpdated: null,
          });
        }
      },

      cancelLogout: () => {
        set({ 
          confirmationRequired: false,
          logoutError: null 
        });
      },

      // State management actions  
      setUser: (user: UserProfile | null) => {
        set({
          user,
          isAuthenticated: !!user,
          lastUpdated: Timestamp.now(),
        });
      },

      initializeAuth: (): Unsubscribe => {
        console.log('🔥 AuthStore.initializeAuth - Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('🔥 Auth state changed:', !!firebaseUser, firebaseUser?.uid);
          if (firebaseUser) {
            try {
              const result = await userProfileService.getById(firebaseUser.uid);
              
              if (result.success && result.data) {
                set({
                  user: result.data,
                  isAuthenticated: true,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                  confirmationRequired: false,
                  isLoggingOut: false,
                  logoutError: null,
                });
              } else {
                // User exists in Firebase Auth but not in Firestore
                console.warn('User not found in Firestore');
                set({
                  user: null,
                  isAuthenticated: false,
                  isInitialized: true,
                  isLoading: false,
                  error: 'User profile not found',
                  confirmationRequired: false,
                  isLoggingOut: false,
                  logoutError: null,
                });
              }
            } catch (error) {
              console.error('Auth initialization error:', error);
              set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                error: handleAsyncError(error),
                confirmationRequired: false,
                isLoggingOut: false,
                logoutError: null,
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              error: null,
              confirmationRequired: false,
              isLoggingOut: false,
              logoutError: null,
            });
          }
        });

        return unsubscribe;
      },

      updateUserProfile: async (updates: Partial<UserProfile>): Promise<boolean> => {
        const { user } = get();
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await userProfileService.update(user.id, updates);
          
          if (result.success && result.data) {
            set({
              user: result.data,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            return true;
          } else {
            set({ 
              error: result.message || 'Profile update failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error: any) {
          set({ 
            error: handleAsyncError(error), 
            isLoading: false 
          });
          return false;
        }
      },

      updateHealthGoals: async (goals: Partial<HealthGoals>): Promise<boolean> => {
        const { user } = get();
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await userProfileService.updateGoals(user.id, goals);
          
          if (result.success) {
            const updatedUser = {
              ...user,
              goals: { ...user.goals, ...goals }
            };
            
            set({
              user: updatedUser,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            return true;
          } else {
            set({ 
              error: result.message || 'Goals update failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error: any) {
          set({ 
            error: handleAsyncError(error), 
            isLoading: false 
          });
          return false;
        }
      },

      updateUserPreferences: async (preferences: Partial<UserPreferences>): Promise<boolean> => {
        const { user } = get();
        if (!user) {
          set({ error: 'No user logged in' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          const result = await userProfileService.updatePreferences(user.id, preferences);
          
          if (result.success) {
            const updatedUser = {
              ...user,
              preferences: { ...user.preferences, ...preferences }
            };
            
            set({
              user: updatedUser,
              isLoading: false,
              lastUpdated: Timestamp.now(),
            });
            return true;
          } else {
            set({ 
              error: result.message || 'Preferences update failed', 
              isLoading: false 
            });
            return false;
          }
        } catch (error: any) {
          set({ 
            error: handleAsyncError(error), 
            isLoading: false 
          });
          return false;
        }
      },

      // Base store actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for commonly used auth state
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);