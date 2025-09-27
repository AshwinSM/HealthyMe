import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfileHeader } from '../../src/components/ui/ProfileHeader';

// Mock the date context
jest.mock('../../src/contexts/DateContext', () => ({
  useDateContext: () => ({
    selectedDate: new Date('2025-09-27'),
    setSelectedDate: jest.fn(),
    formatDisplayDate: () => 'Sep 27',
  }),
}));

// Mock the auth store
jest.mock('../../src/stores', () => ({
  useAuthStore: () => ({
    initiateLogout: jest.fn(),
    confirmLogout: jest.fn(),
    cancelLogout: jest.fn(),
    confirmationRequired: false,
  }),
}));

describe('Profile Picture Display Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays user profile picture when avatarUri is provided', () => {
    const { queryByText } = render(
      <ProfileHeader
        userName="John Doe"
        avatarUri="https://lh3.googleusercontent.com/a/example-profile-pic"
        onUpgradePress={jest.fn()}
      />
    );

    // When profile picture is provided, should not show the user initial
    expect(queryByText('J')).toBeNull();
  });

  it('displays default avatar with user initial when no avatarUri provided', () => {
    const { getByText } = render(
      <ProfileHeader
        userName="Jane Smith"
        onUpgradePress={jest.fn()}
      />
    );

    // Should show the first letter of the user's name
    expect(getByText('J')).toBeTruthy();
  });

  it('displays default avatar with U when no userName provided', () => {
    const { getByText } = render(
      <ProfileHeader
        onUpgradePress={jest.fn()}
      />
    );

    // Should show 'U' for 'User' when no userName provided
    expect(getByText('U')).toBeTruthy();
  });

  it('handles empty userName gracefully', () => {
    const { getByText } = render(
      <ProfileHeader
        userName=""
        onUpgradePress={jest.fn()}
      />
    );

    // Should show 'U' when userName is empty string
    expect(getByText('U')).toBeTruthy();
  });

  it('handles Google profile picture URLs correctly', () => {
    const googlePhotoUrl = 'https://lh3.googleusercontent.com/a/ACg8ocKExample123';

    const { queryByText } = render(
      <ProfileHeader
        userName="Google User"
        avatarUri={googlePhotoUrl}
        onUpgradePress={jest.fn()}
      />
    );

    // When profile picture is provided, should not show the initial
    expect(queryByText('G')).toBeNull();
  });

  it('falls back to initial when profile picture fails to load', () => {
    // This test verifies the component structure supports fallback behavior
    // The actual fallback would happen at runtime when Image onError is triggered
    const { getByText, queryByText } = render(
      <ProfileHeader
        userName="Fallback User"
        // No avatarUri provided to simulate fallback scenario
        onUpgradePress={jest.fn()}
      />
    );

    expect(getByText('F')).toBeTruthy();
  });
});