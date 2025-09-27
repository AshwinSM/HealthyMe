import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

import { Theme, SyncStatus } from './types';
import { BaseStoreState, BaseStoreActions, handleAsyncError } from './base/BaseStore';

interface ModalState {
  isVisible: boolean;
  type: 'food' | 'weight' | 'water' | 'activity' | 'profile' | 'settings' | null;
  data?: any;
}

interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  isVisible: boolean;
}

interface UIState extends BaseStoreState {
  // Theme and appearance
  theme: Theme;
  isDarkMode: boolean;
  
  // Navigation state
  activeTab: string;
  previousScreen: string | null;
  navigationHistory: string[];
  
  // Modal management
  activeModal: ModalState;
  modalStack: ModalState[];
  
  // Loading states
  globalLoading: boolean;
  specificLoading: Record<string, boolean>;
  
  // Notifications/Alerts
  notifications: NotificationState[];
  
  // Sync status
  syncStatus: SyncStatus;
  lastSyncTime: Timestamp | null;
  
  // UI preferences
  preferences: {
    showWelcome: boolean;
    enableHaptics: boolean;
    enableNotifications: boolean;
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    defaultUnits: 'metric' | 'imperial';
    compactView: boolean;
  };
  
  // Keyboard and input
  keyboardVisible: boolean;
  activeInput: string | null;
  
  // Dashboard customization
  dashboardLayout: {
    cardOrder: string[];
    hiddenCards: string[];
    compactCards: string[];
  };
  
  // Bottom sheet state
  bottomSheet: {
    isOpen: boolean;
    content: 'quickAdd' | 'dateSelector' | 'filters' | null;
    snapPoints: string[];
  };
}

interface UIActions extends BaseStoreActions {
  // Theme management
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
  initializeTheme: () => void;
  
  // Navigation
  setActiveTab: (tab: string) => void;
  setPreviousScreen: (screen: string) => void;
  addToNavigationHistory: (screen: string) => void;
  goBack: () => string | null;
  
  // Modal management
  showModal: (type: ModalState['type'], data?: any) => void;
  hideModal: () => void;
  hideAllModals: () => void;
  
  // Loading states
  setGlobalLoading: (loading: boolean) => void;
  setSpecificLoading: (key: string, loading: boolean) => void;
  clearAllLoading: () => void;
  
  // Notifications
  showNotification: (notification: Omit<NotificationState, 'id' | 'isVisible'>) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Sync status
  setSyncStatus: (status: SyncStatus) => void;
  updateLastSyncTime: () => void;
  
  // Preferences
  updatePreferences: (updates: Partial<UIState['preferences']>) => void;
  resetPreferencesToDefault: () => void;
  
  // Keyboard handling
  setKeyboardVisible: (visible: boolean) => void;
  setActiveInput: (inputId: string | null) => void;
  
  // Dashboard customization
  updateDashboardLayout: (updates: Partial<UIState['dashboardLayout']>) => void;
  resetDashboardLayout: () => void;
  
  // Bottom sheet
  openBottomSheet: (content: UIState['bottomSheet']['content'], snapPoints?: string[]) => void;
  closeBottomSheet: () => void;
  
  // Utility actions
  hapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const defaultPreferences: UIState['preferences'] = {
  showWelcome: true,
  enableHaptics: true,
  enableNotifications: true,
  defaultDateFormat: 'MM/DD/YYYY',
  defaultUnits: 'metric',
  compactView: false,
};

const defaultDashboardLayout: UIState['dashboardLayout'] = {
  cardOrder: ['calories', 'water', 'steps', 'weight', 'activity'],
  hiddenCards: [],
  compactCards: [],
};

const initialState: UIState = {
  theme: 'system',
  isDarkMode: false,
  activeTab: 'dashboard',
  previousScreen: null,
  navigationHistory: [],
  activeModal: {
    isVisible: false,
    type: null,
  },
  modalStack: [],
  globalLoading: false,
  specificLoading: {},
  notifications: [],
  syncStatus: 'idle',
  lastSyncTime: null,
  preferences: defaultPreferences,
  keyboardVisible: false,
  activeInput: null,
  dashboardLayout: defaultDashboardLayout,
  bottomSheet: {
    isOpen: false,
    content: null,
    snapPoints: ['25%', '50%', '90%'],
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme management
      setTheme: (theme: Theme) => {
        set({ theme });
        get().initializeTheme();
      },

      toggleDarkMode: () => {
        set(state => ({ isDarkMode: !state.isDarkMode }));
      },

      initializeTheme: () => {
        const { theme } = get();
        let isDarkMode = false;
        
        if (theme === 'dark') {
          isDarkMode = true;
        } else if (theme === 'system') {
          // In a real app, this would check system theme
          // For now, default to light mode
          isDarkMode = false;
        }
        
        set({ isDarkMode });
      },

      // Navigation
      setActiveTab: (tab: string) => {
        const { activeTab } = get();
        if (activeTab !== tab) {
          set({ 
            previousScreen: activeTab,
            activeTab: tab 
          });
          get().addToNavigationHistory(tab);
        }
      },

      setPreviousScreen: (screen: string) => {
        set({ previousScreen: screen });
      },

      addToNavigationHistory: (screen: string) => {
        set(state => ({
          navigationHistory: [...state.navigationHistory.slice(-9), screen], // Keep last 10
        }));
      },

      goBack: (): string | null => {
        const { navigationHistory } = get();
        if (navigationHistory.length > 1) {
          const newHistory = [...navigationHistory];
          newHistory.pop(); // Remove current screen
          const previousScreen = newHistory[newHistory.length - 1];
          
          set({
            navigationHistory: newHistory,
            activeTab: previousScreen,
          });
          
          return previousScreen;
        }
        return null;
      },

      // Modal management
      showModal: (type: ModalState['type'], data?: any) => {
        const currentModal = get().activeModal;
        
        // If there's already an active modal, add it to the stack
        if (currentModal.isVisible) {
          set(state => ({
            modalStack: [...state.modalStack, currentModal],
          }));
        }
        
        set({
          activeModal: {
            isVisible: true,
            type,
            data,
          },
        });
      },

      hideModal: () => {
        const { modalStack } = get();
        
        if (modalStack.length > 0) {
          // Show previous modal from stack
          const previousModal = modalStack[modalStack.length - 1];
          set({
            activeModal: previousModal,
            modalStack: modalStack.slice(0, -1),
          });
        } else {
          // No modals in stack, hide completely
          set({
            activeModal: {
              isVisible: false,
              type: null,
              data: undefined,
            },
          });
        }
      },

      hideAllModals: () => {
        set({
          activeModal: {
            isVisible: false,
            type: null,
            data: undefined,
          },
          modalStack: [],
        });
      },

      // Loading states
      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading });
      },

      setSpecificLoading: (key: string, loading: boolean) => {
        set(state => ({
          specificLoading: {
            ...state.specificLoading,
            [key]: loading,
          },
        }));
      },

      clearAllLoading: () => {
        set({
          globalLoading: false,
          specificLoading: {},
        });
      },

      // Notifications
      showNotification: (notification: Omit<NotificationState, 'id' | 'isVisible'>): string => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: NotificationState = {
          ...notification,
          id,
          isVisible: true,
        };

        set(state => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-hide after duration
        if (notification.duration !== 0) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().hideNotification(id);
          }, duration);
        }

        return id;
      },

      hideNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id
              ? { ...notification, isVisible: false }
              : notification
          ),
        }));

        // Remove from array after animation
        setTimeout(() => {
          set(state => ({
            notifications: state.notifications.filter(notification => notification.id !== id),
          }));
        }, 300);
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      // Sync status
      setSyncStatus: (status: SyncStatus) => {
        set({ syncStatus: status });
        
        if (status === 'idle') {
          get().updateLastSyncTime();
        }
      },

      updateLastSyncTime: () => {
        set({ lastSyncTime: Timestamp.now() });
      },

      // Preferences
      updatePreferences: (updates: Partial<UIState['preferences']>) => {
        set(state => ({
          preferences: { ...state.preferences, ...updates },
          lastUpdated: Timestamp.now(),
        }));
      },

      resetPreferencesToDefault: () => {
        set({
          preferences: defaultPreferences,
          lastUpdated: Timestamp.now(),
        });
      },

      // Keyboard handling
      setKeyboardVisible: (visible: boolean) => {
        set({ keyboardVisible: visible });
      },

      setActiveInput: (inputId: string | null) => {
        set({ activeInput: inputId });
      },

      // Dashboard customization
      updateDashboardLayout: (updates: Partial<UIState['dashboardLayout']>) => {
        set(state => ({
          dashboardLayout: { ...state.dashboardLayout, ...updates },
          lastUpdated: Timestamp.now(),
        }));
      },

      resetDashboardLayout: () => {
        set({
          dashboardLayout: defaultDashboardLayout,
          lastUpdated: Timestamp.now(),
        });
      },

      // Bottom sheet
      openBottomSheet: (content: UIState['bottomSheet']['content'], snapPoints = ['25%', '50%', '90%']) => {
        set({
          bottomSheet: {
            isOpen: true,
            content,
            snapPoints,
          },
        });
      },

      closeBottomSheet: () => {
        set({
          bottomSheet: {
            isOpen: false,
            content: null,
            snapPoints: ['25%', '50%', '90%'],
          },
        });
      },

      // Utility actions
      hapticFeedback: (type = 'light') => {
        const { preferences } = get();
        if (preferences.enableHaptics) {
          // In a real app, this would trigger haptic feedback
          // For React Native: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          console.log(`Haptic feedback: ${type}`);
        }
      },

      resetUI: () => {
        set({
          ...initialState,
          // Keep user preferences
          preferences: get().preferences,
          theme: get().theme,
        });
      },

      // Base store actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences,
        dashboardLayout: state.dashboardLayout,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Selector hooks for commonly used UI state
export const useTheme = () => useUIStore((state) => state.theme);
export const useIsDarkMode = () => useUIStore((state) => state.isDarkMode);
export const useActiveTab = () => useUIStore((state) => state.activeTab);
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useSpecificLoading = (key: string) => useUIStore((state) => state.specificLoading[key] || false);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useSyncStatus = () => useUIStore((state) => state.syncStatus);
export const useUIPreferences = () => useUIStore((state) => state.preferences);
export const useKeyboardVisible = () => useUIStore((state) => state.keyboardVisible);
export const useDashboardLayout = () => useUIStore((state) => state.dashboardLayout);
export const useBottomSheet = () => useUIStore((state) => state.bottomSheet);
export const useUIError = () => useUIStore((state) => state.error);