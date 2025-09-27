import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  Vibration
} from 'react-native';
import {
  StepsEntry,
  AddStepsForm,
  StepsFormState
} from '../../types/health';
import { activityTrackingService } from '../../services/firebase/services/ActivityTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';
import { useAuthStore } from '../../stores/authStore';

interface StepsEntryFormProps {
  initialDate?: string;
  initialSteps?: number;
  onSuccess?: (entry: StepsEntry) => void;
  onCancel?: () => void;
  existingEntry?: StepsEntry; // For editing existing entries
}

export const StepsEntryForm: React.FC<StepsEntryFormProps> = ({
  initialDate,
  initialSteps,
  onSuccess,
  onCancel,
  existingEntry
}) => {
  const { user } = useAuthStore();
  const [formState, setFormState] = useState<StepsFormState>({
    data: {
      steps: initialSteps?.toString() || existingEntry?.steps.toString() || '',
      goal: existingEntry?.goal || user?.dailyStepsGoal || 10000,
      notes: existingEntry?.notes || ''
    },
    errors: {},
    isValid: false,
    isDirty: false,
    isSubmitting: false
  });

  const [selectedDate, setSelectedDate] = useState(
    initialDate || existingEntry?.date || DateNavigationUtils.getTodayString()
  );
  const [animatedValue] = useState(new Animated.Value(0));

  const isEditing = !!existingEntry;

  // Validate form when data changes
  useEffect(() => {
    validateForm();
  }, [formState.data]);

  // Success animation
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  }, []);

  const updateFormData = (field: keyof AddStepsForm, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: undefined }
    }));
  };

  const validateForm = () => {
    const { steps } = formState.data;
    const errors: Partial<Record<keyof AddStepsForm, string>> = {};

    // Validate steps
    const stepsNum = parseFloat(steps);
    if (!steps.trim()) {
      errors.steps = 'Steps are required';
    } else if (isNaN(stepsNum) || stepsNum < 0) {
      errors.steps = 'Please enter a valid number of steps';
    } else {
      const validation = activityTrackingService.validateSteps(stepsNum);
      if (!validation.isValid) {
        errors.steps = validation.message;
      }
    }

    // Validate date
    if (!DateNavigationUtils.isValidDateString(selectedDate)) {
      errors.steps = 'Please select a valid date';
    } else if (DateNavigationUtils.isFutureDate(selectedDate)) {
      errors.steps = 'Cannot log steps for future dates';
    }

    const isValid = Object.keys(errors).length === 0;

    setFormState(prev => ({
      ...prev,
      errors,
      isValid
    }));
  };

  const handleQuickSteps = (steps: number) => {
    updateFormData('steps', steps.toString());

    // Haptic feedback
    Vibration.vibrate(50);

    // Visual feedback animation
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleSubmit = async () => {
    if (!formState.isValid) {
      validateForm();
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const stepsNum = parseFloat(formState.data.steps);
      let result;

      if (isEditing && existingEntry) {
        // Update existing entry
        result = await activityTrackingService.updateStepsEntry(existingEntry.id, {
          steps: stepsNum,
          goal: formState.data.goal,
          notes: formState.data.notes.trim() || undefined,
        });
      } else {
        // Create new entry
        result = await activityTrackingService.createStepsEntry(
          user.id,
          stepsNum,
          selectedDate,
          formState.data.goal,
          formState.data.notes.trim() || undefined
        );
      }

      if (result.success && result.data) {
        // Success animation and haptics
        Vibration.vibrate([50, 100, 50]);

        if (onSuccess) {
          onSuccess(result.data);
        }

        if (!isEditing) {
          // Reset form for new entries
          setFormState(prev => ({
            ...prev,
            data: {
              steps: '',
              goal: prev.data.goal,
              notes: ''
            },
            isDirty: false
          }));
        }

        const caloriesBurned = activityTrackingService.calculateStepsCalories(stepsNum);
        Alert.alert(
          'Success! 🎯',
          isEditing
            ? 'Steps entry updated successfully!'
            : `${stepsNum.toLocaleString()} steps logged! You burned approximately ${caloriesBurned} calories.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save steps entry');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const quickStepsOptions = [
    { steps: 5000, label: '5,000', icon: '🚶' },
    { steps: 8000, label: '8,000', icon: '🚶‍♀️' },
    { steps: 10000, label: '10,000', icon: '🎯' },
    { steps: 12000, label: '12,000', icon: '🏃' },
    { steps: 15000, label: '15,000', icon: '🏃‍♀️' },
    { steps: 20000, label: '20,000', icon: '🔥' }
  ];

  const currentSteps = parseFloat(formState.data.steps) || 0;
  const calorieEstimate = activityTrackingService.calculateStepsCalories(currentSteps);
  const goalProgress = (currentSteps / (formState.data.goal || 10000)) * 100;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValue }] }]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isEditing ? 'Edit Steps Entry' : 'Log Daily Steps'}
          </Text>

          {/* Quick Steps Buttons */}
          <View style={styles.quickStepsContainer}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.quickStepsGrid}>
              {quickStepsOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickStepsButton,
                    formState.data.steps === option.steps.toString() && styles.quickStepsButtonActive
                  ]}
                  onPress={() => handleQuickSteps(option.steps)}
                  accessibilityLabel={`Quick add ${option.steps} steps`}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickStepsIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.quickStepsText,
                    formState.data.steps === option.steps.toString() && styles.quickStepsTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Steps Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Steps *</Text>
            <TextInput
              style={[
                styles.stepsInput,
                formState.errors.steps && styles.inputError
              ]}
              placeholder="e.g., 10,000"
              value={formState.data.steps}
              onChangeText={(text) => updateFormData('steps', text)}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel="Number of steps"
            />

            {/* Calorie Estimate */}
            {currentSteps > 0 && (
              <View style={styles.estimateContainer}>
                <Text style={styles.estimateText}>
                  ≈ {calorieEstimate} calories burned
                </Text>
                <Text style={styles.goalProgressText}>
                  {goalProgress.toFixed(0)}% of daily goal
                </Text>
              </View>
            )}

            {formState.errors.steps && (
              <Text style={styles.errorText}>{formState.errors.steps}</Text>
            )}
          </View>

          {/* Goal Display */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Daily Goal</Text>
            <View style={styles.goalContainer}>
              <Text style={styles.goalText}>
                {formState.data.goal?.toLocaleString()} steps
              </Text>
              <TouchableOpacity
                style={styles.goalEditButton}
                onPress={() => {
                  // For now, show alert. In production, could open goal setting modal
                  Alert.alert(
                    'Update Goal',
                    'Goal management will be available in settings.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.goalEditText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(goalProgress, 100)}%`,
                    backgroundColor: goalProgress >= 100 ? '#10B981' : '#3B82F6'
                  }
                ]}
              />
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateButtonText}>
                {DateNavigationUtils.formatDisplayDate(selectedDate)}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="e.g., walked to work, hiking trail, treadmill workout"
              value={formState.data.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={200}
              accessibilityLabel="Steps entry notes"
            />
            <Text style={styles.characterCount}>{formState.data.notes.length}/200</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={formState.isSubmitting}
                accessibilityLabel="Cancel steps entry"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!formState.isValid || formState.isSubmitting) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!formState.isValid || formState.isSubmitting}
              accessibilityLabel={isEditing ? "Update steps entry" : "Save steps entry"}
              accessibilityRole="button"
            >
              {formState.isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Steps' : 'Log Steps'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickStepsContainer: {
    marginBottom: 24,
  },
  quickStepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStepsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStepsButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  quickStepsIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickStepsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  quickStepsTextActive: {
    color: '#10B981',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  stepsInput: {
    height: 56,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  estimateContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  estimateText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  goalEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  goalEditText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dateButtonIcon: {
    fontSize: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
  },
});