import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  useDerivedValue,
  useAnimatedProps
} from 'react-native-reanimated';
import { CalorieData } from './NutritionDashboard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieProgressRingProps {
  data: CalorieData;
}

// Configuration constants
const RING_CONFIG = {
  radius: 80,
  strokeWidth: 12,
  size: 200,
  backgroundColor: '#F3F4F6'
};

// Color scheme based on goal achievement
const getCalorieColor = (status: CalorieData['status']): string => {
  const colors = {
    under: '#F59E0B',  // Orange
    met: '#10B981',    // Green
    over: '#EF4444'    // Red
  };
  return colors[status];
};

// Calculate circumference for stroke-dasharray animation
const circumference = 2 * Math.PI * RING_CONFIG.radius;

export const CalorieProgressRing: React.FC<CalorieProgressRingProps> = ({ data }) => {
  // Animated values
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Animate progress when data changes
  useEffect(() => {
    // Clamp progress to a maximum to handle "over goal" scenarios visually
    const targetProgress = Math.min(data.percentage / 100, 1.2);

    progress.value = withSpring(targetProgress, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });

    // Scale animation for entrance effect
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });

    // Subtle continuous rotation for visual interest
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 30000,
        easing: Easing.linear
      }),
      -1,
      false
    );
  }, [data.percentage]);

  // Animated props for the progress circle
  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDasharray = `${progress.value * circumference} ${circumference}`;
    return {
      strokeDasharray,
      strokeDashoffset: 0,
    };
  });

  // Container animation style
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value * 0.1}deg` } // Very subtle rotation
      ],
    };
  });

  // Text animation
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scale.value, [0.8, 1], [0, 1]),
      transform: [{ scale: interpolate(scale.value, [0.8, 1], [0.9, 1]) }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* SVG Ring */}
      <Svg width={RING_CONFIG.size} height={RING_CONFIG.size} style={styles.svgContainer}>
        {/* Background circle */}
        <Circle
          cx={RING_CONFIG.size / 2}
          cy={RING_CONFIG.size / 2}
          r={RING_CONFIG.radius}
          stroke={RING_CONFIG.backgroundColor}
          strokeWidth={RING_CONFIG.strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={RING_CONFIG.size / 2}
          cy={RING_CONFIG.size / 2}
          r={RING_CONFIG.radius}
          stroke={getCalorieColor(data.status)}
          strokeWidth={RING_CONFIG.strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          animatedProps={animatedCircleProps}
          // Start from top of circle
          transform={`rotate(-90 ${RING_CONFIG.size / 2} ${RING_CONFIG.size / 2})`}
        />
      </Svg>

      {/* Center text content */}
      <Animated.View style={[styles.centerText, textAnimatedStyle]}>
        <Text style={styles.calorieNumber}>{data.current.toLocaleString()}</Text>
        <Text style={styles.calorieLabel}>of {data.goal.toLocaleString()} cal</Text>

        {/* Remaining calories or overage */}
        {data.status === 'over' ? (
          <Text style={styles.overageText}>
            +{(data.current - data.goal).toLocaleString()} over
          </Text>
        ) : data.remaining > 0 && (
          <Text style={styles.remainingText}>
            {data.remaining.toLocaleString()} remaining
          </Text>
        )}

        {/* Progress percentage */}
        <Text style={[styles.percentageText, { color: getCalorieColor(data.status) }]}>
          {Math.round(data.percentage)}%
        </Text>
      </Animated.View>

      {/* Status indicator */}
      <View style={[styles.statusIndicator, { backgroundColor: getCalorieColor(data.status) }]}>
        <Text style={styles.statusText}>
          {data.status === 'under' && '⬆️'}
          {data.status === 'met' && '✅'}
          {data.status === 'over' && '⚠️'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_CONFIG.radius * 2,
    height: RING_CONFIG.radius * 2,
  },
  calorieNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  remainingText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  overageText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  statusIndicator: {
    position: 'absolute',
    top: -8,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
  },
});