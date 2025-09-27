import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { FoodEntryForm } from '../components/forms/FoodEntryForm';
import { RootStackParamList } from '../types/navigation';
import { MealType, FoodItem } from '../types/health';

type FoodEntryScreenRouteProp = RouteProp<RootStackParamList, 'FoodEntry'>;
type FoodEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FoodEntry'>;

interface RouteParams {
  mealType?: MealType;
  date?: string;
}

export const FoodEntryScreen: React.FC = () => {
  const navigation = useNavigation<FoodEntryScreenNavigationProp>();
  const route = useRoute<FoodEntryScreenRouteProp>();
  
  const { mealType, date } = (route.params || {}) as RouteParams;

  const getMealTypeTitle = (meal?: MealType): string => {
    switch (meal) {
      case 'breakfast':
        return 'Breakfast';
      case 'lunch':
        return 'Lunch';
      case 'dinner':
        return 'Dinner';
      case 'morning_snack':
        return 'Morning Snack';
      case 'evening_snack':
        return 'Evening Snack';
      default:
        return 'Add Food';
    }
  };

  const handleSuccess = (entry: FoodItem) => {
    console.log('Food entry success:', entry);
    
    // Show success feedback
    Alert.alert(
      'Food Added!',
      `${entry.foodName} has been added to your ${getMealTypeTitle(entry.mealType).toLowerCase()}.`,
      [
        {
          text: 'Add Another',
          style: 'default',
        },
        {
          text: 'Done',
          style: 'default',
          onPress: () => {
            // Navigate back to allow the focus effect to refresh the data
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            Add to {getMealTypeTitle(mealType)}
          </Text>
          {date && (
            <Text style={styles.headerSubtitle}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {/* Placeholder for future actions */}
        </View>
      </View>

      {/* Form */}
      <FoodEntryForm
        initialMealType={mealType}
        initialDate={date}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff'
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center'
  },
  headerRight: {
    width: 40 // Match backButton width for centering
  }
});