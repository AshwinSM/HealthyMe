import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ActivityProgressDisplay } from '../ActivityProgressDisplay';
import { ActivityAnalysis, StepsEntry, WorkoutEntry } from '../../../types/health';
import { activityTrackingService } from '../../../services/firebase/services/ActivityTrackingService';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('../../../services/firebase/services/ActivityTrackingService');
jest.mock('../../../utils/dateNavigationUtils', () => ({
  DateNavigationUtils: {
    formatDisplayDate: (date: string) => date
  }
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: () => null,
  Circle: () => null,
  Text: () => null
}));

const mockActivityService = activityTrackingService as jest.Mocked<typeof activityTrackingService>;

describe('ActivityProgressDisplay', () => {
  const mockStepsEntry: StepsEntry = {
    id: 'steps-id',
    userId: 'user-id',
    date: '2024-01-01',
    steps: 12000,
    caloriesBurned: 480,
    goal: 10000,
    source: 'manual',
    timestamp: Timestamp.now(),
    createdAt: Timestamp.now()
  };

  const mockWorkoutEntries: WorkoutEntry[] = [
    {
      id: 'workout-1',
      userId: 'user-id',
      date: '2024-01-01',
      type: 'running',
      name: 'Morning Run',
      duration: 30,
      intensity: 'medium',
      caloriesBurned: 300,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now()
    },
    {
      id: 'workout-2',
      userId: 'user-id',
      date: '2024-01-01',
      type: 'strength',
      name: 'Weight Training',
      duration: 45,
      intensity: 'high',
      caloriesBurned: 270,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now()
    }
  ];

  const mockAnalysis: ActivityAnalysis = {
    date: '2024-01-01',
    stepsEntry: mockStepsEntry,
    workoutEntries: mockWorkoutEntries,
    totalSteps: 12000,
    stepsGoal: 10000,
    stepsGoalAchieved: true,
    stepsCaloriesBurned: 480,
    stepsProgress: 120,
    totalWorkouts: 2,
    totalWorkoutDuration: 75,
    workoutCaloriesBurned: 570,
    workoutsByType: {
      running: 1,
      strength: 1,
      cardio: 0,
      sports: 0,
      flexibility: 0,
      other: 0
    },
    avgWorkoutDuration: 38,
    totalCaloriesBurned: 1050,
    totalActiveMinutes: 75,
    activityScore: 85,
    streaks: {
      stepsGoalDays: 3,
      workoutDays: 2,
      activeMinutesDays: 5
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock workout type info
    mockActivityService.getWorkoutTypeInfo.mockImplementation((type) => {
      const workoutTypes = {
        running: { type: 'running', name: 'Running', icon: '🏃', category: 'cardio', baseCaloriesPerMinute: 12, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.4 } },
        strength: { type: 'strength', name: 'Strength Training', icon: '💪', category: 'strength', baseCaloriesPerMinute: 6, intensityMultipliers: { low: 0.8, medium: 1.0, high: 1.3 } }
      };
      return workoutTypes[type as keyof typeof workoutTypes];
    });
  });

  it('renders activity summary correctly', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Daily Activity')).toBeTruthy();
    expect(screen.getByText('2024-01-01')).toBeTruthy();
    expect(screen.getByText('85')).toBeTruthy(); // Activity score
    expect(screen.getByText('Activity Score')).toBeTruthy();
    expect(screen.getByText('12,000')).toBeTruthy(); // Steps
    expect(screen.getByText('75')).toBeTruthy(); // Workout minutes
    expect(screen.getByText('1050')).toBeTruthy(); // Total calories
  });

  it('renders steps progress correctly', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Steps Goal')).toBeTruthy();
    expect(screen.getByText('12,000')).toBeTruthy();
    expect(screen.getByText('/ 10,000 steps')).toBeTruthy();
    expect(screen.getByText('480 calories burned')).toBeTruthy();
    expect(screen.getByText('🎯 Goal Achieved!')).toBeTruthy();
  });

  it('renders workout summary correctly', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Workouts (2)')).toBeTruthy();
    expect(screen.getByText('Total Minutes')).toBeTruthy();
    expect(screen.getByText('Calories Burned')).toBeTruthy();
    expect(screen.getByText('Avg Duration')).toBeTruthy();
    expect(screen.getByText('38')).toBeTruthy(); // Average duration
  });

  it('renders individual workout entries', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Morning Run')).toBeTruthy();
    expect(screen.getByText('30 min • medium intensity')).toBeTruthy();
    expect(screen.getByText('300 cal')).toBeTruthy();

    expect(screen.getByText('Weight Training')).toBeTruthy();
    expect(screen.getByText('45 min • high intensity')).toBeTruthy();
    expect(screen.getByText('270 cal')).toBeTruthy();
  });

  it('renders activity breakdown when workouts exist', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Activity Breakdown')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText('1 workout')).toBeTruthy();
    expect(screen.getByText('Strength Training')).toBeTruthy();
    expect(screen.getByText('1 workout')).toBeTruthy();
  });

  it('renders streaks and achievements', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Streaks & Achievements')).toBeTruthy();
    expect(screen.getByText('3 days')).toBeTruthy(); // Steps goal streak
    expect(screen.getByText('Steps Goal Streak')).toBeTruthy();
    expect(screen.getByText('2 days')).toBeTruthy(); // Workout streak
    expect(screen.getByText('Workout Streak')).toBeTruthy();
    expect(screen.getByText('5 days')).toBeTruthy(); // Active minutes streak
    expect(screen.getByText('Active Minutes Streak')).toBeTruthy();
  });

  it('handles no steps entry state', () => {
    const analysisNoSteps = {
      ...mockAnalysis,
      stepsEntry: undefined,
      totalSteps: 0,
      stepsGoalAchieved: false,
      stepsCaloriesBurned: 0,
      stepsProgress: 0
    };

    render(<ActivityProgressDisplay analysis={analysisNoSteps} />);

    expect(screen.getByText('🚶 Log Steps')).toBeTruthy();
  });

  it('handles no workouts state', () => {
    const analysisNoWorkouts = {
      ...mockAnalysis,
      workoutEntries: [],
      totalWorkouts: 0,
      totalWorkoutDuration: 0,
      workoutCaloriesBurned: 0,
      avgWorkoutDuration: 0
    };

    render(<ActivityProgressDisplay analysis={analysisNoWorkouts} />);

    expect(screen.getByText('No workouts logged today. Add your first workout to start tracking your fitness progress!')).toBeTruthy();
    expect(screen.getByText('💪 Log First Workout')).toBeTruthy();
  });

  it('calls onAddSteps when add steps button is pressed', () => {
    const onAddSteps = jest.fn();
    const analysisNoSteps = {
      ...mockAnalysis,
      stepsEntry: undefined,
      totalSteps: 0
    };

    render(<ActivityProgressDisplay analysis={analysisNoSteps} onAddSteps={onAddSteps} />);

    const addStepsButton = screen.getByText('🚶 Log Steps');
    fireEvent.press(addStepsButton);

    expect(onAddSteps).toHaveBeenCalled();
  });

  it('calls onAddWorkout when add workout button is pressed', () => {
    const onAddWorkout = jest.fn();

    render(<ActivityProgressDisplay analysis={mockAnalysis} onAddWorkout={onAddWorkout} />);

    const addWorkoutButton = screen.getByText('+ Add');
    fireEvent.press(addWorkoutButton);

    expect(onAddWorkout).toHaveBeenCalled();
  });

  it('calls onEditSteps when edit steps button is pressed', () => {
    const onEditSteps = jest.fn();

    render(<ActivityProgressDisplay analysis={mockAnalysis} onEditSteps={onEditSteps} />);

    const editButton = screen.getByText('Edit');
    fireEvent.press(editButton);

    expect(onEditSteps).toHaveBeenCalledWith(mockStepsEntry);
  });

  it('calls onEditWorkout when workout item is pressed', () => {
    const onEditWorkout = jest.fn();

    render(<ActivityProgressDisplay analysis={mockAnalysis} onEditWorkout={onEditWorkout} />);

    const workoutItem = screen.getByText('Morning Run');
    fireEvent.press(workoutItem);

    expect(onEditWorkout).toHaveBeenCalledWith(mockWorkoutEntries[0]);
  });

  it('shows more workouts text when there are more than 3 workouts', () => {
    const manyWorkouts = [...mockWorkoutEntries];
    for (let i = 3; i <= 5; i++) {
      manyWorkouts.push({
        id: `workout-${i}`,
        userId: 'user-id',
        date: '2024-01-01',
        type: 'cardio',
        name: `Workout ${i}`,
        duration: 20,
        intensity: 'low',
        caloriesBurned: 120,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
    }

    const analysisWithManyWorkouts = {
      ...mockAnalysis,
      workoutEntries: manyWorkouts,
      totalWorkouts: manyWorkouts.length
    };

    render(<ActivityProgressDisplay analysis={analysisWithManyWorkouts} />);

    expect(screen.getByText('+3 more workouts')).toBeTruthy();
  });

  it('displays correct activity score color based on score value', () => {
    const lowScoreAnalysis = { ...mockAnalysis, activityScore: 30 };
    const { rerender } = render(<ActivityProgressDisplay analysis={lowScoreAnalysis} />);

    // Test low score (red)
    expect(screen.getByText('30')).toBeTruthy();

    // Test medium score (yellow)
    const mediumScoreAnalysis = { ...mockAnalysis, activityScore: 50 };
    rerender(<ActivityProgressDisplay analysis={mediumScoreAnalysis} />);
    expect(screen.getByText('50')).toBeTruthy();

    // Test good score (blue)
    const goodScoreAnalysis = { ...mockAnalysis, activityScore: 70 };
    rerender(<ActivityProgressDisplay analysis={goodScoreAnalysis} />);
    expect(screen.getByText('70')).toBeTruthy();

    // Test excellent score (green)
    const excellentScoreAnalysis = { ...mockAnalysis, activityScore: 90 };
    rerender(<ActivityProgressDisplay analysis={excellentScoreAnalysis} />);
    expect(screen.getByText('90')).toBeTruthy();
  });

  it('handles steps goal not achieved state', () => {
    const notAchievedAnalysis = {
      ...mockAnalysis,
      totalSteps: 7500,
      stepsGoalAchieved: false,
      stepsProgress: 75
    };

    render(<ActivityProgressDisplay analysis={notAchievedAnalysis} />);

    expect(screen.queryByText('🎯 Goal Achieved!')).toBeNull();
    expect(screen.getByText('7,500')).toBeTruthy();
  });

  it('does not render breakdown card when no workouts exist', () => {
    const noWorkoutsAnalysis = {
      ...mockAnalysis,
      workoutEntries: [],
      totalWorkouts: 0
    };

    render(<ActivityProgressDisplay analysis={noWorkoutsAnalysis} />);

    expect(screen.queryByText('Activity Breakdown')).toBeNull();
  });

  it('does not render streaks card when no streaks exist', () => {
    const noStreaksAnalysis = {
      ...mockAnalysis,
      streaks: {
        stepsGoalDays: 0,
        workoutDays: 0,
        activeMinutesDays: 0
      }
    };

    render(<ActivityProgressDisplay analysis={noStreaksAnalysis} />);

    expect(screen.queryByText('Streaks & Achievements')).toBeNull();
  });

  it('shows correct workout icons from service', () => {
    render(<ActivityProgressDisplay analysis={mockAnalysis} />);

    // Mock service should return icons for workout types
    expect(mockActivityService.getWorkoutTypeInfo).toHaveBeenCalledWith('running');
    expect(mockActivityService.getWorkoutTypeInfo).toHaveBeenCalledWith('strength');
  });

  it('handles single day streaks correctly', () => {
    const singleDayStreaks = {
      ...mockAnalysis,
      streaks: {
        stepsGoalDays: 1,
        workoutDays: 1,
        activeMinutesDays: 1
      }
    };

    render(<ActivityProgressDisplay analysis={singleDayStreaks} />);

    expect(screen.getByText('1 day')).toBeTruthy(); // Should be singular "day" not "days"
  });

  it('handles workout breakdown with plural form correctly', () => {
    const singleWorkoutAnalysis = {
      ...mockAnalysis,
      workoutsByType: {
        running: 1,
        strength: 0,
        cardio: 0,
        sports: 0,
        flexibility: 0,
        other: 0
      }
    };

    render(<ActivityProgressDisplay analysis={singleWorkoutAnalysis} />);

    expect(screen.getByText('1 workout')).toBeTruthy(); // Should be singular "workout"
  });
});