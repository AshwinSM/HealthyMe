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
import { WeightEntry } from '../../types';
import { weightTrackingService } from '../../services/firebase/services/WeightTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';
import { useAuthStore } from '../../stores/authStore';

interface WeightEntryFormProps {
  initialDate?: string;
  initialWeight?: number;
  onSuccess?: (entry: WeightEntry) => void;
  onCancel?: () => void;
  existingEntry?: WeightEntry; // For editing existing entries
}

export const WeightEntryForm: React.FC<WeightEntryFormProps> = ({
  initialDate,
  initialWeight,
  onSuccess,
  onCancel,
  existingEntry
}) => {
  const { user } = useAuthStore();
  const [weight, setWeight] = useState(
    initialWeight?.toString() ||
    existingEntry?.weight.toString() ||
    ''
  );
  const [unit, setUnit] = useState<'kg' | 'lbs'>(
    existingEntry?.unit ||
    user?.preferences?.units?.weight ||
    'kg'
  );
  const [date, setDate] = useState(
    initialDate ||
    existingEntry?.date ||
    DateNavigationUtils.getTodayString()
  );
  const [notes, setNotes] = useState(existingEntry?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditing = !!existingEntry;

  const validateInput = (): string | null => {
    const weightNum = parseFloat(weight);
    const validation = weightTrackingService.validateWeightRange(weightNum, unit);

    if (!validation.isValid) {
      return validation.message || 'Invalid weight';
    }

    if (!DateNavigationUtils.isValidDateString(date)) {
      return 'Please select a valid date';
    }

    if (DateNavigationUtils.isFutureDate(date)) {
      return 'Cannot log weight for future dates';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateInput();
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
      let result;

      if (isEditing && existingEntry) {
        // Update existing entry
        const weightInKg = weightTrackingService.convertWeight(parseFloat(weight), unit, 'kg');
        result = await weightTrackingService.updateWeightEntry(existingEntry.id, {
          weight: weightInKg,
          unit,
          date,
          notes: notes.trim() || undefined,
        });
      } else {
        // Create new entry
        result = await weightTrackingService.createWeightEntry(
          user.id,
          parseFloat(weight),
          unit,
          date,
          notes.trim() || undefined
        );
      }

      if (result.success && result.data) {
        if (onSuccess) {
          onSuccess(result.data);
        }

        if (!isEditing) {
          // Reset form for new entries
          setWeight('');
          setNotes('');
          setDate(DateNavigationUtils.getTodayString());
        }
      } else {
        if (result.error === 'DUPLICATE_ENTRY') {
          setError('You already have a weight entry for this date. Would you like to update it instead?');
        } else {
          setError(result.message || 'Failed to save weight entry');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const convertedWeight = unit === 'kg'
    ? parseFloat(weight) || 0
    : weightTrackingService.convertWeight(parseFloat(weight) || 0, unit, 'kg');

  const quickWeightOptions = unit === 'kg'
    ? [60, 65, 70, 75, 80, 85, 90]
    : [130, 140, 150, 160, 170, 180, 190, 200];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {isEditing ? 'Edit Weight Entry' : 'Log Weight'}
        </Text>

        {/* Weight Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Weight *</Text>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={[styles.weightInput, error && styles.inputError]}
              placeholder={unit === 'kg' ? '70.0' : '154.0'}
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                setError(null);
              }}
              keyboardType="decimal-pad"
              returnKeyType="next"
              accessibilityLabel={`Weight in ${unit}`}
            />

            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
                onPress={() => {
                  if (unit !== 'kg' && weight) {
                    // Convert current weight to kg
                    const weightInKg = weightTrackingService.convertWeight(parseFloat(weight), 'lbs', 'kg');
                    setWeight(weightInKg.toFixed(1));
                  }
                  setUnit('kg');
                }}
                accessibilityLabel="Select kilograms"
                accessibilityRole="button"
              >
                <Text style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
                onPress={() => {
                  if (unit !== 'lbs' && weight) {
                    // Convert current weight to lbs
                    const weightInLbs = weightTrackingService.convertWeight(parseFloat(weight), 'kg', 'lbs');
                    setWeight(weightInLbs.toFixed(1));
                  }
                  setUnit('lbs');
                }}
                accessibilityLabel="Select pounds"
                accessibilityRole="button"
              >
                <Text style={[styles.unitButtonText, unit === 'lbs' && styles.unitButtonTextActive]}>
                  lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Conversion Display */}
          {weight && parseFloat(weight) > 0 && (
            <Text style={styles.conversionText}>
              = {weightTrackingService.formatWeight(convertedWeight, unit === 'kg' ? 'lbs' : 'kg')}
            </Text>
          )}

          {/* Quick Weight Selection */}
          <View style={styles.quickWeightContainer}>
            <Text style={styles.quickWeightLabel}>Quick Select:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickWeightOptions.map((quickWeight) => (
                <TouchableOpacity
                  key={quickWeight}
                  style={styles.quickWeightButton}
                  onPress={() => setWeight(quickWeight.toString())}
                >
                  <Text style={styles.quickWeightButtonText}>{quickWeight}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Date Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            accessibilityLabel={`Selected date: ${DateNavigationUtils.formatDisplayDate(date)}`}
            accessibilityRole="button"
          >
            <Text style={styles.dateButtonText}>
              {DateNavigationUtils.formatDisplayDate(date)}
            </Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>

          {/* Date validation message */}
          {DateNavigationUtils.isFutureDate(date) && (
            <Text style={styles.warningText}>
              Cannot log weight for future dates
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="e.g., after workout, morning weigh-in, feeling bloated"
            value={notes}
            onChangeText={setNotes}
            multiline={true}
            numberOfLines={2}
            textAlignVertical="top"
            maxLength={200}
            accessibilityLabel="Weight entry notes"
          />
          <Text style={styles.characterCount}>{notes.length}/200</Text>
        </View>

        {/* BMI Preview (if weight is entered) */}
        {weight && parseFloat(weight) > 0 && (
          <View style={styles.bmiPreviewContainer}>
            <Text style={styles.bmiPreviewTitle}>BMI Calculation</Text>
            <Text style={styles.bmiPreviewText}>
              Height information needed in profile to calculate BMI
            </Text>
            <TouchableOpacity style={styles.bmiPreviewLink}>
              <Text style={styles.bmiPreviewLinkText}>Update Height →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityLabel="Cancel weight entry"
              accessibilityRole="button"
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
            accessibilityLabel={isEditing ? "Update weight entry" : "Save weight entry"}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Weight' : 'Save Weight'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 16,
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
  quickWeightContainer: {
    marginTop: 12,
  },
  quickWeightLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  quickWeightButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  quickWeightButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
  bmiPreviewContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  bmiPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  bmiPreviewText: {
    fontSize: 14,
    color: '#0369A1',
    marginBottom: 8,
  },
  bmiPreviewLink: {
    alignSelf: 'flex-start',
  },
  bmiPreviewLinkText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 4,
    textAlign: 'center',
  },
});