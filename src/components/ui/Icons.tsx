import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

interface LucideIconProps {
  name: string;
  size?: number;
  color?: string;
}

// Simple icon wrapper for meal categories
export const Lucide: React.FC<LucideIconProps> = ({ name, size = 24, color = '#F59E0B' }) => {
  const getIconSymbol = (iconName: string): string => {
    const icons: Record<string, string> = {
      'sunrise': '🌅',
      'apple': '🍎', 
      'utensils': '🍽️',
      'cookie': '🍪',
      'utensils-crossed': '🍴',
    };
    return icons[iconName] || '🍽️';
  };

  return (
    <Text style={[{ fontSize: size, color }]}>
      {getIconSymbol(name)}
    </Text>
  );
};

export const CalorieIcon: React.FC<IconProps> = ({ size = 24, color = '#F97316' }) => (
  <View style={[styles.icon, { width: size, height: size }]}>
    <View style={[styles.calorieIcon, { borderColor: color }]} />
  </View>
);

export const WorkoutIcon: React.FC<IconProps> = ({ size = 24, color = '#059669' }) => (
  <View style={[styles.icon, { width: size, height: size }]}>
    <View style={[styles.workoutIcon, { backgroundColor: color }]} />
  </View>
);

export const WaterIcon: React.FC<IconProps> = ({ size = 24, color = '#0EA5E9' }) => (
  <View style={[styles.icon, { width: size, height: size }]}>
    <View style={[styles.waterIcon, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  workoutIcon: {
    width: 18,
    height: 12,
    borderRadius: 6,
  },
  waterIcon: {
    width: 12,
    height: 16,
    borderRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});