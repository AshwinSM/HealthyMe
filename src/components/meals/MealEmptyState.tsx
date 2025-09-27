import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { MealType } from '../../types/health';

interface MealEmptyStateProps {
  mealType: MealType;
  onAddFood: () => void;
}

export const MealEmptyState: React.FC<MealEmptyStateProps> = ({
  mealType,
  onAddFood
}) => {
  const getMealEmoji = (type: MealType): string => {
    const emojis: Record<MealType, string> = {
      breakfast: '🥐',
      morning_snack: '🍎',
      lunch: '🥗',
      evening_snack: '🥨',
      dinner: '🍽️'
    };
    return emojis[type];
  };

  const getMealDisplayName = (type: MealType): string => {
    const names: Record<MealType, string> = {
      breakfast: 'breakfast',
      morning_snack: 'morning snack',
      lunch: 'lunch',
      evening_snack: 'evening snack',
      dinner: 'dinner'
    };
    return names[type];
  };

  const getMealSuggestion = (type: MealType): string => {
    const suggestions: Record<MealType, string> = {
      breakfast: 'Start your day with a nutritious breakfast! Log your morning meal to track your nutrition goals.',
      morning_snack: 'Add a healthy morning snack to fuel your day. Perfect for keeping energy levels stable.',
      lunch: 'Time for a satisfying lunch break. Track your midday meal to stay on top of your nutrition.',
      evening_snack: 'Keep your energy up with an evening snack. A great way to bridge the gap to dinner.',
      dinner: 'End your day with a delicious dinner. Log your evening meal to complete your daily tracking.'
    };
    return suggestions[type];
  };

  const getMealTips = (type: MealType): string[] => {
    const tips: Record<MealType, string[]> = {
      breakfast: [
        'Include protein for sustained energy',
        'Add fruits for vitamins and fiber',
        'Consider whole grains for lasting fullness'
      ],
      morning_snack: [
        'Keep it light but nutritious',
        'Combine protein with healthy carbs',
        'Stay hydrated with water'
      ],
      lunch: [
        'Balance proteins, carbs, and vegetables',
        'Make it your largest meal if needed',
        'Don\'t skip - it fuels your afternoon'
      ],
      evening_snack: [
        'Choose lighter options',
        'Avoid heavy or sugary foods',
        'Time it 2-3 hours before dinner'
      ],
      dinner: [
        'Include plenty of vegetables',
        'Keep portions moderate',
        'Finish eating 2-3 hours before bed'
      ]
    };
    return tips[type];
  };

  return (
    <View style={styles.container}>
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyStateEmoji}>
          {getMealEmoji(mealType)}
        </Text>

        <Text style={styles.emptyStateTitle}>
          No {getMealDisplayName(mealType)} logged yet
        </Text>

        <Text style={styles.emptyStateMessage}>
          {getMealSuggestion(mealType)}
        </Text>

        <TouchableOpacity
          style={styles.addFoodButton}
          onPress={onAddFood}
        >
          <Text style={styles.addFoodButtonText}>
            + Add First Food
          </Text>
        </TouchableOpacity>

        {/* Meal Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            💡 {getMealDisplayName(mealType).charAt(0).toUpperCase() + getMealDisplayName(mealType).slice(1)} Tips
          </Text>

          <View style={styles.tipsList}>
            {getMealTips(mealType).map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onAddFood}
            >
              <Text style={styles.quickActionEmoji}>📸</Text>
              <Text style={styles.quickActionText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onAddFood}
            >
              <Text style={styles.quickActionEmoji}>🔍</Text>
              <Text style={styles.quickActionText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={onAddFood}
            >
              <Text style={styles.quickActionEmoji}>✍️</Text>
              <Text style={styles.quickActionText}>Manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFoodButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  addFoodButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsSection: {
    width: '100%',
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipsList: {
    alignItems: 'flex-start',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tipBullet: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  quickActions: {
    width: '100%',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});