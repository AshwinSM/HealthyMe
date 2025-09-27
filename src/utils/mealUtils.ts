import { CategoryState } from '../types';

export const getMealCategoryState = (currentCalories: number, allocatedCalories: number): CategoryState => {
  if (currentCalories === 0) {
    return 'empty';
  } else if (currentCalories < allocatedCalories * 0.9) {
    return 'partial';
  } else if (currentCalories <= allocatedCalories * 1.1) {
    return 'goalMet';
  } else {
    return 'overGoal';
  }
};

export const categoryColors = {
  empty: '#F3F4F6',        // Light gray
  partial: '#FEF3C7',      // Light orange  
  goalMet: '#D1FAE5',      // Light green
  overGoal: '#FEE2E2'      // Light red
};

export const formatCaloriesText = (current: number, allocated: number): string => {
  return `${Math.round(current)} of ${Math.round(allocated)} Cal`;
};

export const getMealDisplayInfo = (mealType: string) => {
  const mealConfig = {
    breakfast: {
      title: 'Breakfast',
      icon: 'sunrise' as const,
    },
    morning_snack: {
      title: 'Morning Snack', 
      icon: 'apple' as const,
    },
    lunch: {
      title: 'Lunch',
      icon: 'utensils' as const,
    },
    evening_snack: {
      title: 'Evening Snack',
      icon: 'cookie' as const,
    },
    dinner: {
      title: 'Dinner',
      icon: 'utensils-crossed' as const,
    }
  };

  return mealConfig[mealType as keyof typeof mealConfig] || {
    title: 'Unknown',
    icon: 'utensils' as const
  };
};