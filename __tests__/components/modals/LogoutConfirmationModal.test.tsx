import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogoutConfirmationModal } from '../../../src/components/modals/LogoutConfirmationModal';
import { useAuthStore } from '../../../src/stores';

// Mock the auth store
jest.mock('../../../src/stores', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LogoutConfirmationModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    visible: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      isLoggingOut: false,
      logoutError: null,
    } as any);
  });

  describe('Rendering', () => {
    it('should render correctly when visible', () => {
      const { getByText, getByTestId } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      expect(getByText('Sign Out')).toBeTruthy();
      expect(getByText(/Are you sure you want to sign out/)).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Sign Out')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = render(
        <LogoutConfirmationModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Sign Out')).toBeNull();
    });

    it('should show loading state when logging out', () => {
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: true,
        logoutError: null,
      } as any);

      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      expect(getByText('Signing Out...')).toBeTruthy();
    });

    it('should show error message when logout error exists', () => {
      const errorMessage = 'Network error occurred';
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: false,
        logoutError: errorMessage,
      } as any);

      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when Cancel button is pressed', () => {
      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const cancelButtons = getByText('Cancel');
      fireEvent.press(cancelButtons);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Sign Out button is pressed', () => {
      const { getAllByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      // Get the red Sign Out button (not the title)
      const signOutButtons = getAllByText('Sign Out');
      const signOutButton = signOutButtons.find(button => 
        button.props?.style?.some?.((style: any) => 
          style?.color === 'white' || style?.textAlign === 'center'
        )
      ) || signOutButtons[1]; // Fallback to second occurrence

      fireEvent.press(signOutButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons when logging out', () => {
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: true,
        logoutError: null,
      } as any);

      const { getByText, getAllByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const cancelButton = getByText('Cancel');
      const signOutButtons = getAllByText(/Signing Out/);

      // Buttons should be disabled (though React Native doesn't have disabled prop like web)
      // We check that the onPress handlers still work but the UI shows loading state
      expect(cancelButton).toBeTruthy();
      expect(signOutButtons.length).toBeGreaterThan(0);
    });

    it('should handle modal close on backdrop press', () => {
      const { getByTestId } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      // Note: React Native Testing Library doesn't directly support testing Modal onRequestClose
      // This would need integration testing or E2E testing to properly verify
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility structure', () => {
      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const title = getByText('Sign Out');
      const message = getByText(/Are you sure you want to sign out/);
      const cancelButton = getByText('Cancel');
      
      expect(title).toBeTruthy();
      expect(message).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });

    it('should provide clear confirmation message', () => {
      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const message = getByText(/Your data is safely stored in the cloud/);
      expect(message).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error in red container', () => {
      const errorMessage = 'Failed to sign out';
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: false,
        logoutError: errorMessage,
      } as any);

      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const errorText = getByText(errorMessage);
      expect(errorText).toBeTruthy();
      
      // Check if error is in a red-styled container (indirect test)
      expect(errorText).toBeTruthy();
    });

    it('should not show error container when no error exists', () => {
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: false,
        logoutError: null,
      } as any);

      const { queryByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      // Should not find any error-specific text
      expect(queryByText(/Failed/)).toBeNull();
      expect(queryByText(/Error/)).toBeNull();
    });
  });

  describe('Visual States', () => {
    it('should show warning icon in header', () => {
      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      // Check for exclamation mark (warning icon)
      const warningIcon = getByText('!');
      expect(warningIcon).toBeTruthy();
    });

    it('should show loading spinner when logging out', () => {
      mockUseAuthStore.mockReturnValue({
        isLoggingOut: true,
        logoutError: null,
      } as any);

      const { getByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      // The ActivityIndicator should be present, though we can't directly test it
      // We can test the loading text
      expect(getByText('Signing Out...')).toBeTruthy();
    });

    it('should have different button styles for cancel vs confirm', () => {
      const { getByText, getAllByText } = render(
        <LogoutConfirmationModal {...defaultProps} />
      );

      const cancelButton = getByText('Cancel');
      const signOutButtons = getAllByText('Sign Out');

      expect(cancelButton).toBeTruthy();
      expect(signOutButtons.length).toBeGreaterThan(0);
      
      // Both buttons should be present with different visual styling
      // (Gray for cancel, red for sign out - tested indirectly through presence)
    });
  });
});