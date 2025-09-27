import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { MealType } from '../../types/health';
import { MealNutritionTotals, MealGoalProgress } from './MealSummaryView';

interface MealNutritionHeaderProps {
  nutritionTotals: MealNutritionTotals;
  goalProgress: MealGoalProgress;
  mealType: MealType;
}

export const MealNutritionHeader: React.FC<MealNutritionHeaderProps> = ({
  nutritionTotals,
  goalProgress,
  mealType
}) => {
  const getMealDisplayName = (type: MealType): string => {
    const names: Record<MealType, string> = {
      breakfast: 'Breakfast',
      morning_snack: 'Morning Snack',
      lunch: 'Lunch',
      evening_snack: 'Evening Snack',
      dinner: 'Dinner'
    };
    return names[type];
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 80) return '#F59E0B'; // Orange - under goal
    if (percentage <= 100) return '#10B981'; // Green - at goal
    return '#EF4444'; // Red - over goal
  };

  return (
    <View style={styles.nutritionHeader}>
      <View style={styles.mealTitle}>
        <Text style={styles.mealTitleText}>{getMealDisplayName(mealType)}</Text>
        <Text style={styles.itemCount}>
          {nutritionTotals.itemCount} item{nutritionTotals.itemCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Calories Overview */}
      <View style={styles.caloriesOverview}>
        <View style={styles.caloriesMain}>
          <Text style={styles.caloriesValue}>
            {nutritionTotals.totalCalories}
          </Text>
          <Text style={styles.caloriesLabel}>calories</Text>
        </View>

        <View style={styles.caloriesProgress}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(goalProgress.calorieProgress.percentage, 100)}%`,
                  backgroundColor: getProgressColor(goalProgress.calorieProgress.percentage)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {goalProgress.calorieProgress.percentage.toFixed(0)}% of goal
          </Text>
          <Text style={styles.goalText}>
            {goalProgress.calorieProgress.allocated.toFixed(0)} cal goal
          </Text>
        </View>
      </View>

      {/* Macros Breakdown */}
      <View style={styles.macrosGrid}>
        <MacroItem
          label="Protein"
          value={nutritionTotals.totalProtein}
          unit="g"
          percentage={goalProgress.macroProgress.protein.percentage}
          color="#8B5CF6"
        />
        <MacroItem
          label="Carbs"
          value={nutritionTotals.totalCarbohydrates}
          unit="g"
          percentage={goalProgress.macroProgress.carbohydrates.percentage}
          color="#3B82F6"
        />
        <MacroItem
          label="Fats"
          value={nutritionTotals.totalFats}
          unit="g"
          percentage={goalProgress.macroProgress.fats.percentage}
          color="#F59E0B"
        />
        <MacroItem
          label="Fiber"
          value={nutritionTotals.totalFiber}
          unit="g"
          percentage={goalProgress.macroProgress.fiber.percentage}
          color="#10B981"
        />
      </View>

      {/* Optional nutrients if available */}
      {(nutritionTotals.totalSugar !== undefined || nutritionTotals.totalSodium !== undefined) && (
        <View style={styles.additionalNutrients}>
          {nutritionTotals.totalSugar !== undefined && (
            <View style={styles.additionalNutrient}>
              <Text style={styles.additionalNutrientLabel}>Sugar</Text>
              <Text style={styles.additionalNutrientValue}>
                {nutritionTotals.totalSugar.toFixed(1)}g
              </Text>
            </View>
          )}
          {nutritionTotals.totalSodium !== undefined && (
            <View style={styles.additionalNutrient}>
              <Text style={styles.additionalNutrientLabel}>Sodium</Text>
              <Text style={styles.additionalNutrientValue}>
                {nutritionTotals.totalSodium.toFixed(0)}mg
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface MacroItemProps {
  label: string;
  value: number;
  unit: string;
  percentage: number;
  color: string;
}

const MacroItem: React.FC<MacroItemProps> = ({
  label,
  value,
  unit,
  percentage,
  color
}) => (
  <View style={styles.macroItem}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>
      {value.toFixed(1)}{unit}
    </Text>
    <View style={styles.macroProgress}>
      <View
        style={[
          styles.macroProgressBar,
          {
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }
        ]}
      />
    </View>
    <Text style={styles.macroPercentage}>
      {percentage.toFixed(0)}%
    </Text>
  </View>
);

const styles = StyleSheet.create({
  nutritionHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mealTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemCount: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  caloriesOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesMain: {
    alignItems: 'center',
    marginRight: 24,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  caloriesProgress: {
    flex: 1,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  goalText: {
    fontSize: 12,
    color: '#6B7280',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  macroProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  macroPercentage: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  additionalNutrients: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  additionalNutrient: {
    alignItems: 'center',
  },
  additionalNutrientLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  additionalNutrientValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});