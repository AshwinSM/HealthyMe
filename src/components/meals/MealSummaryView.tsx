import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { MealType, FoodEntry } from '../../types/health';
import { useHealthDataStore } from '../../stores/healthDataStore';
import { useAuthStore } from '../../stores/authStore';
import { FoodItemCard } from './FoodItemCard';
import { MealNutritionHeader } from './MealNutritionHeader';
import { MealEmptyState } from './MealEmptyState';
import { SelectionModeHeader } from './SelectionModeHeader';

// Data interfaces
export interface MealNutritionTotals {
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFats: number;
  totalFiber: number;
  totalSugar?: number;
  totalSodium?: number;
  itemCount: number;
  averageCaloriesPerItem: number;
}

export interface MealGoalProgress {
  calorieProgress: {
    current: number;
    allocated: number;
    percentage: number;
    status: 'under' | 'met' | 'over';
  };
  macroProgress: {
    protein: { current: number; percentage: number };
    carbohydrates: { current: number; percentage: number };
    fats: { current: number; percentage: number };
    fiber: { current: number; percentage: number };
  };
}

export interface MealSummary {
  mealType: MealType;
  date: string;
  foods: FoodEntry[];
  nutritionTotals: MealNutritionTotals;
  goalProgress: MealGoalProgress;
  lastUpdated: Timestamp;
  isEmpty: boolean;
}

interface MealSummaryViewProps {
  mealType: MealType;
  date: string;
  onAddFood: () => void;
  onEditFood: (food: FoodEntry) => void;
}

export const MealSummaryView: React.FC<MealSummaryViewProps> = ({
  mealType,
  date,
  onAddFood,
  onEditFood
}) => {
  const healthStore = useHealthDataStore();
  const authStore = useAuthStore();

  const [mealSummary, setMealSummary] = useState<MealSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load meal data when component mounts or props change
  useEffect(() => {
    loadMealData();
  }, [mealType, date]);

  // Update meal summary when store data changes
  useEffect(() => {
    const foods = healthStore.foodItems.filter(
      item => item.mealType === mealType && item.date === date
    );
    updateMealSummary(foods);
  }, [healthStore.foodItems, mealType, date]);

  const loadMealData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await healthStore.loadFoodItemsForDate(date);
      const foods = healthStore.foodItems.filter(
        item => item.mealType === mealType && item.date === date
      );
      updateMealSummary(foods);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMealSummary = (foods: FoodEntry[]) => {
    const nutritionTotals = calculateMealTotals(foods);
    const goalProgress = calculateGoalProgress(nutritionTotals, mealType);

    setMealSummary({
      mealType,
      date,
      foods,
      nutritionTotals,
      goalProgress,
      lastUpdated: Timestamp.now(),
      isEmpty: foods.length === 0
    });
  };

  const handleDeleteFood = async (foodId: string) => {
    const food = mealSummary?.foods.find(f => f.id === foodId);
    if (!food) return;

    Alert.alert(
      'Delete Food Entry',
      `Are you sure you want to delete "${food.foodName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await healthStore.deleteFoodItem(foodId);
            if (!success) {
              Alert.alert('Error', 'Failed to delete food entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Delete Selected Items',
      `Delete ${selectedItems.length} food entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);

            const promises = selectedItems.map(id =>
              healthStore.deleteFoodItem(id)
            );

            const results = await Promise.all(promises);
            const failedCount = results.filter(r => !r).length;

            if (failedCount > 0) {
              Alert.alert('Warning', `Failed to delete ${failedCount} items.`);
            }

            setSelectedItems([]);
            setIsSelectionMode(false);
            setIsLoading(false);
          }
        }
      ]
    );
  };

  const handleDuplicateFood = async (foodId: string) => {
    const food = mealSummary?.foods.find(f => f.id === foodId);
    if (!food || !authStore.user) return;

    const duplicateData: Omit<FoodEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: authStore.user.id,
      date,
      mealType,
      foodName: `${food.foodName} (Copy)`,
      brand: food.brand,
      quantity: food.quantity,
      unit: food.unit,
      nutrition: { ...food.nutrition },
      photoURL: food.photoURL,
      notes: food.notes
    };

    const success = await healthStore.addFoodItem(duplicateData);
    if (!success) {
      Alert.alert('Error', 'Failed to duplicate food entry.');
    }
  };

  const toggleItemSelection = (foodId: string) => {
    setSelectedItems(prev =>
      prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId]
    );
  };

  const calculateMealTotals = (foods: FoodEntry[]): MealNutritionTotals => {
    const totals = foods.reduce((acc, food) => ({
      totalCalories: acc.totalCalories + food.nutrition.calories,
      totalProtein: acc.totalProtein + food.nutrition.protein,
      totalCarbohydrates: acc.totalCarbohydrates + food.nutrition.carbs,
      totalFats: acc.totalFats + food.nutrition.fat,
      totalFiber: acc.totalFiber + food.nutrition.fiber,
      totalSugar: acc.totalSugar + (food.nutrition.sugar || 0),
      totalSodium: acc.totalSodium + (food.nutrition.sodium || 0)
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbohydrates: 0,
      totalFats: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0
    });

    return {
      ...totals,
      totalSugar: totals.totalSugar > 0 ? totals.totalSugar : undefined,
      totalSodium: totals.totalSodium > 0 ? totals.totalSodium : undefined,
      itemCount: foods.length,
      averageCaloriesPerItem: foods.length > 0 ? totals.totalCalories / foods.length : 0
    };
  };

  const calculateGoalProgress = (
    totals: MealNutritionTotals,
    mealType: MealType
  ): MealGoalProgress => {
    const user = authStore.user;
    if (!user) {
      return createDefaultGoalProgress();
    }

    // Estimate meal allocation of daily goals
    const mealAllocations: Record<MealType, number> = {
      breakfast: 0.25,
      lunch: 0.30,
      dinner: 0.25,
      morning_snack: 0.10,
      evening_snack: 0.10
    };

    const allocation = mealAllocations[mealType];
    const allocatedCalories = user.dailyCalorieGoal * allocation;
    const caloriePercentage = (totals.totalCalories / allocatedCalories) * 100;

    // Estimated daily macro goals (could be user customizable)
    const estimatedDailyMacros = {
      protein: user.dailyCalorieGoal * 0.25 / 4, // 25% of calories from protein
      carbohydrates: user.dailyCalorieGoal * 0.45 / 4, // 45% from carbs
      fats: user.dailyCalorieGoal * 0.30 / 9, // 30% from fats
      fiber: Math.max(25, user.dailyCalorieGoal / 80) // Roughly 25-35g
    };

    return {
      calorieProgress: {
        current: totals.totalCalories,
        allocated: allocatedCalories,
        percentage: caloriePercentage,
        status: caloriePercentage < 80 ? 'under' :
                caloriePercentage <= 100 ? 'met' : 'over'
      },
      macroProgress: {
        protein: {
          current: totals.totalProtein,
          percentage: (totals.totalProtein / (estimatedDailyMacros.protein * allocation)) * 100
        },
        carbohydrates: {
          current: totals.totalCarbohydrates,
          percentage: (totals.totalCarbohydrates / (estimatedDailyMacros.carbohydrates * allocation)) * 100
        },
        fats: {
          current: totals.totalFats,
          percentage: (totals.totalFats / (estimatedDailyMacros.fats * allocation)) * 100
        },
        fiber: {
          current: totals.totalFiber,
          percentage: (totals.totalFiber / (estimatedDailyMacros.fiber * allocation)) * 100
        }
      }
    };
  };

  const createDefaultGoalProgress = (): MealGoalProgress => ({
    calorieProgress: {
      current: 0,
      allocated: 500, // Default meal allocation
      percentage: 0,
      status: 'under'
    },
    macroProgress: {
      protein: { current: 0, percentage: 0 },
      carbohydrates: { current: 0, percentage: 0 },
      fats: { current: 0, percentage: 0 },
      fiber: { current: 0, percentage: 0 }
    }
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading meal...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load meal data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMealData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mealSummary || mealSummary.isEmpty) {
    return (
      <MealEmptyState
        mealType={mealType}
        onAddFood={onAddFood}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Meal Nutrition Summary Header */}
      <MealNutritionHeader
        nutritionTotals={mealSummary.nutritionTotals}
        goalProgress={mealSummary.goalProgress}
        mealType={mealType}
      />

      {/* Selection Mode Header */}
      {isSelectionMode && (
        <SelectionModeHeader
          selectedCount={selectedItems.length}
          totalCount={mealSummary.foods.length}
          onSelectAll={() => setSelectedItems(mealSummary.foods.map(f => f.id))}
          onClearSelection={() => setSelectedItems([])}
          onDelete={handleBulkDelete}
          onCancel={() => {
            setIsSelectionMode(false);
            setSelectedItems([]);
          }}
        />
      )}

      {/* Food Items List */}
      <View style={styles.foodItemsList}>
        {mealSummary.foods.map((food) => (
          <FoodItemCard
            key={food.id}
            food={food}
            isSelected={selectedItems.includes(food.id)}
            isSelectionMode={isSelectionMode}
            onPress={() => {
              if (isSelectionMode) {
                toggleItemSelection(food.id);
              } else {
                onEditFood(food);
              }
            }}
            onLongPress={() => {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
                setSelectedItems([food.id]);
              }
            }}
            onSwipeDelete={() => handleDeleteFood(food.id)}
            onDuplicate={() => handleDuplicateFood(food.id)}
          />
        ))}
      </View>

      {/* Add Food Button */}
      <TouchableOpacity
        style={styles.addFoodButton}
        onPress={onAddFood}
      >
        <Text style={styles.addFoodButtonText}>+ Add Food</Text>
      </TouchableOpacity>

      {/* Save as Meal Button (if multiple items) */}
      {mealSummary.foods.length > 1 && !isSelectionMode && (
        <TouchableOpacity
          style={styles.saveMealButton}
          onPress={() => {
            Alert.prompt(
              'Save as Meal',
              'Enter a name for this meal combination:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: (mealName) => {
                    if (mealName) {
                      Alert.alert('Success', `Meal "${mealName}" saved!`);
                    }
                  }
                }
              ],
              'plain-text',
              `My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
            );
          }}
        >
          <Text style={styles.saveMealButtonText}>💾 Save as Meal</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981'
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  foodItemsList: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  addFoodButton: {
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addFoodButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  saveMealButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveMealButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});