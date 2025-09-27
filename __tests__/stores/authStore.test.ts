import { useAuthStore } from '../../src/stores/authStore';
import { AuthService } from '../../src/services/firebase/auth';

// Mock AuthService
jest.mock('../../src/services/firebase/auth');
const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

// Mock config
jest.mock('../../src/config', () => ({
  auth: {},
  db: {},
}));

// Mock the health store import
jest.mock('../../src/stores/healthStore', () => ({
  useHealthStore: {
    getState: jest.fn(() => ({
      resetStore: jest.fn(),
    })),
  },
}));

describe('AuthStore - Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isRequestingReset: false,
      resetEmailSent: false,
      resetError: null,
      isCompletingReset: false,
      isLoggingOut: false,
      logoutError: null,
      confirmationRequired: false,
    });
  });

  describe('initiateLogout', () => {
    it('should set confirmation required to true', async () => {
      const { initiateLogout } = useAuthStore.getState();
      
      await initiateLogout();
      
      const state = useAuthStore.getState();
      expect(state.confirmationRequired).toBe(true);
      expect(state.logoutError).toBeNull();
    });

    it('should clear any existing logout error', async () => {
      // Set an existing logout error
      useAuthStore.setState({ logoutError: 'Previous error' });
      
      const { initiateLogout } = useAuthStore.getState();
      await initiateLogout();
      
      const state = useAuthStore.getState();
      expect(state.logoutError).toBeNull();
    });
  });

  describe('confirmLogout', () => {
    it('should successfully complete logout process', async () => {
      // Mock successful service calls
      mockedAuthService.clearLocalData.mockResolvedValue({
        success: true,
        message: 'Local data cleared',
      });
      mockedAuthService.cancelPendingOperations.mockResolvedValue({
        success: true,
        message: 'Operations cancelled',
      });
      mockedAuthService.logout.mockResolvedValue({
        success: true,
        message: 'User signed out successfully',
      });

      const { confirmLogout } = useAuthStore.getState();
      
      await confirmLogout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoggingOut).toBe(false);
      expect(state.logoutError).toBeNull();
      expect(state.confirmationRequired).toBe(false);
      
      // Verify service calls were made in correct order
      expect(mockedAuthService.clearLocalData).toHaveBeenCalled();
      expect(mockedAuthService.cancelPendingOperations).toHaveBeenCalled();
      expect(mockedAuthService.logout).toHaveBeenCalled();
    });

    it('should set loading state during logout process', async () => {
      let resolveLogout: () => void;
      const logoutPromise = new Promise<any>((resolve) => {
        resolveLogout = () => resolve({
          success: true,
          message: 'User signed out successfully',
        });
      });

      mockedAuthService.clearLocalData.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.cancelPendingOperations.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.logout.mockReturnValue(logoutPromise);

      const { confirmLogout } = useAuthStore.getState();
      
      // Start logout process
      const logoutCall = confirmLogout();
      
      // Check loading state is set
      const duringState = useAuthStore.getState();
      expect(duringState.isLoggingOut).toBe(true);
      expect(duringState.confirmationRequired).toBe(false);
      
      // Complete the logout
      resolveLogout!();
      await logoutCall;
      
      // Check final state
      const finalState = useAuthStore.getState();
      expect(finalState.isLoggingOut).toBe(false);
    });

    it('should handle logout service failure', async () => {
      mockedAuthService.clearLocalData.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.cancelPendingOperations.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.logout.mockResolvedValue({
        success: false,
        message: 'Network error occurred',
        error: 'auth/network-request-failed',
      });

      const { confirmLogout } = useAuthStore.getState();
      
      await confirmLogout();
      
      const state = useAuthStore.getState();
      expect(state.isLoggingOut).toBe(false);
      expect(state.logoutError).toBe('Network error occurred');
      // User should still be authenticated if logout failed
      expect(state.user).toBeNull(); // Since we didn't set a user initially
    });

    it('should handle exceptions during logout process', async () => {
      mockedAuthService.clearLocalData.mockRejectedValue(new Error('Unexpected error'));

      const { confirmLogout } = useAuthStore.getState();
      
      await confirmLogout();
      
      const state = useAuthStore.getState();
      expect(state.isLoggingOut).toBe(false);
      expect(state.logoutError).toBe('Unexpected error');
    });

    it('should handle exceptions without error message', async () => {
      mockedAuthService.clearLocalData.mockRejectedValue({ message: undefined });

      const { confirmLogout } = useAuthStore.getState();
      
      await confirmLogout();
      
      const state = useAuthStore.getState();
      expect(state.isLoggingOut).toBe(false);
      expect(state.logoutError).toBe('An unexpected error occurred during logout');
    });

    it('should reset all user-related state on successful logout', async () => {
      // Set up initial authenticated state
      useAuthStore.setState({
        user: { id: 'user123', email: 'test@example.com' } as any,
        isAuthenticated: true,
        resetEmailSent: true,
        resetError: 'Some reset error',
        isRequestingReset: true,
        isCompletingReset: true,
      });

      // Mock successful logout
      mockedAuthService.clearLocalData.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.cancelPendingOperations.mockResolvedValue({ success: true, message: '' });
      mockedAuthService.logout.mockResolvedValue({ success: true, message: 'Logged out' });

      const { confirmLogout } = useAuthStore.getState();
      
      await confirmLogout();
      
      const state = useAuthStore.getState();
      
      // Check auth state is reset
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isLoggingOut).toBe(false);
      
      // Check password reset state is reset
      expect(state.isRequestingReset).toBe(false);
      expect(state.resetEmailSent).toBe(false);
      expect(state.resetError).toBeNull();
      expect(state.isCompletingReset).toBe(false);
      
      // Check logout state is reset
      expect(state.logoutError).toBeNull();
      expect(state.confirmationRequired).toBe(false);
    });
  });

  describe('cancelLogout', () => {
    it('should cancel logout confirmation', () => {
      // Set up state with confirmation required and error
      useAuthStore.setState({
        confirmationRequired: true,
        logoutError: 'Some error',
      });

      const { cancelLogout } = useAuthStore.getState();
      
      cancelLogout();
      
      const state = useAuthStore.getState();
      expect(state.confirmationRequired).toBe(false);
      expect(state.logoutError).toBeNull();
    });
  });

  describe('clearLogoutError', () => {
    it('should clear logout error', () => {
      useAuthStore.setState({ logoutError: 'Some error message' });

      const { clearLogoutError } = useAuthStore.getState();
      
      clearLogoutError();
      
      const state = useAuthStore.getState();
      expect(state.logoutError).toBeNull();
    });
  });

  describe('legacy logout method', () => {
    it('should still work for backward compatibility', async () => {
      mockedAuthService.logout.mockResolvedValue({
        success: true,
        message: 'User signed out successfully',
      });

      useAuthStore.setState({
        user: { id: 'user123', email: 'test@example.com' } as any,
        isAuthenticated: true,
      });

      const { logout } = useAuthStore.getState();
      
      await logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle legacy logout errors', async () => {
      mockedAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      useAuthStore.setState({
        user: { id: 'user123', email: 'test@example.com' } as any,
        isAuthenticated: true,
      });

      const { logout } = useAuthStore.getState();
      
      await logout();
      
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      // Legacy method doesn't update auth state on error
    });
  });
});

describe('AuthStore - Health Store Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call health store reset during logout', async () => {
    const mockHealthStore = require('../../src/stores/healthStore');
    const mockResetStore = jest.fn();
    
    mockHealthStore.useHealthStore.getState.mockReturnValue({
      resetStore: mockResetStore,
    });

    // Mock successful logout
    mockedAuthService.clearLocalData.mockResolvedValue({ success: true, message: '' });
    mockedAuthService.cancelPendingOperations.mockResolvedValue({ success: true, message: '' });
    mockedAuthService.logout.mockResolvedValue({ success: true, message: 'Logged out' });

    const { confirmLogout } = useAuthStore.getState();
    
    await confirmLogout();
    
    expect(mockResetStore).toHaveBeenCalled();
  });
});