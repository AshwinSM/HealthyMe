import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

interface DeepLinkConfig {
  scheme: string;
  paths: {
    passwordReset: string;
  };
}

const DEEP_LINK_CONFIG: DeepLinkConfig = {
  scheme: 'healthdashboard',
  paths: {
    passwordReset: '/auth/reset-password',
  },
};

export interface ParsedDeepLink {
  path: string;
  params: Record<string, string>;
}

export class DeepLinkHandler {
  private static navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

  /**
   * Set navigation reference for deep link navigation
   */
  static setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  /**
   * Parse deep link URL into path and parameters
   */
  static parseDeepLink(url: string): ParsedDeepLink | null {
    try {
      const urlObj = new URL(url);
      
      // Check if this is our app's scheme
      if (urlObj.protocol !== `${DEEP_LINK_CONFIG.scheme}:`) {
        return null;
      }

      const path = urlObj.pathname;
      const params: Record<string, string> = {};

      // Extract query parameters
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return { path, params };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Handle password reset deep link
   */
  static handlePasswordResetLink(params: Record<string, string>): boolean {
    const { oobCode, mode } = params;

    // Validate required parameters for password reset
    if (!oobCode || mode !== 'resetPassword') {
      console.error('Invalid password reset parameters:', params);
      return false;
    }

    // Navigate to reset password screen if navigation is available
    if (this.navigationRef?.isReady()) {
      try {
        // Navigate to Login screen with reset parameters
        this.navigationRef.navigate('Login', { 
          resetCode: oobCode,
          mode: 'resetPassword' 
        });
        return true;
      } catch (error) {
        console.error('Error navigating to reset password:', error);
        return false;
      }
    }

    // Store reset code for later use if navigation isn't ready
    this.pendingResetCode = oobCode;
    return true;
  }

  private static pendingResetCode: string | null = null;

  /**
   * Process pending reset code when navigation becomes ready
   */
  static processPendingResetCode(): boolean {
    if (this.pendingResetCode && this.navigationRef?.isReady()) {
      const success = this.handlePasswordResetLink({
        oobCode: this.pendingResetCode,
        mode: 'resetPassword'
      });
      
      if (success) {
        this.pendingResetCode = null;
      }
      
      return success;
    }
    return false;
  }

  /**
   * Handle incoming deep link URL
   */
  static handleDeepLink(url: string): boolean {
    console.log('Handling deep link:', url);

    const parsedLink = this.parseDeepLink(url);
    if (!parsedLink) {
      console.warn('Unable to parse deep link:', url);
      return false;
    }

    const { path, params } = parsedLink;

    switch (path) {
      case DEEP_LINK_CONFIG.paths.passwordReset:
        return this.handlePasswordResetLink(params);
      
      default:
        console.warn('Unknown deep link path:', path);
        return false;
    }
  }

  /**
   * Set up deep link listeners
   */
  static setupDeepLinkListeners(): () => void {
    // Handle initial URL if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial deep link URL:', url);
        // Delay handling to ensure navigation is ready
        setTimeout(() => {
          this.handleDeepLink(url);
        }, 1000);
      }
    }).catch((error) => {
      console.error('Error getting initial URL:', error);
    });

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link received:', event.url);
      this.handleDeepLink(event.url);
    });

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  }

  /**
   * Create password reset deep link URL (for testing)
   */
  static createPasswordResetURL(oobCode: string): string {
    const url = new URL(`${DEEP_LINK_CONFIG.scheme}:${DEEP_LINK_CONFIG.paths.passwordReset}`);
    url.searchParams.set('oobCode', oobCode);
    url.searchParams.set('mode', 'resetPassword');
    return url.toString();
  }

  /**
   * Check if URL is a valid deep link for this app
   */
  static isValidDeepLink(url: string): boolean {
    const parsedLink = this.parseDeepLink(url);
    return parsedLink !== null;
  }

  /**
   * Get supported deep link paths
   */
  static getSupportedPaths(): string[] {
    return Object.values(DEEP_LINK_CONFIG.paths);
  }
}

export default DeepLinkHandler;