import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MealCategory, MealCategoryState, MealType } from '../../types';

interface MealCategoryCardProps {
  category: MealCategory;
  onPress: (mealType: MealType) => void;
  testID?: string;
}

export const MealCategoryCard: React.FC<MealCategoryCardProps> = ({
  category,
  onPress,
  testID
}) => {
  const getCategoryState = (): MealCategoryState => {
    if (category.currentCalories === 0) return 'empty';
    if (category.currentCalories >= category.allocatedCalories) {
      return category.currentCalories > category.allocatedCalories ? 'over_goal' : 'goal_met';
    }
    return 'partial';
  };

  const getStateStyles = (state: MealCategoryState) => {
    switch (state) {
      case 'empty':
        return {
          backgroundColor: '#F3F4F6', // Light gray
          borderColor: '#E5E7EB',
          textColor: '#6B7280',
        };
      case 'partial':
        return {
          backgroundColor: '#FEF3C7', // Light orange
          borderColor: '#F59E0B',
          textColor: '#92400E',
        };
      case 'goal_met':
        return {
          backgroundColor: '#D1FAE5', // Light green
          borderColor: '#10B981',
          textColor: '#065F46',
        };
      case 'over_goal':
        return {
          backgroundColor: '#FEE2E2', // Light red
          borderColor: '#EF4444',
          textColor: '#991B1B',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          borderColor: '#E5E7EB',
          textColor: '#6B7280',
        };
    }
  };

  const state = getCategoryState();
  const stateStyles = getStateStyles(state);
  const remainingCalories = category.allocatedCalories - category.currentCalories;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: stateStyles.backgroundColor,
          borderColor: stateStyles.borderColor,
        },
      ]}
      onPress={() => {
        // Use setTimeout with error handling to avoid animation conflicts
        setTimeout(() => {
          try {
            onPress(category.type);
          } catch (error) {
            console.error('MealCategoryCard press error:', error);
          }
        }, 150); // Delay to allow any press animations to complete
      }}
      testID={testID}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: stateStyles.textColor }]}>
          {category.name}
        </Text>
        <Text style={[styles.itemCount, { color: stateStyles.textColor }]}>
          {category.itemCount} item{category.itemCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.calorieInfo}>
        <Text style={[styles.currentCalories, { color: stateStyles.textColor }]}>
          {category.currentCalories} cal
        </Text>
        <Text style={[styles.allocatedCalories, { color: stateStyles.textColor }]}>
          / {category.allocatedCalories} cal
        </Text>
      </View>

      {state === 'partial' && (
        <Text style={[styles.remainingText, { color: stateStyles.textColor }]}>
          {remainingCalories} cal remaining
        </Text>
      )}

      {state === 'over_goal' && (
        <Text style={[styles.overGoalText, { color: stateStyles.textColor }]}>
          {Math.abs(remainingCalories)} cal over goal
        </Text>
      )}

      {state === 'goal_met' && (
        <Text style={[styles.goalMetText, { color: stateStyles.textColor }]}>
          ✓ Goal achieved
        </Text>
      )}

      {state === 'empty' && (
        <Text style={[styles.emptyText, { color: stateStyles.textColor }]}>
          Tap to add food
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentCalories: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  allocatedCalories: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  overGoalText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  goalMetText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});