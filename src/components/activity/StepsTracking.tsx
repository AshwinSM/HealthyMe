import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { HealthService } from '../../services/firebase/health';
import { StepsEntry, StepsSource } from '../../types/health';

interface StepsTrackingProps {
  date: string;
  onStepsUpdate?: (steps: number) => void;
}

export const StepsTracking: React.FC<StepsTrackingProps> = ({
  date,
  onStepsUpdate
}) => {
  const { user } = useAuthStore();
  const [stepsEntry, setStepsEntry] = useState<StepsEntry | null>(null);
  const [stepsInput, setStepsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadStepsData();
  }, [date]);

  const loadStepsData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await HealthService.getStepsEntryByDate(user.id, date);
      if (result.success && result.data) {
        setStepsEntry(result.data);
        setStepsInput(result.data.steps.toString());
      } else {
        setStepsEntry(null);
        setStepsInput('');
      }
    } catch (error) {
      console.error('Failed to load steps data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepsSubmit = async () => {
    if (!user) return;

    const steps = parseInt(stepsInput);
    if (isNaN(steps) || steps < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of steps');
      return;
    }

    setIsLoading(true);
    try {
      const result = await HealthService.addStepsEntry(user.id, date, steps);
      if (result.success && result.data) {
        setStepsEntry(result.data);
        setIsEditing(false);

        if (onStepsUpdate) {
          onStepsUpdate(steps);
        }

        // Show celebration if goal achieved
        if (result.data.goalProgress.achieved && (!stepsEntry || !stepsEntry.goalProgress.achieved)) {
          showStepsGoalAchieved();
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to save steps');
      }
    } catch (error) {
      console.error('Failed to save steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showStepsGoalAchieved = () => {
    Alert.alert(
      '🎉 Steps Goal Achieved!',
      `Great job reaching your daily step goal!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 25) return '#EF4444';  // Red
    if (percentage < 50) return '#F59E0B';  // Orange
    if (percentage < 75) return '#3B82F6';  // Blue
    if (percentage < 100) return '#06B6D4'; // Cyan
    return '#10B981';                       // Green
  };

  return (
    <View style={styles.stepsContainer}>
      <View style={styles.stepsHeader}>
        <Text style={styles.stepsTitle}>Daily Steps</Text>

        {stepsEntry && !isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Steps Display/Input */}
      <View style={styles.stepsInputContainer}>
        {isEditing || !stepsEntry ? (
          <View style={styles.stepsInputRow}>
            <TextInput
              style={styles.stepsInput}
              placeholder="Enter steps"
              value={stepsInput}
              onChangeText={setStepsInput}
              keyboardType="number-pad"
              autoFocus={isEditing}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleStepsSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setStepsInput(stepsEntry?.steps.toString() || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.stepsDisplay}>
            <Text style={styles.stepsValue}>
              {stepsEntry.steps.toLocaleString()}
            </Text>
            <Text style={styles.stepsLabel}>steps</Text>
          </View>
        )}
      </View>

      {/* Goal Progress */}
      {stepsEntry && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Goal: {stepsEntry.goalProgress.dailyGoal.toLocaleString()} steps
            </Text>
            <Text
              style={[
                styles.progressPercentage,
                { color: getProgressColor(stepsEntry.goalProgress.percentage) }
              ]}
            >
              {stepsEntry.goalProgress.percentage}%
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(stepsEntry.goalProgress.percentage, 100)}%`,
                  backgroundColor: getProgressColor(stepsEntry.goalProgress.percentage)
                }
              ]}
            />
          </View>

          {stepsEntry.goalProgress.achieved ? (
            <Text style={styles.goalAchievedText}>🎉 Goal Achieved!</Text>
          ) : (
            <Text style={styles.remainingStepsText}>
              {(stepsEntry.goalProgress.dailyGoal - stepsEntry.steps).toLocaleString()} steps remaining
            </Text>
          )}
        </View>
      )}

      {/* Calorie Burn */}
      {stepsEntry && (
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesText}>
            🔥 {stepsEntry.caloriesBurned} calories burned from steps
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6'
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  stepsInputContainer: {
    marginBottom: 16
  },
  stepsInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  stepsInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  },
  stepsDisplay: {
    alignItems: 'center'
  },
  stepsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827'
  },
  stepsLabel: {
    fontSize: 16,
    color: '#6B7280'
  },
  progressContainer: {
    marginBottom: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151'
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  goalAchievedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center'
  },
  remainingStepsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  },
  caloriesContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  caloriesText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500'
  }
});