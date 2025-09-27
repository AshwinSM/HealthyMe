import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { StepsEntryForm } from '../StepsEntryForm';
import { activityTrackingService } from '../../../services/firebase/services/ActivityTrackingService';
import { useAuthStore } from '../../../stores/authStore';

// Mock dependencies
jest.mock('../../../services/firebase/services/ActivityTrackingService');
jest.mock('../../../stores/authStore');
jest.mock('../../../utils/dateNavigationUtils', () => ({
  DateNavigationUtils: {
    getTodayString: () => '2024-01-01',
    formatDisplayDate: (date: string) => date,
    isValidDateString: (date: string) => date.match(/^\d{4}-\d{2}-\d{2}$/),
    isFutureDate: (date: string) => false
  }
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

// Mock Vibration
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Vibration: {
    vibrate: jest.fn()
  }
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  dailyStepsGoal: 10000
};

const mockActivityService = activityTrackingService as jest.Mocked<typeof activityTrackingService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('StepsEntryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser } as any);

    // Mock service methods
    mockActivityService.validateSteps.mockReturnValue({ isValid: true });
    mockActivityService.calculateStepsCalories.mockReturnValue(400);
    mockActivityService.createStepsEntry.mockResolvedValue({
      success: true,
      data: {
        id: 'test-id',
        userId: 'test-user-id',
        steps: 10000,
        caloriesBurned: 400,
        goal: 10000,
        source: 'manual',
        date: '2024-01-01',
        timestamp: {} as any,
        createdAt: {} as any
      },
      timestamp: {} as any
    });
  });

  it('renders correctly with initial state', () => {
    render(<StepsEntryForm />);

    expect(screen.getByText('Log Daily Steps')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g., 10,000')).toBeTruthy();
    expect(screen.getByText('Log Steps')).toBeTruthy();
  });

  it('renders in edit mode when existing entry is provided', () => {
    const existingEntry = {
      id: 'existing-id',
      userId: 'test-user-id',
      steps: 8000,
      caloriesBurned: 320,
      goal: 10000,
      source: 'manual' as const,
      date: '2024-01-01',
      timestamp: {} as any,
      createdAt: {} as any,
      notes: 'Walked to work'
    };

    render(<StepsEntryForm existingEntry={existingEntry} />);

    expect(screen.getByText('Edit Steps Entry')).toBeTruthy();
    expect(screen.getByDisplayValue('8000')).toBeTruthy();
    expect(screen.getByDisplayValue('Walked to work')).toBeTruthy();
    expect(screen.getByText('Update Steps')).toBeTruthy();
  });

  it('handles quick steps selection', () => {
    render(<StepsEntryForm />);

    const quickStepsButton = screen.getByText('10,000');
    fireEvent.press(quickStepsButton);

    // Should update the input field
    expect(screen.getByDisplayValue('10000')).toBeTruthy();
  });

  it('validates steps input correctly', () => {
    mockActivityService.validateSteps.mockReturnValue({
      isValid: false,
      message: 'Invalid steps value'
    });

    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '-100');

    expect(mockActivityService.validateSteps).toHaveBeenCalledWith(-100);
  });

  it('shows calorie estimate when steps are entered', () => {
    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    expect(screen.getByText('≈ 400 calories burned')).toBeTruthy();
    expect(screen.getByText('100% of daily goal')).toBeTruthy();
  });

  it('submits form successfully for new entry', async () => {
    const onSuccess = jest.fn();
    render(<StepsEntryForm onSuccess={onSuccess} />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.createStepsEntry).toHaveBeenCalledWith(
        'test-user-id',
        10000,
        '2024-01-01',
        10000,
        undefined
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success! 🎯',
        '10,000 steps logged! You burned approximately 400 calories.',
        [{ text: 'OK' }]
      );
    });
  });

  it('submits form successfully for updating existing entry', async () => {
    const existingEntry = {
      id: 'existing-id',
      userId: 'test-user-id',
      steps: 8000,
      caloriesBurned: 320,
      goal: 10000,
      source: 'manual' as const,
      date: '2024-01-01',
      timestamp: {} as any,
      createdAt: {} as any
    };

    mockActivityService.updateStepsEntry.mockResolvedValue({
      success: true,
      data: { ...existingEntry, steps: 12000, caloriesBurned: 480 },
      timestamp: {} as any
    });

    const onSuccess = jest.fn();
    render(<StepsEntryForm existingEntry={existingEntry} onSuccess={onSuccess} />);

    const input = screen.getByDisplayValue('8000');
    fireEvent.changeText(input, '12000');

    const submitButton = screen.getByText('Update Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.updateStepsEntry).toHaveBeenCalledWith(
        'existing-id',
        {
          steps: 12000,
          goal: 10000,
          notes: undefined
        }
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles submission errors gracefully', async () => {
    mockActivityService.createStepsEntry.mockResolvedValue({
      success: false,
      error: 'TEST_ERROR',
      message: 'Test error message',
      timestamp: {} as any
    });

    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Test error message');
    });
  });

  it('prevents submission with invalid steps', () => {
    mockActivityService.validateSteps.mockReturnValue({
      isValid: false,
      message: 'Invalid steps'
    });

    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '-100');

    const submitButton = screen.getByText('Log Steps');

    // Button should be disabled due to invalid input
    expect(submitButton).toBeDisabled();
  });

  it('handles user not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({ user: null } as any);

    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'User not authenticated');
    });
  });

  it('handles cancel action', () => {
    const onCancel = jest.fn();
    render(<StepsEntryForm onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('includes notes in submission', async () => {
    const onSuccess = jest.fn();
    render(<StepsEntryForm onSuccess={onSuccess} />);

    const stepsInput = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(stepsInput, '10000');

    const notesInput = screen.getByPlaceholderText(/e.g., walked to work/);
    fireEvent.changeText(notesInput, 'Great walk today!');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.createStepsEntry).toHaveBeenCalledWith(
        'test-user-id',
        10000,
        '2024-01-01',
        10000,
        'Great walk today!'
      );
    });
  });

  it('respects character limit for notes', () => {
    render(<StepsEntryForm />);

    const notesInput = screen.getByPlaceholderText(/e.g., walked to work/);
    const longText = 'a'.repeat(250); // Exceeds 200 character limit

    fireEvent.changeText(notesInput, longText);

    // Should be truncated by TextInput maxLength prop
    expect(screen.getByText('200/200')).toBeTruthy();
  });

  it('shows goal achievement message for completed goals', () => {
    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '15000'); // Exceeds default goal of 10000

    expect(screen.getByText('150% of daily goal')).toBeTruthy();
  });

  it('resets form after successful submission for new entries', async () => {
    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeTruthy(); // Form should be reset
    });
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockActivityService.createStepsEntry.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {} as any,
        timestamp: {} as any
      }), 100))
    );

    render(<StepsEntryForm />);

    const input = screen.getByPlaceholderText('e.g., 10,000');
    fireEvent.changeText(input, '10000');

    const submitButton = screen.getByText('Log Steps');
    fireEvent.press(submitButton);

    // Should show loading state
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });
});