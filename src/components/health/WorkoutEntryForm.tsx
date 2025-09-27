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
  Animated
} from 'react-native';
import {
  WorkoutEntry,
  WorkoutType,
  WorkoutIntensity,
  AddWorkoutForm,
  WorkoutFormState,
  WorkoutTypeInfo
} from '../../types/health';
import { activityTrackingService } from '../../services/firebase/services/ActivityTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';
import { useAuthStore } from '../../stores/authStore';

interface WorkoutEntryFormProps {
  initialDate?: string;
  onSuccess?: (entry: WorkoutEntry) => void;
  onCancel?: () => void;
  existingEntry?: WorkoutEntry; // For editing existing entries
}

export const WorkoutEntryForm: React.FC<WorkoutEntryFormProps> = ({
  initialDate,
  onSuccess,
  onCancel,
  existingEntry
}) => {
  const { user } = useAuthStore();
  const [formState, setFormState] = useState<WorkoutFormState>({
    data: {
      type: existingEntry?.type || 'cardio',
      name: existingEntry?.name || '',
      duration: existingEntry?.duration.toString() || '',
      intensity: existingEntry?.intensity || 'medium',
      distance: existingEntry?.distance?.toString() || '',
      sets: existingEntry?.sets?.toString() || '',
      reps: existingEntry?.reps?.toString() || '',
      weight: existingEntry?.weight?.toString() || '',
      notes: existingEntry?.notes || ''
    },
    errors: {},
    isValid: false,
    isDirty: false,
    isSubmitting: false,
    calorieEstimate: 0
  });

  const [selectedDate, setSelectedDate] = useState(
    initialDate || existingEntry?.date || DateNavigationUtils.getTodayString()
  );
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutTypeInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cardio');
  const [animatedValue] = useState(new Animated.Value(0));

  const isEditing = !!existingEntry;

  // Load workout types and validate form when data changes
  useEffect(() => {
    const types = activityTrackingService.getWorkoutTypes();
    setWorkoutTypes(types);
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

  const updateFormData = (field: keyof AddWorkoutForm, value: string | WorkoutType | WorkoutIntensity) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: undefined }
    }));
  };

  const validateForm = () => {
    const { name, duration, type, intensity } = formState.data;
    const errors: Partial<Record<keyof AddWorkoutForm, string>> = {};

    // Validate name
    if (!name.trim()) {
      errors.name = 'Workout name is required';
    }

    // Validate duration
    const durationNum = parseFloat(duration);
    if (!duration.trim()) {
      errors.duration = 'Duration is required';
    } else if (isNaN(durationNum) || durationNum <= 0) {
      errors.duration = 'Please enter a valid duration';
    } else {
      const validation = activityTrackingService.validateWorkoutDuration(durationNum);
      if (!validation.isValid) {
        errors.duration = validation.message;
      }
    }

    // Calculate calorie estimate
    let calorieEstimate = 0;
    if (!isNaN(durationNum) && durationNum > 0) {
      calorieEstimate = activityTrackingService.calculateWorkoutCalories(type, intensity, durationNum);
    }

    // Validate date
    if (!DateNavigationUtils.isValidDateString(selectedDate)) {
      errors.name = 'Please select a valid date';
    } else if (DateNavigationUtils.isFutureDate(selectedDate)) {
      errors.name = 'Cannot log workouts for future dates';
    }

    const isValid = Object.keys(errors).length === 0;

    setFormState(prev => ({
      ...prev,
      errors,
      isValid,
      calorieEstimate
    }));
  };

  const handleWorkoutTypeSelect = (type: WorkoutType) => {
    updateFormData('type', type);

    // Auto-suggest workout name if empty
    if (!formState.data.name.trim()) {
      const typeInfo = activityTrackingService.getWorkoutTypeInfo(type);
      if (typeInfo) {
        updateFormData('name', typeInfo.name);
      }
    }
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
      const durationNum = parseFloat(formState.data.duration);
      const options = {
        distance: formState.data.distance ? parseFloat(formState.data.distance) : undefined,
        sets: formState.data.sets ? parseInt(formState.data.sets) : undefined,
        reps: formState.data.reps ? parseInt(formState.data.reps) : undefined,
        weight: formState.data.weight ? parseFloat(formState.data.weight) : undefined,
        notes: formState.data.notes.trim() || undefined
      };

      let result;

      if (isEditing && existingEntry) {
        // Update existing entry
        result = await activityTrackingService.updateWorkoutEntry(existingEntry.id, {
          type: formState.data.type,
          name: formState.data.name.trim(),
          duration: durationNum,
          intensity: formState.data.intensity,
          ...options
        });
      } else {
        // Create new entry
        result = await activityTrackingService.createWorkoutEntry(
          user.id,
          formState.data.type,
          formState.data.name.trim(),
          durationNum,
          formState.data.intensity,
          selectedDate,
          options
        );
      }

      if (result.success && result.data) {
        if (onSuccess) {
          onSuccess(result.data);
        }

        if (!isEditing) {
          // Reset form for new entries
          setFormState(prev => ({
            ...prev,
            data: {
              type: 'cardio',
              name: '',
              duration: '',
              intensity: 'medium',
              distance: '',
              sets: '',
              reps: '',
              weight: '',
              notes: ''
            },
            isDirty: false
          }));
        }

        Alert.alert(
          'Success! 💪',
          isEditing
            ? 'Workout updated successfully!'
            : `${formState.data.name} logged! You burned approximately ${formState.calorieEstimate} calories.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save workout entry');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const workoutCategories = ['cardio', 'strength', 'sports', 'flexibility', 'other'];
  const typesInCategory = workoutTypes.filter(t => t.category === selectedCategory);

  const intensityOptions: { value: WorkoutIntensity; label: string; description: string; color: string }[] = [
    { value: 'low', label: 'Low', description: 'Light effort', color: '#10B981' },
    { value: 'medium', label: 'Medium', description: 'Moderate effort', color: '#F59E0B' },
    { value: 'high', label: 'High', description: 'High effort', color: '#EF4444' }
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValue }] }]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isEditing ? 'Edit Workout' : 'Log Workout'}
          </Text>

          {/* Workout Category Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {workoutCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Workout Type Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Workout Type *</Text>
            <View style={styles.typeGrid}>
              {typesInCategory.map((typeInfo) => (
                <TouchableOpacity
                  key={typeInfo.type}
                  style={[
                    styles.typeButton,
                    formState.data.type === typeInfo.type && styles.typeButtonActive
                  ]}
                  onPress={() => handleWorkoutTypeSelect(typeInfo.type)}
                >
                  <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
                  <Text style={[
                    styles.typeText,
                    formState.data.type === typeInfo.type && styles.typeTextActive
                  ]}>
                    {typeInfo.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Workout Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Workout Name *</Text>
            <TextInput
              style={[
                styles.input,
                formState.errors.name && styles.inputError
              ]}
              placeholder="e.g., Morning Run, Chest Day"
              value={formState.data.name}
              onChangeText={(text) => updateFormData('name', text)}
              returnKeyType="next"
              accessibilityLabel="Workout name"
            />
            {formState.errors.name && (
              <Text style={styles.errorText}>{formState.errors.name}</Text>
            )}
          </View>

          {/* Duration and Intensity Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Duration (min) *</Text>
              <TextInput
                style={[
                  styles.input,
                  formState.errors.duration && styles.inputError
                ]}
                placeholder="30"
                value={formState.data.duration}
                onChangeText={(text) => updateFormData('duration', text)}
                keyboardType="number-pad"
                returnKeyType="next"
                accessibilityLabel="Workout duration in minutes"
              />
              {formState.errors.duration && (
                <Text style={styles.errorText}>{formState.errors.duration}</Text>
              )}
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Intensity *</Text>
              <View style={styles.intensityContainer}>
                {intensityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.intensityButton,
                      formState.data.intensity === option.value && styles.intensityButtonActive,
                      formState.data.intensity === option.value && { borderColor: option.color }
                    ]}
                    onPress={() => updateFormData('intensity', option.value)}
                  >
                    <Text style={[
                      styles.intensityText,
                      formState.data.intensity === option.value && { color: option.color }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Optional Fields Based on Workout Type */}
          {(formState.data.type === 'running' || formState.data.type === 'cycling' || formState.data.type === 'walking') && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="5.0"
                value={formState.data.distance}
                onChangeText={(text) => updateFormData('distance', text)}
                keyboardType="decimal-pad"
                accessibilityLabel="Distance in kilometers"
              />
            </View>
          )}

          {(formState.data.type === 'strength' || formState.data.type === 'weightlifting' || formState.data.type === 'powerlifting') && (
            <View style={styles.rowContainer}>
              <View style={[styles.fieldContainer, styles.thirdField]}>
                <Text style={styles.label}>Sets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  value={formState.data.sets}
                  onChangeText={(text) => updateFormData('sets', text)}
                  keyboardType="number-pad"
                  accessibilityLabel="Number of sets"
                />
              </View>

              <View style={[styles.fieldContainer, styles.thirdField]}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12"
                  value={formState.data.reps}
                  onChangeText={(text) => updateFormData('reps', text)}
                  keyboardType="number-pad"
                  accessibilityLabel="Number of reps"
                />
              </View>

              <View style={[styles.fieldContainer, styles.thirdField]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  value={formState.data.weight}
                  onChangeText={(text) => updateFormData('weight', text)}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Weight in kilograms"
                />
              </View>
            </View>
          )}

          {/* Calorie Estimate */}
          {formState.calorieEstimate > 0 && (
            <View style={styles.calorieEstimateContainer}>
              <Text style={styles.calorieEstimateTitle}>Estimated Calories Burned</Text>
              <Text style={styles.calorieEstimateValue}>
                {formState.calorieEstimate} calories
              </Text>
            </View>
          )}

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
              placeholder="e.g., new personal record, felt strong, outdoor workout"
              value={formState.data.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
              accessibilityLabel="Workout notes"
            />
            <Text style={styles.characterCount}>{formState.data.notes.length}/300</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={formState.isSubmitting}
                accessibilityLabel="Cancel workout entry"
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
              accessibilityLabel={isEditing ? "Update workout entry" : "Save workout entry"}
              accessibilityRole="button"
            >
              {formState.isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Workout' : 'Log Workout'}
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
  fieldContainer: {
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
    marginRight: 8,
  },
  thirdField: {
    flex: 1,
    marginRight: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#10B981',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#10B981',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calorieEstimateContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  calorieEstimateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  calorieEstimateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
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
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
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