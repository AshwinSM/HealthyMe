import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { CalorieProgressRing } from './CalorieProgressRing';
import { MacroProgressSection } from './MacroProgressSection';
import { DailySummaryCards } from './DailySummaryCards';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useAuthStore } from '../../stores/authStore';

// Types for dashboard data
export interface CalorieData {
  current: number;
  goal: number;
  percentage: number;
  status: 'under' | 'met' | 'over';
  remaining: number;
}

export interface MacroInfo {
  currentGrams: number;
  goalGrams: number;
  currentCalories: number;
  percentageOfTotal: number;
  goalAchievementStatus: 'under' | 'met' | 'over';
}

export interface MacroData {
  protein: MacroInfo;
  carbs: MacroInfo;
  fats: MacroInfo;
  fiber: { current: number; goal: number };
}

export interface NutritionDashboardData {
  date: string;
  calorieData: CalorieData;
  macroData: MacroData;
  summary: {
    mealsLogged: number;
    totalFoods: number;
    lastUpdated: Date;
    completionScore: number;
  };
}

// Helper function to determine calorie status
const getCalorieStatus = (current: number, goal: number): 'under' | 'met' | 'over' => {
  const percentage = (current / goal) * 100;
  if (percentage < 90) return 'under';
  if (percentage <= 110) return 'met';
  return 'over';
};

// Helper function to calculate macro information
const calculateMacroInfo = (
  macroType: 'protein' | 'carbs' | 'fats',
  currentNutrition: any,
  goals: any,
  totalCalories: number
): MacroInfo => {
  const currentGrams = currentNutrition[macroType] || 0;
  const goalGrams = goals[macroType] || 0;

  // Calculate calories from macros (protein/carbs: 4 cal/g, fats: 9 cal/g)
  const caloriesPerGram = macroType === 'fats' ? 9 : 4;
  const currentCalories = currentGrams * caloriesPerGram;

  // Calculate percentage of total calories
  const percentageOfTotal = totalCalories > 0 ? (currentCalories / totalCalories) * 100 : 0;

  // Determine goal achievement status
  const percentage = goalGrams > 0 ? (currentGrams / goalGrams) * 100 : 0;
  let goalAchievementStatus: 'under' | 'met' | 'over';

  if (percentage < 70) goalAchievementStatus = 'under';
  else if (percentage <= 130) goalAchievementStatus = 'met';
  else goalAchievementStatus = 'over';

  return {
    currentGrams,
    goalGrams,
    currentCalories,
    percentageOfTotal,
    goalAchievementStatus
  };
};

export const NutritionDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const {
    currentDate,
    dailyNutrition,
    nutritionGoals,
    isLoading,
    error,
    loadFoodEntriesForDate,
    foodEntries
  } = useNutritionStore();

  const [refreshing, setRefreshing] = useState(false);

  // Load nutrition data when component mounts or date changes
  useEffect(() => {
    if (user) {
      loadFoodEntriesForDate(currentDate);
    }
  }, [user, currentDate, loadFoodEntriesForDate]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await loadFoodEntriesForDate(currentDate);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate dashboard data
  const dashboardData: NutritionDashboardData = useMemo(() => {
    const totalNutrition = dailyNutrition || {
      totalCalories: 0,
      totalMacros: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    };

    const goals = nutritionGoals || {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      fiber: 25
    };

    // Calculate calorie data
    const calorieData: CalorieData = {
      current: totalNutrition.totalCalories,
      goal: goals.calories,
      percentage: goals.calories > 0 ? (totalNutrition.totalCalories / goals.calories) * 100 : 0,
      status: getCalorieStatus(totalNutrition.totalCalories, goals.calories),
      remaining: Math.max(0, goals.calories - totalNutrition.totalCalories)
    };

    // Calculate macro data
    const macroData: MacroData = {
      protein: calculateMacroInfo('protein', totalNutrition.totalMacros, goals, totalNutrition.totalCalories),
      carbs: calculateMacroInfo('carbs', totalNutrition.totalMacros, goals, totalNutrition.totalCalories),
      fats: calculateMacroInfo('fats', { fats: totalNutrition.totalMacros.fat }, { fats: goals.fat }, totalNutrition.totalCalories),
      fiber: {
        current: totalNutrition.totalMacros.fiber,
        goal: goals.fiber
      }
    };

    // Calculate summary data
    const todayEntries = foodEntries.filter(entry => entry.date === currentDate);
    const mealTypes = new Set(todayEntries.map(entry => entry.mealType));

    const summary = {
      mealsLogged: mealTypes.size,
      totalFoods: todayEntries.length,
      lastUpdated: new Date(),
      completionScore: Math.min(100, Math.round((calorieData.percentage +
        (macroData.protein.goalAchievementStatus === 'met' ? 25 : 0) +
        (macroData.carbs.goalAchievementStatus === 'met' ? 25 : 0) +
        (macroData.fats.goalAchievementStatus === 'met' ? 25 : 0)) / 4))
    };

    return {
      date: currentDate,
      calorieData,
      macroData,
      summary
    };
  }, [dailyNutrition, nutritionGoals, currentDate, foodEntries]);

  // Error state
  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load nutrition data</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Loading overlay */}
      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading nutrition data...</Text>
        </View>
      )}

      {/* Calorie Progress Ring */}
      <View style={styles.calorieRingContainer}>
        <CalorieProgressRing data={dashboardData.calorieData} />
      </View>

      {/* Macro Progress Section */}
      <View style={styles.macroSectionContainer}>
        <MacroProgressSection data={dashboardData.macroData} />
      </View>

      {/* Daily Summary Cards */}
      <View style={styles.summaryContainer}>
        <DailySummaryCards data={dashboardData.summary} />
      </View>

      {/* Date info */}
      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          Data for {new Date(currentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  calorieRingContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  macroSectionContainer: {
    marginBottom: 32,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  dateInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});