import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  interpolate,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { MacroData, MacroInfo } from './NutritionDashboard';

interface MacroProgressSectionProps {
  data: MacroData;
}

interface MacroProgressBarProps {
  label: string;
  data: MacroInfo | { current: number; goal: number };
  animationDelay: number;
  isSimple?: boolean;
  color: string;
}

// Get color based on goal achievement status
const getMacroColor = (status: 'under' | 'met' | 'over' | undefined): string => {
  const colors = {
    under: '#F59E0B',  // Orange
    met: '#10B981',    // Green
    over: '#EF4444'    // Red
  };
  return colors[status || 'under'];
};

// Get macro-specific colors
const getMacroThemeColor = (macroType: string): string => {
  const colors = {
    protein: '#8B5CF6',    // Purple
    carbs: '#3B82F6',      // Blue
    fats: '#F59E0B',       // Orange
    fiber: '#10B981'       // Green
  };
  return colors[macroType as keyof typeof colors] || '#6B7280';
};

const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  label,
  data,
  animationDelay,
  isSimple = false,
  color
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(20);

  useEffect(() => {
    // Calculate target progress
    const targetProgress = isSimple
      ? (data as { current: number; goal: number }).current / (data as { current: number; goal: number }).goal
      : (data as MacroInfo).currentGrams / (data as MacroInfo).goalGrams;

    // Animate progress with delay
    progress.value = withDelay(
      animationDelay,
      withSpring(Math.min(targetProgress, 1.2), { // Allow overshoot for visual feedback
        damping: 15,
        stiffness: 100,
        mass: 1,
      })
    );

    // Animate entrance
    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    slideY.value = withDelay(
      animationDelay,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
  }, [data, animationDelay]);

  // Animated styles
  const progressBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.min(progress.value * 100, 100)}%`,
      backgroundColor: color
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: slideY.value }],
    };
  });

  // Progress percentage for display
  const progressPercentage = isSimple
    ? ((data as { current: number; goal: number }).current / (data as { current: number; goal: number }).goal) * 100
    : ((data as MacroInfo).currentGrams / (data as MacroInfo).goalGrams) * 100;

  // Status for color coding
  const status = isSimple ? 'met' : (data as MacroInfo).goalAchievementStatus;

  return (
    <Animated.View style={[styles.macroBarContainer, containerAnimatedStyle]}>
      {/* Header with label and values */}
      <View style={styles.macroBarHeader}>
        <View style={styles.labelContainer}>
          <View style={[styles.colorDot, { backgroundColor: getMacroThemeColor(label.toLowerCase()) }]} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>

        <Text style={styles.macroValues}>
          {isSimple ? (
            `${(data as { current: number; goal: number }).current.toFixed(1)}g / ${(data as { current: number; goal: number }).goal}g`
          ) : (
            `${(data as MacroInfo).currentGrams.toFixed(1)}g (${(data as MacroInfo).percentageOfTotal.toFixed(0)}%)`
          )}
        </Text>
      </View>

      {/* Progress bar track */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />

        {/* Goal indicator line */}
        <View style={styles.goalIndicator} />
      </View>

      {/* Progress info */}
      <View style={styles.progressInfo}>
        <Text style={[styles.progressPercentage, { color: getMacroColor(status) }]}>
          {Math.round(progressPercentage)}% of goal
        </Text>

        {!isSimple && (
          <Text style={styles.calorieInfo}>
            {(data as MacroInfo).currentCalories.toFixed(0)} cal
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export const MacroProgressSection: React.FC<MacroProgressSectionProps> = ({ data }) => {
  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      data: data.protein,
      color: getMacroColor(data.protein.goalAchievementStatus),
      isSimple: false
    },
    {
      key: 'carbs',
      label: 'Carbohydrates',
      data: data.carbs,
      color: getMacroColor(data.carbs.goalAchievementStatus),
      isSimple: false
    },
    {
      key: 'fats',
      label: 'Fats',
      data: data.fats,
      color: getMacroColor(data.fats.goalAchievementStatus),
      isSimple: false
    },
    {
      key: 'fiber',
      label: 'Fiber',
      data: data.fiber,
      color: getMacroThemeColor('fiber'),
      isSimple: true
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily Nutrition Progress</Text>

      <View style={styles.macroList}>
        {macros.map((macro, index) => (
          <MacroProgressBar
            key={macro.key}
            label={macro.label}
            data={macro.data}
            animationDelay={index * 150}
            isSimple={macro.isSimple}
            color={macro.color}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  macroList: {
    gap: 24,
  },
  macroBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  macroBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  macroValues: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4, // Ensure some visual feedback even for very low values
  },
  goalIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  calorieInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});