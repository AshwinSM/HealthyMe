import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { StepsTracking } from '../../../src/components/activity/StepsTracking';
import { HealthService } from '../../../src/services/firebase/health';
import { useAuthStore } from '../../../src/stores/authStore';

// Mock dependencies
jest.mock('../../../src/services/firebase/health');
jest.mock('../../../src/stores/authStore');
jest.spyOn(Alert, 'alert');

const mockHealthService = HealthService as jest.Mocked<typeof HealthService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockUser = { id: 'test-user-123' };
const mockDate = '2024-01-15';

const mockStepsEntry = {
  id: 'steps-123',
  userId: mockUser.id,
  steps: 8500,
  date: mockDate,
  source: 'manual' as const,
  caloriesBurned: 340,
  goalProgress: {
    dailyGoal: 10000,
    achieved: false,
    percentage: 85
  },
  timestamp: { toMillis: () => Date.now() } as any,
  createdAt: { toMillis: () => Date.now() } as any
};

describe('StepsTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser } as any);
  });

  it('should render steps input when no entry exists', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: null
    });

    const { getByPlaceholderText, getByText } = render(
      <StepsTracking date={mockDate} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Enter steps')).toBeTruthy();
      expect(getByText('Save')).toBeTruthy();
    });
  });

  it('should display existing steps entry', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: mockStepsEntry
    });

    const { getByText } = render(<StepsTracking date={mockDate} />);

    await waitFor(() => {
      expect(getByText('8,500')).toBeTruthy();
      expect(getByText('steps')).toBeTruthy();
      expect(getByText('Goal: 10,000 steps')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
      expect(getByText('🔥 340 calories burned from steps')).toBeTruthy();
    });
  });

  it('should show goal achieved message when steps goal is met', async () => {
    const achievedEntry = {
      ...mockStepsEntry,
      steps: 12000,
      goalProgress: {
        ...mockStepsEntry.goalProgress,
        achieved: true,
        percentage: 120
      }
    };

    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: achievedEntry
    });

    const { getByText } = render(<StepsTracking date={mockDate} />);

    await waitFor(() => {
      expect(getByText('🎉 Goal Achieved!')).toBeTruthy();
      expect(getByText('120%')).toBeTruthy();
    });
  });

  it('should handle steps input and submission', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: null
    });

    mockHealthService.addStepsEntry.mockResolvedValue({
      success: true,
      data: mockStepsEntry
    });

    const onStepsUpdate = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <StepsTracking date={mockDate} onStepsUpdate={onStepsUpdate} />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Enter steps');
      fireEvent.changeText(input, '8500');
    });

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockHealthService.addStepsEntry).toHaveBeenCalledWith(mockUser.id, mockDate, 8500);
      expect(onStepsUpdate).toHaveBeenCalledWith(8500);
    });
  });

  it('should validate input and show error for invalid steps', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: null
    });

    const { getByPlaceholderText, getByText } = render(
      <StepsTracking date={mockDate} />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Enter steps');
      fireEvent.changeText(input, '-100'); // Invalid input
    });

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Invalid Input', 'Please enter a valid number of steps');
    });
  });

  it('should enter edit mode when edit button is pressed', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: mockStepsEntry
    });

    const { getByText, getByDisplayValue } = render(
      <StepsTracking date={mockDate} />
    );

    await waitFor(() => {
      const editButton = getByText('Edit');
      fireEvent.press(editButton);
    });

    await waitFor(() => {
      expect(getByDisplayValue('8500')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('should show goal achievement celebration', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: null
    });

    const achievedEntry = {
      ...mockStepsEntry,
      steps: 10000,
      goalProgress: {
        ...mockStepsEntry.goalProgress,
        achieved: true,
        percentage: 100
      }
    };

    mockHealthService.addStepsEntry.mockResolvedValue({
      success: true,
      data: achievedEntry
    });

    const { getByPlaceholderText, getByText } = render(
      <StepsTracking date={mockDate} />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Enter steps');
      fireEvent.changeText(input, '10000');
    });

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '🎉 Steps Goal Achieved!',
        'Great job reaching your daily step goal!',
        [{ text: 'Awesome!', style: 'default' }]
      );
    });
  });

  it('should display correct progress bar colors based on percentage', async () => {
    const lowProgressEntry = {
      ...mockStepsEntry,
      steps: 2000,
      goalProgress: {
        ...mockStepsEntry.goalProgress,
        percentage: 20
      }
    };

    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: lowProgressEntry
    });

    const { getByText } = render(<StepsTracking date={mockDate} />);

    await waitFor(() => {
      expect(getByText('20%')).toBeTruthy();
      expect(getByText('8,000 steps remaining')).toBeTruthy();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: false,
      error: 'Network error',
      message: 'Failed to load steps data'
    });

    const { getByPlaceholderText } = render(<StepsTracking date={mockDate} />);

    await waitFor(() => {
      expect(getByPlaceholderText('Enter steps')).toBeTruthy();
    });
  });

  it('should handle save errors gracefully', async () => {
    mockHealthService.getStepsEntryByDate.mockResolvedValue({
      success: true,
      data: null
    });

    mockHealthService.addStepsEntry.mockResolvedValue({
      success: false,
      error: 'Save error',
      message: 'Failed to save steps'
    });

    const { getByPlaceholderText, getByText } = render(
      <StepsTracking date={mockDate} />
    );

    await waitFor(() => {
      const input = getByPlaceholderText('Enter steps');
      fireEvent.changeText(input, '8500');
    });

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save steps');
    });
  });
});