import { FoodEntryFormData, ValidationSchema, MeasurementUnit, MealType } from '../types/health';

export const foodEntryValidationSchema: ValidationSchema<FoodEntryFormData> = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'.,()]+$/,
    custom: (value: string) => {
      if (value.trim().length < 2) {
        return 'Food name must be at least 2 characters';
      }
      return true;
    }
  },
  quantity: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }
      if (num <= 0) {
        return 'Quantity must be greater than 0';
      }
      if (num > 100) {
        return 'Quantity seems too large. Please check your input';
      }
      return true;
    }
  },
  unit: {
    required: true,
    custom: (value: MeasurementUnit) => {
      const validUnits: MeasurementUnit[] = [
        'cups', 'ounces', 'grams', 'pounds', 'pieces', 'slices', 
        'tablespoons', 'teaspoons', 'liters', 'milliliters'
      ];
      if (!validUnits.includes(value)) {
        return 'Please select a valid measurement unit';
      }
      return true;
    }
  },
  mealType: {
    required: true
  },
  date: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (isNaN(date.getTime())) {
        return 'Please enter a valid date';
      }
      if (date > today) {
        return 'Cannot log food for future dates';
      }
      if (date < oneYearAgo) {
        return 'Cannot log food more than one year ago';
      }
      return true;
    }
  }
};

export const validateField = <T>(value: T, rules: ValidationSchema<any>[keyof ValidationSchema<any>]): string | null => {
  if (!rules) return null;

  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  if (typeof value === 'number') {
    if (rules.min && value < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max && value > rules.max) {
      return `Must be no more than ${rules.max}`;
    }
  }

  if (rules.custom) {
    const result = rules.custom(value);
    if (typeof result === 'string') {
      return result;
    }
  }

  return null;
};

export const validateForm = (data: FoodEntryFormData): Record<keyof FoodEntryFormData, string | null> => {
  const errors: Record<keyof FoodEntryFormData, string | null> = {
    name: null,
    quantity: null,
    unit: null,
    mealType: null,
    date: null,
    notes: null,
    photoUri: null
  };

  Object.keys(data).forEach((key) => {
    const fieldKey = key as keyof FoodEntryFormData;
    const rules = foodEntryValidationSchema[fieldKey];
    console.log('Validating field:', fieldKey, 'with value:', data[fieldKey], 'and rules:', rules);
    if (rules) {
      errors[fieldKey] = validateField(data[fieldKey], rules);
    }
  });

  return errors;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};