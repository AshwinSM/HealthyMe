import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Utensils, Plus } from 'lucide-react-native';

interface NutritionData {
  protein: number;
  fats: number;
  carbs: number;
  fiber: number;
}

interface FoodTrackingCardProps {
  caloriesConsumed: number;
  targetCalories?: number;
  nutrition: NutritionData;
  onTrackPress?: () => void;
  onAddPress?: () => void;
}

const ProgressBar: React.FC<{ 
  label: string; 
  percentage: number; 
  color: string; 
}> = ({ label, percentage, color }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      delay: Math.random() * 200, // Stagger animations
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedWidth]);

  return (
    <View style={styles.progressBarContainer}>
      <Text style={styles.nutritionLabel}>{label}: {percentage}%</Text>
      <View style={styles.progressBarTrack}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { 
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const FoodTrackingCard: React.FC<FoodTrackingCardProps> = ({
  caloriesConsumed = 1700,
  targetCalories = 2000,
  nutrition = { protein: 0, fats: 0, carbs: 0, fiber: 0 },
  onTrackPress,
  onAddPress,
}) => {
  const addButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const createPressAnimation = (animValue: Animated.Value) => ({
    pressIn: () => {
      Animated.spring(animValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },
    pressOut: () => {
      Animated.spring(animValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
  });

  const addButtonAnim = createPressAnimation(addButtonScaleAnim);

  return (
    <View style={styles.card}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Utensils size={24} color="#F97316" />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>Track Food</Text>
            <Text style={styles.calories}>Eat {caloriesConsumed.toLocaleString()} Cal</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddPress}
              onPressIn={addButtonAnim.pressIn}
              onPressOut={addButtonAnim.pressOut}
              activeOpacity={1}
              testID="food-tracking-add-button"
            >
              <Plus size={20} color="#F97316" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>


      {/* Nutrition Breakdown */}
      <View style={styles.nutritionSection}>
        <ProgressBar 
          label="Protein" 
          percentage={nutrition.protein} 
          color="#8B5CF6" 
        />
        <ProgressBar 
          label="Fats" 
          percentage={nutrition.fats} 
          color="#F97316" 
        />
        <ProgressBar 
          label="Carbs" 
          percentage={nutrition.carbs} 
          color="#10B981" 
        />
        <ProgressBar 
          label="Fiber" 
          percentage={nutrition.fiber} 
          color="#3B82F6" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  calories: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionSection: {
    gap: 16,
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});