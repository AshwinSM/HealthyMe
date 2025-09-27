import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  interpolate
} from 'react-native-reanimated';

interface DailySummaryData {
  mealsLogged: number;
  totalFoods: number;
  lastUpdated: Date;
  completionScore: number;
}

interface DailySummaryCardsProps {
  data: DailySummaryData;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  animationDelay: number;
  onPress?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  animationDelay,
  onPress
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    scale.value = withDelay(
      animationDelay,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 1,
      })
    );

    slideY.value = withDelay(
      animationDelay,
      withSpring(0, {
        damping: 10,
        stiffness: 80,
      })
    );
  }, [animationDelay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: slideY.value }
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable
        style={styles.cardContent}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Text style={[styles.icon, { color }]}>{icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={[styles.cardValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const DailySummaryCards: React.FC<DailySummaryCardsProps> = ({ data }) => {
  // Format last updated time
  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get completion score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  // Get completion score emoji
  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '🔥';
    if (score >= 60) return '⚡';
    if (score >= 40) return '📈';
    return '🌱';
  };

  const cards = [
    {
      title: 'Meals Logged',
      value: data.mealsLogged,
      subtitle: `${data.totalFoods} food items`,
      icon: '🍽️',
      color: '#3B82F6',
      onPress: undefined
    },
    {
      title: 'Completion Score',
      value: `${data.completionScore}%`,
      subtitle: 'Daily nutrition goal',
      icon: getScoreEmoji(data.completionScore),
      color: getScoreColor(data.completionScore),
      onPress: undefined
    },
    {
      title: 'Last Updated',
      value: formatLastUpdated(data.lastUpdated),
      subtitle: 'Sync status',
      icon: '🕒',
      color: '#6B7280',
      onPress: undefined
    },
    {
      title: 'Weekly Streak',
      value: '5 days',
      subtitle: 'Tracking streak',
      icon: '🔥',
      color: '#EF4444',
      onPress: undefined
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Daily Summary</Text>

      <View style={styles.cardsGrid}>
        {cards.map((card, index) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            animationDelay={index * 100}
            onPress={card.onPress}
          />
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Pressable style={[styles.actionButton, { backgroundColor: '#10B981' }]}>
            <Text style={styles.actionButtonText}>📱 Log Meal</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.actionButtonText}>📊 View History</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});