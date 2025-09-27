import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { HealthService } from '../../services/firebase/health';
import { WorkoutEntry, WorkoutType, WorkoutIntensity } from '../../types/health';
import { Timestamp } from 'firebase/firestore';

interface WorkoutEntryFormProps {
  date: string;
  initialData?: Partial<WorkoutEntry>;
  onSuccess?: (workout: WorkoutEntry) => void;
  onCancel?: () => void;
}

export const WorkoutEntryForm: React.FC<WorkoutEntryFormProps> = ({
  date,
  initialData,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [workoutData, setWorkoutData] = useState({
    type: initialData?.type || 'cardio' as WorkoutType,
    name: initialData?.name || '',
    duration: initialData?.duration?.toString() || '',
    intensity: initialData?.intensity || 'medium' as WorkoutIntensity,
    notes: initialData?.notes || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workoutTypes: { value: WorkoutType; label: string; icon: string }[] = [
    { value: 'cardio', label: 'Cardio', icon: '🏃‍♂️' },
    { value: 'strength', label: 'Strength', icon: '💪' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'flexibility', label: 'Flexibility', icon: '🧘‍♀️' },
    { value: 'other', label: 'Other', icon: '🏋️‍♀️' }
  ];

  const intensityLevels: { value: WorkoutIntensity; label: string; description: string }[] = [
    { value: 'low', label: 'Low', description: 'Light effort, easy pace' },
    { value: 'medium', label: 'Medium', description: 'Moderate effort, some challenge' },
    { value: 'high', label: 'High', description: 'High effort, challenging pace' }
  ];

  const validateForm = (): string | null => {
    if (!workoutData.name.trim()) {
      return 'Workout name is required';
    }

    const duration = parseInt(workoutData.duration);
    if (isNaN(duration) || duration <= 0 || duration > 720) {
      return 'Duration must be between 1 and 720 minutes';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const workoutEntry = {
        type: workoutData.type,
        name: workoutData.name.trim(),
        duration: parseInt(workoutData.duration),
        intensity: workoutData.intensity,
        notes: workoutData.notes.trim() || undefined
      };

      const result = await HealthService.addWorkoutEntry(user.id, date, workoutEntry);

      if (result.success && result.data) {
        if (onSuccess) {
          onSuccess(result.data);
        }

        // Reset form
        setWorkoutData({
          type: 'cardio',
          name: '',
          duration: '',
          intensity: 'medium',
          notes: ''
        });
      } else {
        setError(result.message || 'Failed to save workout');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const estimateCalories = (): number => {
    const duration = parseInt(workoutData.duration) || 0;
    const calorieRates: Record<WorkoutType, Record<WorkoutIntensity, number>> = {
      cardio: { low: 6, medium: 10, high: 15 },
      running: { low: 8, medium: 12, high: 16 },
      walking: { low: 3, medium: 5, high: 7 },
      cycling: { low: 6, medium: 10, high: 14 },
      swimming: { low: 7, medium: 11, high: 15 },
      strength: { low: 4, medium: 6, high: 8 },
      weightlifting: { low: 4, medium: 6, high: 8 },
      bodyweight: { low: 3, medium: 5, high: 7 },
      powerlifting: { low: 5, medium: 7, high: 9 },
      sports: { low: 5, medium: 8, high: 12 },
      basketball: { low: 6, medium: 9, high: 13 },
      football: { low: 7, medium: 10, high: 14 },
      tennis: { low: 5, medium: 8, high: 11 },
      soccer: { low: 6, medium: 9, high: 13 },
      flexibility: { low: 2, medium: 3, high: 4 },
      yoga: { low: 2, medium: 3, high: 4 },
      pilates: { low: 3, medium: 4, high: 5 },
      stretching: { low: 2, medium: 3, high: 4 },
      dance: { low: 4, medium: 6, high: 8 },
      martial_arts: { low: 6, medium: 9, high: 12 },
      hiking: { low: 4, medium: 6, high: 9 },
      climbing: { low: 7, medium: 10, high: 14 },
      other: { low: 4, medium: 6, high: 8 }
    };

    const rate = calorieRates[workoutData.type]?.[workoutData.intensity] || calorieRates.other[workoutData.intensity];
    return Math.round(duration * rate);
  };

  return (
    <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.formTitle}>Log Workout</Text>

      {/* Workout Type Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Workout Type *</Text>
        <View style={styles.typeSelector}>
          {workoutTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                workoutData.type === type.value && styles.typeButtonActive
              ]}
              onPress={() => setWorkoutData(prev => ({ ...prev, type: type.value }))}
            >
              <Text style={styles.typeButtonIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeButtonText,
                workoutData.type === type.value && styles.typeButtonTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Workout Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Workout Name *</Text>
        <TextInput
          style={[styles.textInput, error && styles.inputError]}
          placeholder="e.g., Morning Run, Gym Session"
          value={workoutData.name}
          onChangeText={(text) => setWorkoutData(prev => ({ ...prev, name: text }))}
          returnKeyType="next"
        />
      </View>

      {/* Duration and Intensity Row */}
      <View style={styles.rowContainer}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Duration (minutes) *</Text>
          <TextInput
            style={[styles.textInput, error && styles.inputError]}
            placeholder="30"
            value={workoutData.duration}
            onChangeText={(text) => setWorkoutData(prev => ({ ...prev, duration: text }))}
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Intensity *</Text>
          <View style={styles.intensitySelector}>
            {intensityLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.intensityButton,
                  workoutData.intensity === level.value && styles.intensityButtonActive
                ]}
                onPress={() => setWorkoutData(prev => ({ ...prev, intensity: level.value }))}
              >
                <Text style={[
                  styles.intensityButtonText,
                  workoutData.intensity === level.value && styles.intensityButtonTextActive
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Calorie Estimate */}
      {workoutData.duration && (
        <View style={styles.calorieEstimate}>
          <Text style={styles.calorieEstimateText}>
            🔥 Estimated: {estimateCalories()} calories burned
          </Text>
        </View>
      )}

      {/* Notes */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          placeholder="Add any notes about your workout..."
          value={workoutData.notes}
          onChangeText={(text) => setWorkoutData(prev => ({ ...prev, notes: text }))}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isLoading && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Save Workout</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff'
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24
  },
  fieldContainer: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    minWidth: 80
  },
  typeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE'
  },
  typeButtonIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151'
  },
  typeButtonTextActive: {
    color: '#1E40AF'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12
  },
  halfWidth: {
    flex: 1
  },
  intensitySelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center'
  },
  intensityButtonActive: {
    backgroundColor: '#3B82F6'
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  intensityButtonTextActive: {
    color: '#ffffff'
  },
  calorieEstimate: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  calorieEstimateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E'
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  submitButton: {
    backgroundColor: '#10B981'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF'
  }
});