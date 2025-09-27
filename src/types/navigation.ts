import { MealType } from './health';

export type RootStackParamList = {
  Login: {
    resetCode?: string;
    mode?: 'resetPassword' | 'login';
  } | undefined;
  Main: undefined;
  Dashboard: undefined;
  Profile: undefined;
  FoodTracking: undefined;
  FoodEntry: {
    mealType: MealType;
    date?: string;
  };
  ActivityTracking: {
    date?: string;
  } | undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  ActivityTracking: undefined;
  Profile: undefined;
};