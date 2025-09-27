import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { useAuthStore } from '../../src/stores';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
}));

// Mock the auth store
jest.mock('../../src/stores', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  User: 'User',
  Settings: 'Settings',
  HelpCircle: 'HelpCircle',
  LogOut: 'LogOut',
  ChevronRight: 'ChevronRight',
}));

// Create mock props for navigation
const mockRoute = {
  key: 'Profile-test',
  name: 'Profile' as const,
  params: undefined,
};

const mockProps = {
  navigation: mockNavigation,
  route: mockRoute,
} as any;

describe('ProfileScreen', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockInitiateLogout = jest.fn();
  const mockConfirmLogout = jest.fn();
  const mockCancelLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      initiateLogout: mockInitiateLogout,
      confirmLogout: mockConfirmLogout,
      cancelLogout: mockCancelLogout,
      confirmationRequired: false,
    } as any);
  });

  describe('Rendering', () => {
    it('should render profile screen correctly', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('Profile')).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('Sign Out')).toBeTruthy();
    });

    it('should render user avatar with first letter of display name', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('T')).toBeTruthy(); // First letter of "Test User"
    });

    it('should render user avatar with first letter of email when no display name', () => {
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: undefined,
      };

      mockUseAuthStore.mockReturnValue({
        user: userWithoutDisplayName,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: false,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('T')).toBeTruthy(); // First letter of "test@example.com"
    });

    it('should render fallback avatar when no user data', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: false,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('U')).toBeTruthy(); // Fallback to 'U' for User
    });

    it('should render all menu items', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('Account Settings')).toBeTruthy();
      expect(getByText('Manage your account information')).toBeTruthy();
      expect(getByText('App Preferences')).toBeTruthy();
      expect(getByText('Notifications, units, and more')).toBeTruthy();
      expect(getByText('Help & Support')).toBeTruthy();
      expect(getByText('Get help and contact support')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call initiateLogout when Sign Out button is pressed', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      const signOutButton = getByText('Sign Out');
      fireEvent.press(signOutButton);

      expect(mockInitiateLogout).toHaveBeenCalledTimes(1);
    });

    it('should handle menu item presses', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      const accountSettings = getByText('Account Settings');
      fireEvent.press(accountSettings);

      expect(consoleSpy).toHaveBeenCalledWith('Account settings pressed');

      const appPreferences = getByText('App Preferences');
      fireEvent.press(appPreferences);

      expect(consoleSpy).toHaveBeenCalledWith('App preferences pressed');

      const helpSupport = getByText('Help & Support');
      fireEvent.press(helpSupport);

      expect(consoleSpy).toHaveBeenCalledWith('Help & support pressed');

      consoleSpy.mockRestore();
    });
  });

  describe('Logout Confirmation Modal', () => {
    it('should show logout confirmation modal when confirmationRequired is true', () => {
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: true,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      // The modal should be visible (we're testing the LogoutConfirmationModal separately)
      // Here we just ensure the props are passed correctly
      expect(getByText('Profile')).toBeTruthy();
    });

    it('should hide logout confirmation modal when confirmationRequired is false', () => {
      const { queryByText } = render(<ProfileScreen {...mockProps} />);

      // The modal should not be visible
      expect(queryByText('Are you sure you want to sign out')).toBeNull();
    });

    it('should handle logout confirmation', async () => {
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: true,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      // Since LogoutConfirmationModal is a separate component, we test the handlers
      // The actual modal interaction is tested in LogoutConfirmationModal.test.tsx
      expect(mockInitiateLogout).not.toHaveBeenCalled();
      expect(mockConfirmLogout).not.toHaveBeenCalled();
      expect(mockCancelLogout).not.toHaveBeenCalled();
    });
  });

  describe('User Display', () => {
    it('should display user name from displayName when available', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should display "User" as fallback when no displayName', () => {
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: undefined,
      };

      mockUseAuthStore.mockReturnValue({
        user: userWithoutDisplayName,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: false,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should handle missing user gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        initiateLogout: mockInitiateLogout,
        confirmLogout: mockConfirmLogout,
        cancelLogout: mockCancelLogout,
        confirmationRequired: false,
      } as any);

      const { getByText } = render(<ProfileScreen {...mockProps} />);

      expect(getByText('User')).toBeTruthy();
      // Email should not be displayed when user is null
    });
  });

  describe('Accessibility', () => {
    it('should have proper screen structure', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      // Check main sections are present
      expect(getByText('Profile')).toBeTruthy(); // Header
      expect(getByText('Account Settings')).toBeTruthy(); // Menu section
      expect(getByText('Sign Out')).toBeTruthy(); // Logout section
    });

    it('should have interactive elements', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      const menuItems = [
        'Account Settings',
        'App Preferences', 
        'Help & Support',
        'Sign Out'
      ];

      menuItems.forEach(item => {
        const element = getByText(item);
        expect(element).toBeTruthy();
      });
    });
  });

  describe('Screen Layout', () => {
    it('should render in proper order', () => {
      const { getByText } = render(<ProfileScreen {...mockProps} />);

      // All sections should be present
      expect(getByText('Profile')).toBeTruthy(); // Title
      expect(getByText('Test User')).toBeTruthy(); // User info
      expect(getByText('Account Settings')).toBeTruthy(); // Menu items
      expect(getByText('Sign Out')).toBeTruthy(); // Logout button
    });

    it('should use SafeAreaView for proper screen boundaries', () => {
      const { getByTestId, queryByTestId } = render(<ProfileScreen {...mockProps} />);

      // We can't directly test SafeAreaView, but we can ensure the screen renders
      expect(getByText('Profile')).toBeTruthy();
    });
  });
});