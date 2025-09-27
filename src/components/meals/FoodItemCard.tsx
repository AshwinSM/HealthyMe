import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { FoodEntry } from '../../types/health';

interface FoodItemCardProps {
  food: FoodEntry;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onSwipeDelete: () => void;
  onDuplicate: () => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  food,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
  onSwipeDelete,
  onDuplicate
}) => {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.duplicateAction]}
        onPress={() => {
          swipeRef.current?.close();
          onDuplicate();
        }}
      >
        <Text style={styles.swipeActionText}>📋</Text>
        <Text style={styles.swipeActionLabel}>Copy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={() => {
          swipeRef.current?.close();
          onSwipeDelete();
        }}
      >
        <Text style={styles.swipeActionText}>🗑️</Text>
        <Text style={styles.swipeActionLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      enabled={!isSelectionMode}
    >
      <TouchableOpacity
        style={[
          styles.foodItemCard,
          isSelected && styles.foodItemCardSelected,
          isSelectionMode && styles.foodItemCardSelectionMode
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <View style={styles.selectionCheckbox}>
            <Text style={styles.selectionCheckmark}>
              {isSelected ? '✓' : '○'}
            </Text>
          </View>
        )}

        {/* Food Photo Thumbnail */}
        <View style={styles.photoThumbnailContainer}>
          {food.photoURL ? (
            <Image
              source={{ uri: food.photoURL }}
              style={styles.photoThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Text style={styles.placeholderThumbnailText}>🍽️</Text>
            </View>
          )}
        </View>

        {/* Food Details */}
        <View style={styles.foodDetails}>
          <Text style={styles.foodName} numberOfLines={1}>
            {food.foodName}
          </Text>

          {food.brand && (
            <Text style={styles.foodBrand} numberOfLines={1}>
              {food.brand}
            </Text>
          )}

          <Text style={styles.foodQuantity}>
            {food.quantity} {food.unit}
          </Text>

          <View style={styles.nutritionSummary}>
            <Text style={styles.caloriesText}>
              {food.nutrition.calories} cal
            </Text>
            <Text style={styles.macrosText}>
              P: {food.nutrition.protein}g • C: {food.nutrition.carbs}g • F: {food.nutrition.fat}g
            </Text>
          </View>

          {food.notes && (
            <Text style={styles.foodNotes} numberOfLines={1}>
              💭 {food.notes}
            </Text>
          )}
        </View>

        {/* Edit Indicator */}
        {!isSelectionMode && (
          <View style={styles.editIndicator}>
            <Text style={styles.editIndicatorText}>›</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  foodItemCardSelected: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  foodItemCardSelectionMode: {
    paddingLeft: 8,
  },
  selectionCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  selectionCheckmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  photoThumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderThumbnailText: {
    fontSize: 24,
  },
  foodDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  nutritionSummary: {
    marginBottom: 4,
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  macrosText: {
    fontSize: 12,
    color: '#6B7280',
  },
  foodNotes: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginTop: 4,
  },
  editIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIndicatorText: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  swipeAction: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  duplicateAction: {
    backgroundColor: '#6366F1',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
  },
  swipeActionText: {
    fontSize: 20,
    marginBottom: 4,
  },
  swipeActionLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});