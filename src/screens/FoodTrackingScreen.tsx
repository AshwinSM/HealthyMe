import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaContainer } from '../components/layout';
import { MealCategoryCard } from '../components/ui';
import { MealCategory, MealType } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore, useNutritionStore, useFoodEntries, useMealProgress, useCurrentDate, useNutritionLoading, useNutritionError } from '../stores';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type FoodTrackingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FoodTrackingScreen: React.FC = () => {
  const navigation = useNavigation<FoodTrackingNavigationProp>();
  const { user } = useAuthStore();
  const nutritionStore = useNutritionStore();
  const foodEntries = useFoodEntries();
  const mealProgress = useMealProgress();
  const currentDate = useCurrentDate();
  const isLoading = useNutritionLoading();
  const error = useNutritionError();

  const [mealCategories, setMealCategories] = useState<MealCategory[]>([]);

  // Calculate meal categories from nutrition store data
  const calculateMealCategories = (): MealCategory[] => {
    // Default calorie allocations (could be moved to user settings later)
    const defaultAllocations = {
      breakfast: 400,
      morning_snack: 150,
      lunch: 500,
      evening_snack: 150,
      dinner: 600
    };

    return [
      {
        type: 'breakfast',
        name: 'Breakfast',
        currentCalories: mealProgress.breakfast?.calories || 0,
        allocatedCalories: defaultAllocations.breakfast,
        itemCount: foodEntries.filter(entry => entry.mealType === 'breakfast' && entry.date === currentDate).length,
      },
      {
        type: 'morning_snack',
        name: 'Morning Snack',
        currentCalories: mealProgress.morning_snack?.calories || 0,
        allocatedCalories: defaultAllocations.morning_snack,
        itemCount: foodEntries.filter(entry => entry.mealType === 'morning_snack' && entry.date === currentDate).length,
      },
      {
        type: 'lunch',
        name: 'Lunch',
        currentCalories: mealProgress.lunch?.calories || 0,
        allocatedCalories: defaultAllocations.lunch,
        itemCount: foodEntries.filter(entry => entry.mealType === 'lunch' && entry.date === currentDate).length,
      },
      {
        type: 'evening_snack',
        name: 'Evening Snack',
        currentCalories: mealProgress.evening_snack?.calories || 0,
        allocatedCalories: defaultAllocations.evening_snack,
        itemCount: foodEntries.filter(entry => entry.mealType === 'evening_snack' && entry.date === currentDate).length,
      },
      {
        type: 'dinner',
        name: 'Dinner',
        currentCalories: mealProgress.dinner?.calories || 0,
        allocatedCalories: defaultAllocations.dinner,
        itemCount: foodEntries.filter(entry => entry.mealType === 'dinner' && entry.date === currentDate).length,
      },
    ];
  };

  useEffect(() => {
    // Initialize nutrition store and load data when component mounts
    if (user && !nutritionStore.isInitialized) {
      nutritionStore.initializeNutrition();
    }
  }, [user]);

  // Refresh data when screen comes into focus (e.g., after adding food)
  // Temporarily removed to fix infinite loop issue
  // useFocusEffect(
  //   useCallback(() => {
  //     if (user && nutritionStore.isInitialized) {
  //       console.log('FoodTrackingScreen focused, refreshing data...');
  //       nutritionStore.loadFoodEntriesForDate(currentDate);
  //     }
  //   }, [user, currentDate])
  // );

  useEffect(() => {
    // Update meal categories when food data changes
    setMealCategories(calculateMealCategories());
  }, [mealProgress, foodEntries, currentDate]);

  const handleMealCategoryPress = useCallback((mealType: MealType) => {
    // Navigate to food entry screen for the selected meal type
    console.log(`Navigate to food entry for: ${mealType}`);
    
    // Use a longer delay to ensure all animations complete before navigation
    setTimeout(() => {
      try {
        navigation.navigate('FoodEntry', { 
          mealType,
          date: currentDate 
        });
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 200); // Increased delay to allow animations to complete
  }, [navigation, currentDate]);

  const getTotalCalories = () => {
    const dailyNutrition = nutritionStore.dailyNutrition[currentDate];
    return dailyNutrition?.totalCalories || 0;
  };

  const getTotalAllocatedCalories = () => {
    return nutritionStore.nutritionGoals.calories || 2000;
  };

  const getRemainingCalories = () => {
    return getTotalAllocatedCalories() - getTotalCalories();
  };

  if (isLoading) {
    return (
      <SafeAreaContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your meals...</Text>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today's Meals</Text>
          <View style={styles.totalCalories}>
            <Text style={styles.totalCaloriesText}>
              {getTotalCalories()} / {getTotalAllocatedCalories()} cal
            </Text>
            <Text style={styles.remainingText}>
              {getRemainingCalories()} cal remaining
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error loading food data: {error}
            </Text>
          </View>
        )}

        <View style={styles.mealCategoriesContainer}>
          {mealCategories.map((category) => (
            <MealCategoryCard
              key={category.type}
              category={category}
              onPress={handleMealCategoryPress}
              testID={`meal-category-${category.type}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  totalCalories: {
    alignItems: 'flex-start',
  },
  totalCaloriesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter-SemiBold',
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  mealCategoriesContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
    fontFamily: 'Inter-Regular',
  },
});