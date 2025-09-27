import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import {
  Scale,
  Timer,
  Footprints,
  Moon,
  CheckCircle
} from 'lucide-react-native';

interface TrackerCardProps {
  type: 'weight' | 'workout' | 'steps' | 'sleep';
  title: string;
  value: string;
  goal?: string;
  progress?: number; // 0-1 for circular progress
  onPress?: () => void;
}

const CircularProgress: React.FC<{
  progress: number;
  size: number;
  color: string;
  showSuccess?: boolean;
}> = ({ progress, size, color, showSuccess = false }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  const animatedProgress = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(rotationAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress, animatedProgress, rotationAnim]);

  const progressColor = getProgressColor(progress);

  return (
    <View style={{ width: size, height: size }}>
      <View 
        style={[
          styles.progressCircle,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#F3F4F6',
          }
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }
          ]}
        />
        
        {/* Success indicator for completed goals */}
        {showSuccess && progress >= 0.8 && (
          <View style={styles.successIndicator}>
            <CheckCircle size={16} color="#10B981" />
          </View>
        )}
      </View>
    </View>
  );
};

const getIconForType = (type: TrackerCardProps['type'], size: number, color: string) => {
  switch (type) {
    case 'weight':
      return <Scale size={size} color={color} />;
    case 'workout':
      return <Timer size={size} color={color} />;
    case 'steps':
      return <Footprints size={size} color={color} />;
    case 'sleep':
      return <Moon size={size} color={color} />;
    default:
      return null;
  }
};

const getColorForType = (type: TrackerCardProps['type']) => {
  switch (type) {
    case 'weight':
      return '#6366F1'; // Indigo - scale icons
    case 'workout':
      return '#EC4899'; // Pink - timer/workout icons
    case 'steps':
      return '#10B981'; // Green - footprint icons (special teal button)
    case 'sleep':
      return '#8B5CF6'; // Purple - moon icons
    default:
      return '#6B7280';
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 0.8) return '#10B981'; // Green for 80%+
  if (progress >= 0.5) return '#F59E0B'; // Yellow for 50-80%
  return '#EF4444'; // Red for <50%
};

export const TrackerCard: React.FC<TrackerCardProps> = ({
  type,
  title,
  value,
  goal,
  progress = 0,
  onPress,
}) => {
  const color = getColorForType(type);
  const isSpecialCard = type === 'steps';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;


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
        style={[
          styles.card,
          isSpecialCard && styles.specialCard
        ]} 
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={1}
      >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { borderColor: color }]}>
            {getIconForType(type, 24, color)}
          </View>
          
          <View style={styles.textContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.value}>{value}</Text>
            {goal && (
              <Text style={styles.goal}>{goal}</Text>
            )}
          </View>
        </View>

      </View>
      
      {progress > 0 && (
        <View style={styles.progressContainer}>
          <CircularProgress 
            progress={progress} 
            size={60} 
            color={color}
            showSuccess={true} 
          />
        </View>
      )}
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
    borderColor: '#F3F4F6',
  },
  specialCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2DD4BF',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
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
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  goal: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  progressCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
  },
  successIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 1,
  },
});