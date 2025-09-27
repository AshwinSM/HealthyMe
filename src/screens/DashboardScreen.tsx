import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { ProfileHeader } from '../components/ui/ProfileHeader';
import { FoodTrackingCard } from '../components/ui/FoodTrackingCard';
import { TrackerCard } from '../components/ui/TrackerCard';
import { WaterTrackingCard } from '../components/ui/WaterTrackingCard';
import { useNutritionStore, useDailyNutrition, useNutritionGoals, useCurrentDate } from '../stores/nutritionStore';
import {
  useHealthMetricsStore,
  useCurrentWeight,
  useDailyWaterIntake,
  useDailySteps,
  useDailyActivities,
  useWaterGoal,
  useStepsGoal,
  useActivityGoal
} from '../stores/healthMetricsStore';
import { useAuthStore } from '../stores/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Nutrition store hooks
  const { initializeNutrition, calculateDailyNutrition } = useNutritionStore();
  const dailyNutrition = useDailyNutrition();
  const nutritionGoals = useNutritionGoals();
  const currentDate = useCurrentDate();

  // Health metrics store hooks
  const { initializeHealthMetrics, calculateDailyProgress, getWaterProgress, getStepsProgress, getActivityProgress } = useHealthMetricsStore();
  const currentWeight = useCurrentWeight();
  const dailyWaterIntake = useDailyWaterIntake();
  const dailySteps = useDailySteps();
  const dailyActivities = useDailyActivities();
  const waterGoal = useWaterGoal();
  const stepsGoal = useStepsGoal();
  const activityGoal = useActivityGoal();

  // Auth store hooks
  const { user, isAuthenticated, isInitialized } = useAuthStore();


  const handleUpgradePress = () => {
    console.log('Upgrade pressed');
    // Future: Navigate to upgrade screen
  };

  const handleDatePress = () => {
    console.log('Date selector pressed');
    // Future: Show date picker
  };

  const handleFoodTrackPress = () => {
    navigation.navigate('FoodTracking');
  };

  const handleTrackerPress = (tracker: string) => {
    console.log(`${tracker} tracker pressed`);
    // Future: Navigate to detailed tracker view
  };

  const handleWaterPress = () => {
    console.log('Water tracking pressed');
    // Future: Navigate to water tracking screen
  };

  const handleWaterAdd = () => {
    console.log('Water add pressed');
    // Future: Add water intake
  };

  // Calculate macronutrient percentages based on goals
  const calculateMacroPercentages = () => {
    const todayNutrition = dailyNutrition[currentDate];

    if (!todayNutrition || !todayNutrition.totalMacros) {
      return {
        protein: 0,
        fats: 0,
        carbs: 0,
        fiber: 0,
      };
    }

    const { totalMacros } = todayNutrition;
    const goals = nutritionGoals;

    return {
      protein: Math.round((totalMacros.protein / goals.protein) * 100),
      fats: Math.round((totalMacros.fat / goals.fat) * 100),
      carbs: Math.round((totalMacros.carbs / goals.carbs) * 100),
      fiber: Math.round((totalMacros.fiber / goals.fiber) * 100),
    };
  };

  // Memoized current nutrition data
  const currentNutrition = useMemo(() => {
    // Temporary: Use hardcoded data to test if the issue is with store data or component rendering
    const isTestMode = false; // Set to false once stores are working

    if (isTestMode && isAuthenticated) {
      return {
        caloriesConsumed: 1250, // Test data
        nutrition: {
          protein: 75,
          fats: 45,
          carbs: 65,
          fiber: 80,
        },
      };
    }

    const macroPercentages = calculateMacroPercentages();
    const todayNutrition = dailyNutrition[currentDate];
    const totalCalories = todayNutrition?.totalCalories || 0;

    return {
      caloriesConsumed: totalCalories,
      nutrition: macroPercentages,
    };
  }, [dailyNutrition, currentDate, nutritionGoals, isAuthenticated]);

  // Memoized health metrics data
  const healthMetricsData = useMemo(() => {
    // Temporary: Use hardcoded data to test if the issue is with store data or component rendering
    const isTestMode = false; // Set to false once stores are working

    if (isTestMode && isAuthenticated) {
      return {
        weight: { value: '70 kg', progress: 0.7 },
        workout: { value: '45 min', progress: 0.9 },
        steps: { value: '8,500 steps', progress: 0.85 },
        sleep: { value: '7.5 hrs', progress: 0.75 },
        water: { currentIntake: 1.8, goalIntake: 2.0, progress: 0.9 },
      };
    }

    // Weight data
    const weightData = {
      value: currentWeight ? `${currentWeight} kg` : 'No data',
      progress: 0.5, // Default progress, could be calculated based on weight goals
    };

    // Workout data (from activities)
    const totalActivityMinutes = dailyActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    const activityProgress = getActivityProgress();
    const workoutData = {
      value: totalActivityMinutes > 0 ? `${totalActivityMinutes} min` : 'No workouts',
      progress: activityProgress / 100,
    };

    // Steps data
    const stepsProgress = getStepsProgress();
    const stepsData = {
      value: dailySteps > 0 ? `${dailySteps.toLocaleString()} steps` : 'No steps',
      progress: stepsProgress / 100,
    };

    // Sleep data (placeholder for now since we don't have sleep tracking yet)
    const sleepData = {
      value: 'No data',
      progress: 0,
    };

    // Water data
    const waterProgress = getWaterProgress();
    const waterData = {
      currentIntake: dailyWaterIntake / 1000, // Convert mL to L
      goalIntake: waterGoal / 1000, // Convert mL to L
      progress: waterProgress / 100,
    };

    return {
      weight: weightData,
      workout: workoutData,
      steps: stepsData,
      sleep: sleepData,
      water: waterData,
    };
  }, [currentWeight, dailyActivities, dailySteps, dailyWaterIntake, waterGoal, stepsGoal, activityGoal, isAuthenticated]);

  useEffect(() => {
    // Only initialize stores if user is authenticated
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Initialize nutrition and health metrics stores
    const initializeData = async () => {
      try {
        await Promise.all([
          initializeNutrition(),
          initializeHealthMetrics(),
        ]);

        // Use today's date for calculations
        const todayDate = new Date().toISOString().split('T')[0];
        calculateDailyNutrition(todayDate);
        calculateDailyProgress(todayDate);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();

    // Smooth entrance animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <SafeAreaView style={styles.container} testID="dashboard-screen">
      {/* Profile Header */}
      <ProfileHeader
        userName={user?.displayName || 'User'}
        avatarUri={user?.photoURL}
        onUpgradePress={handleUpgradePress}
      />

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[styles.content, { opacity: fadeAnim }]}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Your Trackers</Text>

          {/* Food Tracking Card */}
          <FoodTrackingCard
            caloriesConsumed={currentNutrition.caloriesConsumed}
            targetCalories={nutritionGoals.calories}
            nutrition={{
              protein: currentNutrition.nutrition.protein,
              fats: currentNutrition.nutrition.fats,
              carbs: currentNutrition.nutrition.carbs,
              fiber: currentNutrition.nutrition.fiber,
            }}
            onTrackPress={handleFoodTrackPress}
            onAddPress={handleFoodTrackPress}
          />

          {/* Tracker Cards */}
          <TrackerCard
            type="weight"
            title="Weight"
            value={healthMetricsData.weight.value}
            progress={healthMetricsData.weight.progress}
            onPress={() => handleTrackerPress('Weight')}
          />

          <TrackerCard
            type="workout"
            title="Workout"
            value={healthMetricsData.workout.value}
            progress={healthMetricsData.workout.progress}
            onPress={() => handleTrackerPress('Workout')}
          />

          <TrackerCard
            type="steps"
            title="Steps"
            value={healthMetricsData.steps.value}
            progress={healthMetricsData.steps.progress}
            onPress={() => handleTrackerPress('Steps')}
          />

          <TrackerCard
            type="sleep"
            title="Sleep"
            value={healthMetricsData.sleep.value}
            progress={healthMetricsData.sleep.progress}
            onPress={() => handleTrackerPress('Sleep')}
          />

          <WaterTrackingCard
            currentIntake={healthMetricsData.water.currentIntake}
            goalIntake={healthMetricsData.water.goalIntake}
            unit="L"
            onPress={handleWaterPress}
            onAddPress={handleWaterAdd}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Clean light gray background
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100, // Extra space for bottom navigation
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    marginTop: 8,
  },
});