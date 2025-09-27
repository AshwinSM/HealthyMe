import { DeepLinkHandler } from '../../src/utils/deepLinkHandler';
import { Linking } from 'react-native';

// Mock React Native Linking
jest.mock('react-native', () => ({
  Linking: {
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('DeepLinkHandler', () => {
  const mockNavigationRef = {
    isReady: jest.fn(),
    navigate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    DeepLinkHandler.setNavigationRef(mockNavigationRef);
    mockNavigationRef.isReady.mockReturnValue(true);
  });

  describe('parseDeepLink', () => {
    it('should parse valid deep link URL', () => {
      const url = 'healthdashboard:/auth/reset-password?oobCode=abc123&mode=resetPassword';
      const result = DeepLinkHandler.parseDeepLink(url);

      expect(result).toEqual({
        path: '/auth/reset-password',
        params: {
          oobCode: 'abc123',
          mode: 'resetPassword',
        },
      });
    });

    it('should return null for invalid scheme', () => {
      const url = 'invalid-scheme:/auth/reset-password?oobCode=abc123';
      const result = DeepLinkHandler.parseDeepLink(url);

      expect(result).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const url = 'not-a-url';
      const result = DeepLinkHandler.parseDeepLink(url);

      expect(result).toBeNull();
    });

    it('should parse URL without parameters', () => {
      const url = 'healthdashboard:/auth/reset-password';
      const result = DeepLinkHandler.parseDeepLink(url);

      expect(result).toEqual({
        path: '/auth/reset-password',
        params: {},
      });
    });
  });

  describe('handlePasswordResetLink', () => {
    it('should handle valid password reset parameters', () => {
      const params = { oobCode: 'abc123', mode: 'resetPassword' };
      const result = DeepLinkHandler.handlePasswordResetLink(params);

      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Login', {
        resetCode: 'abc123',
        mode: 'resetPassword',
      });
    });

    it('should return false for missing oobCode', () => {
      const params = { mode: 'resetPassword' };
      const result = DeepLinkHandler.handlePasswordResetLink(params);

      expect(result).toBe(false);
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should return false for wrong mode', () => {
      const params = { oobCode: 'abc123', mode: 'wrongMode' };
      const result = DeepLinkHandler.handlePasswordResetLink(params);

      expect(result).toBe(false);
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should store reset code when navigation is not ready', () => {
      mockNavigationRef.isReady.mockReturnValue(false);
      const params = { oobCode: 'abc123', mode: 'resetPassword' };
      
      const result = DeepLinkHandler.handlePasswordResetLink(params);

      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should handle navigation error gracefully', () => {
      mockNavigationRef.navigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const params = { oobCode: 'abc123', mode: 'resetPassword' };
      const result = DeepLinkHandler.handlePasswordResetLink(params);

      expect(result).toBe(false);
    });
  });

  describe('processPendingResetCode', () => {
    it('should process pending reset code when navigation becomes ready', () => {
      // First, make navigation not ready and store a reset code
      mockNavigationRef.isReady.mockReturnValue(false);
      DeepLinkHandler.handlePasswordResetLink({ oobCode: 'abc123', mode: 'resetPassword' });

      // Then make navigation ready and process pending
      mockNavigationRef.isReady.mockReturnValue(true);
      const result = DeepLinkHandler.processPendingResetCode();

      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Login', {
        resetCode: 'abc123',
        mode: 'resetPassword',
      });
    });

    it('should return false when no pending reset code', () => {
      const result = DeepLinkHandler.processPendingResetCode();
      expect(result).toBe(false);
    });

    it('should return false when navigation is not ready', () => {
      mockNavigationRef.isReady.mockReturnValue(false);
      // Store a pending code first
      DeepLinkHandler.handlePasswordResetLink({ oobCode: 'abc123', mode: 'resetPassword' });
      
      const result = DeepLinkHandler.processPendingResetCode();
      expect(result).toBe(false);
    });
  });

  describe('handleDeepLink', () => {
    it('should handle password reset deep link', () => {
      const url = 'healthdashboard:/auth/reset-password?oobCode=abc123&mode=resetPassword';
      const result = DeepLinkHandler.handleDeepLink(url);

      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Login', {
        resetCode: 'abc123',
        mode: 'resetPassword',
      });
    });

    it('should return false for unknown path', () => {
      const url = 'healthdashboard:/unknown/path?param=value';
      const result = DeepLinkHandler.handleDeepLink(url);

      expect(result).toBe(false);
    });

    it('should return false for invalid URL', () => {
      const url = 'invalid-url';
      const result = DeepLinkHandler.handleDeepLink(url);

      expect(result).toBe(false);
    });
  });

  describe('setupDeepLinkListeners', () => {
    it('should set up deep link listeners', async () => {
      const mockSubscription = { remove: jest.fn() };
      const mockEventListener = jest.fn();
      
      mockLinking.getInitialURL.mockResolvedValue('healthdashboard:/auth/reset-password?oobCode=abc123&mode=resetPassword');
      mockLinking.addEventListener.mockReturnValue(mockSubscription as any);

      const cleanup = DeepLinkHandler.setupDeepLinkListeners();

      // Verify initial URL handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify event listener setup
      expect(mockLinking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));

      // Test the cleanup function
      cleanup();
      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should handle initial URL error gracefully', () => {
      mockLinking.getInitialURL.mockRejectedValue(new Error('URL error'));
      
      expect(() => {
        DeepLinkHandler.setupDeepLinkListeners();
      }).not.toThrow();
    });

    it('should handle incoming URL events', () => {
      const mockSubscription = { remove: jest.fn() };
      let urlEventHandler: (event: { url: string }) => void;
      
      mockLinking.addEventListener.mockImplementation((event, handler) => {
        urlEventHandler = handler;
        return mockSubscription as any;
      });

      DeepLinkHandler.setupDeepLinkListeners();

      // Simulate incoming URL event
      const testEvent = { url: 'healthdashboard:/auth/reset-password?oobCode=xyz789&mode=resetPassword' };
      urlEventHandler!(testEvent);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Login', {
        resetCode: 'xyz789',
        mode: 'resetPassword',
      });
    });
  });

  describe('utility methods', () => {
    it('should create password reset URL', () => {
      const oobCode = 'test-code-123';
      const url = DeepLinkHandler.createPasswordResetURL(oobCode);

      expect(url).toBe('healthdashboard:/auth/reset-password?oobCode=test-code-123&mode=resetPassword');
    });

    it('should validate deep link URLs', () => {
      const validUrl = 'healthdashboard:/auth/reset-password';
      const invalidUrl = 'https://example.com';

      expect(DeepLinkHandler.isValidDeepLink(validUrl)).toBe(true);
      expect(DeepLinkHandler.isValidDeepLink(invalidUrl)).toBe(false);
    });

    it('should return supported paths', () => {
      const paths = DeepLinkHandler.getSupportedPaths();
      expect(paths).toContain('/auth/reset-password');
      expect(paths).toHaveLength(1);
    });
  });
});