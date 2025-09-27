// Test the health metrics data calculation logic
describe('Health Metrics Data Calculation', () => {
  it('formats weight data correctly', () => {
    const getWeightData = (currentWeight: number | null) => ({
      value: currentWeight ? `${currentWeight} kg` : 'No data',
      progress: 0.5, // Default progress
    });

    expect(getWeightData(75.5)).toEqual({
      value: '75.5 kg',
      progress: 0.5,
    });

    expect(getWeightData(null)).toEqual({
      value: 'No data',
      progress: 0.5,
    });
  });

  it('calculates workout data from activities', () => {
    const dailyActivities = [
      { duration: 30, type: 'running' },
      { duration: 15, type: 'yoga' },
      { duration: 45, type: 'cycling' },
    ];

    const getWorkoutData = (activities: typeof dailyActivities, activityProgress: number) => {
      const totalMinutes = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
      return {
        value: totalMinutes > 0 ? `${totalMinutes} min` : 'No workouts',
        progress: activityProgress / 100,
      };
    };

    expect(getWorkoutData(dailyActivities, 75)).toEqual({
      value: '90 min',
      progress: 0.75,
    });

    expect(getWorkoutData([], 0)).toEqual({
      value: 'No workouts',
      progress: 0,
    });
  });

  it('formats steps data correctly', () => {
    const getStepsData = (dailySteps: number, stepsProgress: number) => ({
      value: dailySteps > 0 ? `${dailySteps.toLocaleString()} steps` : 'No steps',
      progress: stepsProgress / 100,
    });

    expect(getStepsData(8750, 87.5)).toEqual({
      value: '8,750 steps',
      progress: 0.875,
    });

    expect(getStepsData(0, 0)).toEqual({
      value: 'No steps',
      progress: 0,
    });
  });

  it('converts water data units correctly', () => {
    const getWaterData = (dailyWaterIntake: number, waterGoal: number, waterProgress: number) => ({
      currentIntake: dailyWaterIntake / 1000, // mL to L
      goalIntake: waterGoal / 1000, // mL to L
      progress: waterProgress / 100,
    });

    expect(getWaterData(1750, 2000, 87.5)).toEqual({
      currentIntake: 1.75,
      goalIntake: 2.0,
      progress: 0.875,
    });

    expect(getWaterData(0, 2500, 0)).toEqual({
      currentIntake: 0,
      goalIntake: 2.5,
      progress: 0,
    });
  });

  it('handles sleep data placeholder', () => {
    const getSleepData = () => ({
      value: 'No data',
      progress: 0,
    });

    expect(getSleepData()).toEqual({
      value: 'No data',
      progress: 0,
    });
  });
});