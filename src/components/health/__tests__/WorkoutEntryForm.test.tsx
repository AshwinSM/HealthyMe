import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { WorkoutEntryForm } from '../WorkoutEntryForm';
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

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const mockWorkoutTypes = [
  { type: 'cardio', name: 'Cardio', category: 'cardio', icon: '❤️', baseCaloriesPerMinute: 8, intensityMultipliers: { low: 0.7, medium: 1.0, high: 1.3 } },
  { type: 'running', name: 'Running', category: 'cardio', icon: '🏃', baseCaloriesPerMinute: 12, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.4 } },
  { type: 'strength', name: 'Strength Training', category: 'strength', icon: '💪', baseCaloriesPerMinute: 6, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } }
];

const mockActivityService = activityTrackingService as jest.Mocked<typeof activityTrackingService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('WorkoutEntryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser } as any);

    // Mock service methods
    mockActivityService.getWorkoutTypes.mockReturnValue(mockWorkoutTypes);
    mockActivityService.getWorkoutTypeInfo.mockImplementation((type) =>
      mockWorkoutTypes.find(t => t.type === type)
    );
    mockActivityService.validateWorkoutDuration.mockReturnValue({ isValid: true });
    mockActivityService.calculateWorkoutCalories.mockReturnValue(300);
    mockActivityService.createWorkoutEntry.mockResolvedValue({
      success: true,
      data: {
        id: 'test-id',
        userId: 'test-user-id',
        type: 'running',
        name: 'Morning Run',
        duration: 30,
        intensity: 'medium',
        caloriesBurned: 300,
        date: '2024-01-01',
        timestamp: {} as any,
        createdAt: {} as any
      },
      timestamp: {} as any
    });
  });

  it('renders correctly with initial state', () => {
    render(<WorkoutEntryForm />);

    expect(screen.getByText('Log Workout')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Workout Type *')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g., Morning Run, Chest Day')).toBeTruthy();
    expect(screen.getByText('Log Workout')).toBeTruthy();
  });

  it('renders in edit mode when existing entry is provided', () => {
    const existingEntry = {
      id: 'existing-id',
      userId: 'test-user-id',
      type: 'running' as const,
      name: 'Evening Run',
      duration: 45,
      intensity: 'high' as const,
      caloriesBurned: 450,
      date: '2024-01-01',
      timestamp: {} as any,
      createdAt: {} as any,
      notes: 'Great run!'
    };

    render(<WorkoutEntryForm existingEntry={existingEntry} />);

    expect(screen.getByText('Edit Workout')).toBeTruthy();
    expect(screen.getByDisplayValue('Evening Run')).toBeTruthy();
    expect(screen.getByDisplayValue('45')).toBeTruthy();
    expect(screen.getByDisplayValue('Great run!')).toBeTruthy();
    expect(screen.getByText('Update Workout')).toBeTruthy();
  });

  it('handles category selection', () => {
    render(<WorkoutEntryForm />);

    const strengthCategory = screen.getByText('Strength');
    fireEvent.press(strengthCategory);

    // Should show strength workout types
    expect(screen.getByText('Strength Training')).toBeTruthy();
  });

  it('handles workout type selection and auto-suggests name', () => {
    render(<WorkoutEntryForm />);

    const runningType = screen.getByText('Running');
    fireEvent.press(runningType);

    // Should auto-fill the workout name
    expect(screen.getByDisplayValue('Running')).toBeTruthy();
  });

  it('validates required fields', () => {
    mockActivityService.validateWorkoutDuration.mockReturnValue({
      isValid: false,
      message: 'Duration is required'
    });

    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, ''); // Empty name

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '0'); // Invalid duration

    const submitButton = screen.getByText('Log Workout');
    expect(submitButton).toBeDisabled();
  });

  it('shows calorie estimate when form is filled', () => {
    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    expect(screen.getByText('Estimated Calories Burned')).toBeTruthy();
    expect(screen.getByText('300 calories')).toBeTruthy();
  });

  it('handles intensity selection', () => {
    render(<WorkoutEntryForm />);

    const highIntensity = screen.getByText('High');
    fireEvent.press(highIntensity);

    // Should recalculate calories with high intensity
    expect(mockActivityService.calculateWorkoutCalories).toHaveBeenCalledWith(
      'cardio',
      'high',
      expect.any(Number)
    );
  });

  it('shows optional fields for cardio workouts', () => {
    render(<WorkoutEntryForm />);

    // Select running which should show distance field
    const runningType = screen.getByText('Running');
    fireEvent.press(runningType);

    expect(screen.getByText('Distance (km)')).toBeTruthy();
    expect(screen.getByPlaceholderText('5.0')).toBeTruthy();
  });

  it('shows optional fields for strength workouts', () => {
    render(<WorkoutEntryForm />);

    // First switch to strength category
    const strengthCategory = screen.getByText('Strength');
    fireEvent.press(strengthCategory);

    // Then select strength training
    const strengthType = screen.getByText('Strength Training');
    fireEvent.press(strengthType);

    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('Weight (kg)')).toBeTruthy();
  });

  it('submits form successfully for new entry', async () => {
    const onSuccess = jest.fn();
    render(<WorkoutEntryForm onSuccess={onSuccess} />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Morning Run');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.createWorkoutEntry).toHaveBeenCalledWith(
        'test-user-id',
        'cardio',
        'Morning Run',
        30,
        'medium',
        '2024-01-01',
        expect.objectContaining({
          notes: undefined
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success! 💪',
        expect.stringContaining('Morning Run logged!'),
        [{ text: 'OK' }]
      );
    });
  });

  it('submits form successfully for updating existing entry', async () => {
    const existingEntry = {
      id: 'existing-id',
      userId: 'test-user-id',
      type: 'running' as const,
      name: 'Evening Run',
      duration: 45,
      intensity: 'high' as const,
      caloriesBurned: 450,
      date: '2024-01-01',
      timestamp: {} as any,
      createdAt: {} as any
    };

    mockActivityService.updateWorkoutEntry.mockResolvedValue({
      success: true,
      data: { ...existingEntry, duration: 60 },
      timestamp: {} as any
    });

    const onSuccess = jest.fn();
    render(<WorkoutEntryForm existingEntry={existingEntry} onSuccess={onSuccess} />);

    const durationInput = screen.getByDisplayValue('45');
    fireEvent.changeText(durationInput, '60');

    const submitButton = screen.getByText('Update Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.updateWorkoutEntry).toHaveBeenCalledWith(
        'existing-id',
        expect.objectContaining({
          duration: 60,
          type: 'running',
          intensity: 'high'
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('includes optional fields in submission', async () => {
    const onSuccess = jest.fn();
    render(<WorkoutEntryForm onSuccess={onSuccess} />);

    // Switch to strength category
    const strengthCategory = screen.getByText('Strength');
    fireEvent.press(strengthCategory);

    const strengthType = screen.getByText('Strength Training');
    fireEvent.press(strengthType);

    const nameInput = screen.getByDisplayValue('Strength Training');
    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '45');

    // Fill optional fields
    const setsInput = screen.getByPlaceholderText('3');
    fireEvent.changeText(setsInput, '4');

    const repsInput = screen.getByPlaceholderText('12');
    fireEvent.changeText(repsInput, '10');

    const weightInput = screen.getByPlaceholderText('50');
    fireEvent.changeText(weightInput, '75');

    const notesInput = screen.getByPlaceholderText(/e.g., new personal record/);
    fireEvent.changeText(notesInput, 'Great session!');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockActivityService.createWorkoutEntry).toHaveBeenCalledWith(
        'test-user-id',
        'strength',
        'Strength Training',
        45,
        'medium',
        '2024-01-01',
        expect.objectContaining({
          sets: 4,
          reps: 10,
          weight: 75,
          notes: 'Great session!'
        })
      );
    });
  });

  it('handles submission errors gracefully', async () => {
    mockActivityService.createWorkoutEntry.mockResolvedValue({
      success: false,
      error: 'TEST_ERROR',
      message: 'Test error message',
      timestamp: {} as any
    });

    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Test error message');
    });
  });

  it('handles user not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({ user: null } as any);

    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'User not authenticated');
    });
  });

  it('handles cancel action', () => {
    const onCancel = jest.fn();
    render(<WorkoutEntryForm onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('respects character limit for notes', () => {
    render(<WorkoutEntryForm />);

    const notesInput = screen.getByPlaceholderText(/e.g., new personal record/);
    const longText = 'a'.repeat(350); // Exceeds 300 character limit

    fireEvent.changeText(notesInput, longText);

    // Should be truncated by TextInput maxLength prop
    expect(screen.getByText('300/300')).toBeTruthy();
  });

  it('resets form after successful submission for new entries', async () => {
    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeTruthy(); // Form should be reset
    });
  });

  it('validates form prevents submission with invalid data', () => {
    mockActivityService.validateWorkoutDuration.mockReturnValue({
      isValid: false,
      message: 'Invalid duration'
    });

    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test'); // Valid name

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '-10'); // Invalid duration

    const submitButton = screen.getByText('Log Workout');

    // Button should be disabled due to invalid input
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockActivityService.createWorkoutEntry.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {} as any,
        timestamp: {} as any
      }), 100))
    );

    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    const submitButton = screen.getByText('Log Workout');
    fireEvent.press(submitButton);

    // Should show loading state
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('updates calorie estimate when workout parameters change', () => {
    render(<WorkoutEntryForm />);

    const nameInput = screen.getByPlaceholderText('e.g., Morning Run, Chest Day');
    fireEvent.changeText(nameInput, 'Test Workout');

    const durationInput = screen.getByPlaceholderText('30');
    fireEvent.changeText(durationInput, '30');

    // Initial calculation
    expect(mockActivityService.calculateWorkoutCalories).toHaveBeenCalledWith(
      'cardio',
      'medium',
      30
    );

    // Change intensity
    const highIntensity = screen.getByText('High');
    fireEvent.press(highIntensity);

    // Should recalculate with new intensity
    expect(mockActivityService.calculateWorkoutCalories).toHaveBeenCalledWith(
      'cardio',
      'high',
      30
    );
  });
});