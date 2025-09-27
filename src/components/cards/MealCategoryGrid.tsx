import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MealType } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { useNutritionStore } from '../../stores/nutritionStore';
import MealCategoryCard from './MealCategoryCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

const MealCategoryGrid: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Subscribe to nutrition store data
  const { 
    selectedDate, 
    mealProgress, 
    nutritionGoals, 
    isLoading 
  } = useNutritionStore((state) => ({
    selectedDate: state.currentDate,
    mealProgress: state.mealProgress,
    nutritionGoals: state.nutritionGoals,
    isLoading: state.isLoading
  }));

  // Define meal categories configuration
  const mealCategories = [
    {
      type: 'breakfast' as MealType,
      allocatedCalories: Math.round(nutritionGoals.calories * 0.25), // 25% for breakfast
    },
    {
      type: 'morning_snack' as MealType,
      allocatedCalories: Math.round(nutritionGoals.calories * 0.10), // 10% for morning snack
    },
    {
      type: 'lunch' as MealType,
      allocatedCalories: Math.round(nutritionGoals.calories * 0.30), // 30% for lunch
    },
    {
      type: 'evening_snack' as MealType,
      allocatedCalories: Math.round(nutritionGoals.calories * 0.10), // 10% for evening snack
    },
    {
      type: 'dinner' as MealType,
      allocatedCalories: Math.round(nutritionGoals.calories * 0.25), // 25% for dinner
    },
  ];

  const handleCategoryPress = useCallback((mealType: MealType) => {
    navigation.navigate('FoodEntry', { 
      mealType,
      date: selectedDate 
    });
  }, [navigation, selectedDate]);

  // Calculate card width based on screen size and meal type
  const getCardStyle = (mealType: MealType) => {
    if (mealType === 'morning_snack') {
      // Morning snack spans full width in the layout
      return {
        width: screenWidth - 40 as any, // Convert to any to satisfy ViewStyle
        marginBottom: 16,
      };
    }
    
    // Other cards take half width with gap
    const availableWidth = screenWidth - 40; // Account for container padding
    const gapWidth = 16; // Gap between cards
    const cardWidth = (availableWidth - gapWidth) / 2;
    
    return {
      width: cardWidth,
      marginBottom: 16,
    };
  };

  return (
    <View style={styles.container} testID="meal-category-grid">
      <View style={styles.gridContainer}>
        {/* First row: Breakfast and Morning Snack */}
        <View style={styles.row}>
          <View style={getCardStyle('breakfast')}>
            <MealCategoryCard
              mealType="breakfast"
              currentCalories={mealProgress.breakfast?.calories || 0}
              allocatedCalories={mealCategories[0].allocatedCalories}
              mealCount={Object.keys(mealProgress.breakfast || {}).length}
              onPress={handleCategoryPress}
              isLoading={isLoading}
            />
          </View>
        </View>

        {/* Second row: Morning Snack (full width) */}
        <View style={styles.row}>
          <View style={getCardStyle('morning_snack')}>
            <MealCategoryCard
              mealType="morning_snack"
              currentCalories={mealProgress.morning_snack?.calories || 0}
              allocatedCalories={mealCategories[1].allocatedCalories}
              mealCount={Object.keys(mealProgress.morning_snack || {}).length}
              onPress={handleCategoryPress}
              isLoading={isLoading}
            />
          </View>
        </View>

        {/* Third row: Lunch and Evening Snack */}
        <View style={styles.row}>
          <View style={getCardStyle('lunch')}>
            <MealCategoryCard
              mealType="lunch"
              currentCalories={mealProgress.lunch?.calories || 0}
              allocatedCalories={mealCategories[2].allocatedCalories}
              mealCount={Object.keys(mealProgress.lunch || {}).length}
              onPress={handleCategoryPress}
              isLoading={isLoading}
            />
          </View>
          <View style={getCardStyle('evening_snack')}>
            <MealCategoryCard
              mealType="evening_snack"
              currentCalories={mealProgress.evening_snack?.calories || 0}
              allocatedCalories={mealCategories[3].allocatedCalories}
              mealCount={Object.keys(mealProgress.evening_snack || {}).length}
              onPress={handleCategoryPress}
              isLoading={isLoading}
            />
          </View>
        </View>

        {/* Fourth row: Dinner */}
        <View style={styles.row}>
          <View style={getCardStyle('dinner')}>
            <MealCategoryCard
              mealType="dinner"
              currentCalories={mealProgress.dinner?.calories || 0}
              allocatedCalories={mealCategories[4].allocatedCalories}
              mealCount={Object.keys(mealProgress.dinner || {}).length}
              onPress={handleCategoryPress}
              isLoading={isLoading}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  gridContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});

export default MealCategoryGrid;