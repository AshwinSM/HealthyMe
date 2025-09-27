import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Controller } from 'react-hook-form';
import { useFoodEntryForm } from '../../hooks/useFoodEntryForm';
import { FoodEntryFormData, MealType, FoodSuggestion, FoodItem } from '../../types/health';

interface FoodEntryFormProps {
  initialMealType?: MealType;
  initialDate?: string;
  onSuccess?: (entry: FoodItem) => void;
  onCancel?: () => void;
}

export const FoodEntryForm: React.FC<FoodEntryFormProps> = ({
  initialMealType,
  initialDate,
  onSuccess,
  onCancel
}) => {
  const {
    form,
    nutritionPreview,
    recentFoods,
    selectRecentFood,
    onSubmit,
    isValid,
    isDirty,
    isSubmitting,
    errors
  } = useFoodEntryForm({
    initialData: {
      mealType: initialMealType,
      date: initialDate
    }
  });

  const [showNutritionPreview, setShowNutritionPreview] = useState(false);
  const [showRecentFoods, setShowRecentFoods] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Delay component initialization to prevent conflicts with navigation animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentMounted(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  const quantityRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handleSubmit = async (data: FoodEntryFormData) => {
    console.log('🔴 FoodEntryForm.handleSubmit - Form submitted');
    console.log('🔴 Submitted data:', data);
    setSubmitError(null); // Clear previous errors

    const success = await onSubmit(data);
    console.log('🔴 Submission result:', success);

    if (success && onSuccess) {
      // Create a mock FoodItem for the success callback
      const mockEntry: FoodItem = {
        id: 'temp-id',
        userId: 'mock-user-id',
        date: data.date,
        mealType: data.mealType,
        foodName: data.name,
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        nutrition: nutritionPreview || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        },
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        notes: data.notes
      };
      console.log('🔴 Calling onSuccess with mockEntry:', mockEntry);
      onSuccess(mockEntry);
    } else if (!success) {
      console.error('🚨 Form submission failed');
      setSubmitError('Failed to save food item. Please check the logs and try again.');
    }
  };

  const handleRecentFoodSelect = (suggestion: FoodSuggestion) => {
    selectRecentFood(suggestion);
    setShowRecentFoods(false);
    // Focus quantity field after selecting food
    setTimeout(() => {
      quantityRef.current?.focus();
    }, 100);
  };

  const measurementUnits = [
    { label: 'Cups', value: 'cups' },
    { label: 'Ounces', value: 'ounces' },
    { label: 'Grams', value: 'grams' },
    { label: 'Pounds', value: 'pounds' },
    { label: 'Pieces', value: 'pieces' },
    { label: 'Slices', value: 'slices' },
    { label: 'Tablespoons', value: 'tablespoons' },
    { label: 'Teaspoons', value: 'teaspoons' },
    { label: 'Liters', value: 'liters' },
    { label: 'Milliliters', value: 'milliliters' }
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        
        {/* Food Name Input with Suggestions */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Food Name *</Text>
          <Controller
            control={form.control}
            name="name"
            rules={{ required: 'Food name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g., Grilled Chicken Breast"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={() => isComponentMounted && setShowRecentFoods(true)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => quantityRef.current?.focus()}
                />
                
                {showRecentFoods && recentFoods.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsHeader}>Recent Foods:</Text>
                    <ScrollView 
                      style={styles.suggestionsList}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {recentFoods.slice(0, 8).map((suggestion, index) => (
                        <TouchableOpacity
                          key={`${suggestion.name}-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => handleRecentFoodSelect(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion.name}</Text>
                          <Text style={styles.suggestionFrequency}>
                            Used {suggestion.frequency} times
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.closeSuggestions}
                      onPress={() => setShowRecentFoods(false)}
                    >
                      <Text style={styles.closeSuggestionsText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          )}
        </View>

        {/* Quantity and Unit Row */}
        <View style={styles.rowContainer}>
          <View style={[styles.fieldContainer, styles.quantityField]}>
            <Text style={styles.label}>Quantity *</Text>
            <Controller
              control={form.control}
              name="quantity"
              rules={{ 
                required: 'Quantity is required',
                validate: (value) => {
                  const num = parseFloat(value);
                  if (isNaN(num)) return 'Please enter a valid number';
                  if (num <= 0) return 'Quantity must be greater than 0';
                  if (num > 100) return 'Quantity seems too large';
                  return true;
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={quantityRef}
                  style={[styles.input, errors.quantity && styles.inputError]}
                  placeholder="1.5"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => notesRef.current?.focus()}
                />
              )}
            />
            {errors.quantity && (
              <Text style={styles.errorText}>{errors.quantity.message}</Text>
            )}
          </View>

          <View style={[styles.fieldContainer, styles.unitField]}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.pickerContainer}>
              {measurementUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitOption,
                    form.watch('unit') === unit.value && styles.unitOptionSelected
                  ]}
                  onPress={() => form.setValue('unit', unit.value as any)}
                >
                  <Text style={[
                    styles.unitOptionText,
                    form.watch('unit') === unit.value && styles.unitOptionTextSelected
                  ]}>
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Nutrition Preview */}
        {nutritionPreview && (
          <View style={styles.nutritionPreview}>
            <TouchableOpacity
              onPress={() => setShowNutritionPreview(!showNutritionPreview)}
              style={styles.nutritionPreviewHeader}
            >
              <Text style={styles.nutritionPreviewTitle}>
                Estimated Nutrition: {nutritionPreview.calories} cal
              </Text>
              <Text style={styles.nutritionPreviewToggle}>
                {showNutritionPreview ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {showNutritionPreview && (
              <View style={styles.nutritionDetails}>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionItem}>Protein: {nutritionPreview.protein}g</Text>
                  <Text style={styles.nutritionItem}>Carbs: {nutritionPreview.carbs}g</Text>
                </View>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionItem}>Fats: {nutritionPreview.fat}g</Text>
                  <Text style={styles.nutritionItem}>Fiber: {nutritionPreview.fiber}g</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <Controller
            control={form.control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                ref={notesRef}
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about this food..."
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        {/* Error Display */}
        {submitError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorDisplayText}>{submitError}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (!isValid || isSubmitting) && styles.buttonDisabled
            ]}
            onPress={form.handleSubmit(handleSubmit)}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Add Food</Text>
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
    backgroundColor: '#ffffff'
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40
  },
  fieldContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12
  },
  quantityField: {
    flex: 1
  },
  unitField: {
    flex: 1
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  unitOptionSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981'
  },
  unitOptionText: {
    fontSize: 12,
    color: '#374151'
  },
  unitOptionTextSelected: {
    color: '#ffffff'
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    maxHeight: 250,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  suggestionsList: {
    maxHeight: 160,
    flexGrow: 0
  },
  suggestionsHeader: {
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  suggestionText: {
    fontSize: 16,
    color: '#374151'
  },
  suggestionFrequency: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  closeSuggestions: {
    padding: 12,
    alignItems: 'center'
  },
  closeSuggestionsText: {
    fontSize: 14,
    color: '#6B7280'
  },
  nutritionPreview: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden'
  },
  nutritionPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  nutritionPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D'
  },
  nutritionPreviewToggle: {
    fontSize: 16,
    color: '#15803D'
  },
  nutritionDetails: {
    padding: 12,
    paddingTop: 0
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  nutritionItem: {
    fontSize: 14,
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 2
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
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
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorDisplayText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center'
  }
});