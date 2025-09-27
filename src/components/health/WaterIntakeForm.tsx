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
  WaterEntry,
  WaterUnit,
  WaterQuickAdd,
  AddWaterForm,
  WaterFormState
} from '../../types/health';
import { waterTrackingService } from '../../services/firebase/services/WaterTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';
import { useAuthStore } from '../../stores/authStore';

interface WaterIntakeFormProps {
  initialDate?: string;
  initialAmount?: number;
  onSuccess?: (entry: WaterEntry) => void;
  onCancel?: () => void;
  existingEntry?: WaterEntry; // For editing existing entries
}

export const WaterIntakeForm: React.FC<WaterIntakeFormProps> = ({
  initialDate,
  initialAmount,
  onSuccess,
  onCancel,
  existingEntry
}) => {
  const { user } = useAuthStore();
  const [formState, setFormState] = useState<WaterFormState>({
    data: {
      amount: initialAmount?.toString() || existingEntry?.amount.toString() || '',
      unit: (user?.preferences?.units?.water as WaterUnit) || 'ml',
      source: existingEntry?.source || 'water',
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
  const [quickAddOptions, setQuickAddOptions] = useState<WaterQuickAdd[]>([]);
  const [animatedValue] = useState(new Animated.Value(0));

  const isEditing = !!existingEntry;

  // Get quick-add options when unit changes
  useEffect(() => {
    const options = waterTrackingService.getQuickAddOptions(formState.data.unit);
    setQuickAddOptions(options);
  }, [formState.data.unit]);

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

  const updateFormData = (field: keyof AddWaterForm, value: string) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      isDirty: true,
      errors: { ...prev.errors, [field]: undefined }
    }));
  };

  const validateForm = () => {
    const { amount, unit } = formState.data;
    const errors: Partial<Record<keyof AddWaterForm, string>> = {};

    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount.trim()) {
      errors.amount = 'Amount is required';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else {
      const validation = waterTrackingService.validateWaterAmount(amountNum, unit);
      if (!validation.isValid) {
        errors.amount = validation.message;
      }
    }

    // Validate date
    if (!DateNavigationUtils.isValidDateString(selectedDate)) {
      errors.amount = 'Please select a valid date';
    } else if (DateNavigationUtils.isFutureDate(selectedDate)) {
      errors.amount = 'Cannot log water for future dates';
    }

    const isValid = Object.keys(errors).length === 0;

    setFormState(prev => ({
      ...prev,
      errors,
      isValid
    }));
  };

  const handleQuickAdd = (quickAdd: WaterQuickAdd) => {
    updateFormData('amount', quickAdd.amount.toString());

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
      const amountNum = parseFloat(formState.data.amount);
      let result;

      if (isEditing && existingEntry) {
        // Update existing entry
        result = await waterTrackingService.updateWaterEntry(existingEntry.id, {
          amount: amountNum,
          unit: formState.data.unit,
          source: formState.data.source,
          notes: formState.data.notes.trim() || undefined,
        });
      } else {
        // Create new entry
        result = await waterTrackingService.createWaterEntry(
          user.id,
          amountNum,
          formState.data.unit,
          selectedDate,
          formState.data.source,
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
              amount: '',
              unit: prev.data.unit,
              source: 'water',
              notes: ''
            },
            isDirty: false
          }));
        }

        Alert.alert(
          'Success!',
          isEditing ? 'Water entry updated successfully!' : `${waterTrackingService.formatWaterAmount(result.data.amount, formState.data.unit)} logged successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save water entry');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const convertedAmount = formState.data.amount
    ? waterTrackingService.convertWaterAmount(
        parseFloat(formState.data.amount) || 0,
        formState.data.unit,
        formState.data.unit === 'ml' ? 'fl_oz' : 'ml'
      )
    : 0;

  const sourceOptions = [
    { value: 'water', label: 'Water', icon: '💧' },
    { value: 'coffee', label: 'Coffee', icon: '☕' },
    { value: 'tea', label: 'Tea', icon: '🍵' },
    { value: 'juice', label: 'Juice', icon: '🧃' },
    { value: 'other', label: 'Other', icon: '🥤' }
  ] as const;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValue }] }]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {isEditing ? 'Edit Water Entry' : 'Log Water Intake'}
          </Text>

          {/* Quick Add Buttons */}
          <View style={styles.quickAddContainer}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
              {quickAddOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickAddButton,
                    formState.data.amount === option.amount.toString() && styles.quickAddButtonActive
                  ]}
                  onPress={() => handleQuickAdd(option)}
                  accessibilityLabel={`Quick add ${option.label}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickAddIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.quickAddText,
                    formState.data.amount === option.amount.toString() && styles.quickAddTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Custom Amount Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[
                  styles.amountInput,
                  formState.errors.amount && styles.inputError
                ]}
                placeholder={`e.g., ${quickAddOptions[0]?.amount || 250}`}
                value={formState.data.amount}
                onChangeText={(text) => updateFormData('amount', text)}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel={`Water amount in ${formState.data.unit}`}
              />

              <View style={styles.unitSelector}>
                {(['ml', 'fl_oz', 'cups'] as WaterUnit[]).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      formState.data.unit === unit && styles.unitButtonActive
                    ]}
                    onPress={() => {
                      // Convert current amount to new unit if there's a value
                      if (formState.data.amount) {
                        const currentAmount = parseFloat(formState.data.amount);
                        const convertedAmount = waterTrackingService.convertWaterAmount(
                          currentAmount,
                          formState.data.unit,
                          unit
                        );
                        updateFormData('amount', convertedAmount.toFixed(1));
                      }
                      updateFormData('unit', unit);
                    }}
                    accessibilityLabel={`Select ${unit}`}
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.unitButtonText,
                      formState.data.unit === unit && styles.unitButtonTextActive
                    ]}>
                      {unit === 'fl_oz' ? 'fl oz' : unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Unit Conversion Display */}
            {formState.data.amount && parseFloat(formState.data.amount) > 0 && (
              <Text style={styles.conversionText}>
                ≈ {Math.round(convertedAmount * 10) / 10} {formState.data.unit === 'ml' ? 'fl oz' : 'ml'}
              </Text>
            )}

            {formState.errors.amount && (
              <Text style={styles.errorText}>{formState.errors.amount}</Text>
            )}
          </View>

          {/* Source Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Source</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceScroll}>
              {sourceOptions.map((source) => (
                <TouchableOpacity
                  key={source.value}
                  style={[
                    styles.sourceButton,
                    formState.data.source === source.value && styles.sourceButtonActive
                  ]}
                  onPress={() => updateFormData('source', source.value)}
                  accessibilityLabel={`Select ${source.label}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.sourceIcon}>{source.icon}</Text>
                  <Text style={[
                    styles.sourceText,
                    formState.data.source === source.value && styles.sourceTextActive
                  ]}>
                    {source.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
              placeholder="e.g., with lemon, post-workout, felt thirsty"
              value={formState.data.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={200}
              accessibilityLabel="Water entry notes"
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
                accessibilityLabel="Cancel water entry"
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
              accessibilityLabel={isEditing ? "Update water entry" : "Save water entry"}
              accessibilityRole="button"
            >
              {formState.isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Entry' : 'Log Water'}
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
  quickAddContainer: {
    marginBottom: 24,
  },
  quickAddScroll: {
    flexDirection: 'row',
  },
  quickAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  quickAddIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  quickAddTextActive: {
    color: '#3B82F6',
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
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
  unitSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  conversionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sourceScroll: {
    flexDirection: 'row',
  },
  sourceButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 70,
  },
  sourceButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  sourceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  sourceTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
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
    backgroundColor: '#3B82F6',
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