import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Droplets, Plus } from 'lucide-react-native';

interface WaterTrackingCardProps {
  currentIntake: number; // Current intake in liters
  goalIntake: number; // Daily goal in liters
  unit?: 'L' | 'ml';
  onPress?: () => void;
  onAddPress?: () => void;
}

const WaterProgressRing: React.FC<{
  progress: number; // 0-1
  size: number;
}> = ({ progress, size }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedPercentage = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedPercentage, {
        toValue: progress * 100,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [progress, animatedProgress, animatedPercentage]);
  
  return (
    <View style={{ width: size, height: size }}>
      {/* Background ring */}
      <View 
        style={[
          styles.progressRing,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#E5F6FF', // Light cyan background
          }
        ]}
      />
      {/* Animated progress segments */}
      <Animated.View
        style={[
          styles.progressRing,
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            transform: [{ rotate: '-90deg' }],
          }
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: animatedProgress.interpolate({
                inputRange: [0, 0.25, 1],
                outputRange: ['#E5F6FF', '#06B6D4', '#06B6D4'],
                extrapolate: 'clamp',
              }),
              borderRightColor: animatedProgress.interpolate({
                inputRange: [0, 0.25, 0.5, 1],
                outputRange: ['#E5F6FF', '#E5F6FF', '#06B6D4', '#06B6D4'],
                extrapolate: 'clamp',
              }),
              borderBottomColor: animatedProgress.interpolate({
                inputRange: [0, 0.5, 0.75, 1],
                outputRange: ['#E5F6FF', '#E5F6FF', '#E5F6FF', '#06B6D4'],
                extrapolate: 'clamp',
              }),
              borderLeftColor: animatedProgress.interpolate({
                inputRange: [0, 0.75, 1],
                outputRange: ['#E5F6FF', '#E5F6FF', '#06B6D4'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </Animated.View>
      {/* Progress percentage text */}
      <View style={[styles.progressCenter, { width: size, height: size }]}>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

export const WaterTrackingCard: React.FC<WaterTrackingCardProps> = ({
  currentIntake = 2.5,
  goalIntake = 3.0,
  unit = 'L',
  onPress,
  onAddPress,
}) => {
  const progress = Math.min(currentIntake / goalIntake, 1);
  const progressPercentage = Math.round(progress * 100);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const addButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddButtonPressIn = () => {
    Animated.spring(addButtonScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleAddButtonPressOut = () => {
    Animated.spring(addButtonScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.card} 
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={1}
      >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {/* Water icon container */}
          <View style={styles.iconContainer}>
            <Droplets size={28} color="#06B6D4" />
          </View>
          
          {/* Text content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>Water</Text>
            <Text style={styles.intake}>
              {currentIntake}{unit} of {goalIntake}{unit}
            </Text>
            <Text style={styles.goal}>Daily hydration goal</Text>
          </View>
        </View>

        {/* Right section with progress and add button */}
        <View style={styles.rightSection}>
          <WaterProgressRing progress={progress} size={64} />
          
          <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={onAddPress}
              onPressIn={handleAddButtonPressIn}
              onPressOut={handleAddButtonPressOut}
              activeOpacity={1}
            >
              <Plus size={18} color="#06B6D4" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
      
      {/* Progress bar at bottom */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              }
            ]} 
          />
        </View>
        <Text style={styles.progressLabel}>
          {progressPercentage}% of daily goal
        </Text>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5F6FF', // Light cyan border
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#CFFAFE', // Light cyan background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  intake: {
    fontSize: 16,
    fontWeight: '500',
    color: '#06B6D4', // Cyan for intake display
    marginBottom: 2,
  },
  goal: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rightSection: {
    alignItems: 'center',
    position: 'relative',
  },
  addButton: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5F6FF', // Light cyan track
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4', // Cyan fill
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});