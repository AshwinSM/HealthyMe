import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle,
  Easing 
} from 'react-native-reanimated';
import { Lucide } from '../ui/Icons';
import { MealCategoryProps, CategoryState } from '../../types';
import { 
  getMealCategoryState, 
  categoryColors, 
  formatCaloriesText,
  getMealDisplayInfo 
} from '../../utils/mealUtils';

const MealCategoryCard: React.FC<MealCategoryProps> = ({
  mealType,
  currentCalories,
  allocatedCalories,
  mealCount,
  onPress,
  isLoading = false
}) => {
  const mealInfo = getMealDisplayInfo(mealType);
  
  // Calculate visual state
  const categoryState: CategoryState = useMemo(() => 
    getMealCategoryState(currentCalories, allocatedCalories),
    [currentCalories, allocatedCalories]
  );

  // Animation values
  const backgroundColorAnim = useSharedValue(categoryColors[categoryState]);
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(isLoading ? 0.7 : 1);

  // Update background color when state changes
  useEffect(() => {
    backgroundColorAnim.value = withTiming(categoryColors[categoryState], {
      duration: 300,
      easing: Easing.inOut(Easing.quad)
    });
  }, [categoryState, backgroundColorAnim]);

  // Update opacity for loading state
  useEffect(() => {
    opacityAnim.value = withTiming(isLoading ? 0.7 : 1, {
      duration: 300,
      easing: Easing.inOut(Easing.quad)
    });
  }, [isLoading, opacityAnim]);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColorAnim.value,
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }), [backgroundColorAnim.value, scaleAnim.value, opacityAnim.value]);

  const handlePressIn = useCallback(() => {
    // Cancel any existing animations before starting new ones
    scaleAnim.value = withTiming(0.95, { duration: 100 });
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    // Shorter animation duration to reduce conflicts
    scaleAnim.value = withTiming(1, { duration: 100 });
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    // Stop any running animations before navigation to prevent conflicts
    scaleAnim.value = 1;
    backgroundColorAnim.value = categoryColors[categoryState];
    opacityAnim.value = 1;
    
    // Use setTimeout instead of requestAnimationFrame for better compatibility
    setTimeout(() => {
      onPress(mealType);
    }, 0);
  }, [onPress, mealType, scaleAnim, backgroundColorAnim, opacityAnim, categoryState]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={`meal-category-${mealType}`}
      accessibilityRole="button"
      accessibilityLabel={`${mealInfo.title} - ${formatCaloriesText(currentCalories, allocatedCalories)}`}
      style={{ flex: mealType === 'morning_snack' ? 1 : 0.48, marginBottom: 16 }}
    >
      <Animated.View
        style={[
          {
            height: 120,
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 44, // Accessibility minimum touch target
          },
          animatedCardStyle,
        ]}
      >
        {/* Icon */}
        <View style={{ alignItems: 'center' }}>
          <Lucide 
            name={mealInfo.icon} 
            size={24} 
            color="#F59E0B" 
          />
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 16,
            color: '#1F2937',
            textAlign: 'center',
            marginTop: 8,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {mealInfo.title}
        </Text>

        {/* Calories */}
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {formatCaloriesText(currentCalories, allocatedCalories)}
        </Text>

        {/* Loading indicator */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#6B7280',
            }}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

export default MealCategoryCard;