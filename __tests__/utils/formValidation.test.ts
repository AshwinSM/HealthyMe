import { validateField, validateForm, formatDate, debounce } from '../../src/utils/formValidation';
import { FoodEntryFormData } from '../../src/types/health';

describe('formValidation', () => {
  describe('validateField', () => {
    it('should return null for valid required string field', () => {
      const rules = { required: true };
      expect(validateField('valid name', rules)).toBeNull();
    });

    it('should return error for empty required field', () => {
      const rules = { required: true };
      expect(validateField('', rules)).toBe('This field is required');
      expect(validateField('   ', rules)).toBe('This field is required');
    });

    it('should validate minLength correctly', () => {
      const rules = { minLength: 3 };
      expect(validateField('ab', rules)).toBe('Must be at least 3 characters');
      expect(validateField('abc', rules)).toBeNull();
    });

    it('should validate maxLength correctly', () => {
      const rules = { maxLength: 5 };
      expect(validateField('toolong', rules)).toBe('Must be no more than 5 characters');
      expect(validateField('ok', rules)).toBeNull();
    });

    it('should validate pattern correctly', () => {
      const rules = { pattern: /^[a-zA-Z]+$/ };
      expect(validateField('ValidName', rules)).toBeNull();
      expect(validateField('Invalid123', rules)).toBe('Invalid format');
    });

    it('should handle custom validation function', () => {
      const rules = {
        custom: (value: string) => {
          if (value === 'invalid') return 'Custom error message';
          return true;
        }
      };
      expect(validateField('valid', rules)).toBeNull();
      expect(validateField('invalid', rules)).toBe('Custom error message');
    });

    it('should validate numeric fields', () => {
      const rules = { min: 1, max: 100 };
      expect(validateField(0, rules)).toBe('Must be at least 1');
      expect(validateField(50, rules)).toBeNull();
      expect(validateField(150, rules)).toBe('Must be no more than 100');
    });
  });

  describe('validateForm', () => {
    const validFormData: FoodEntryFormData = {
      name: 'Chicken Breast',
      quantity: '50', // Change to valid quantity under 100
      unit: 'grams',
      mealType: 'breakfast',
      date: '2025-01-01',
      notes: 'Grilled with herbs',
      photoUri: undefined
    };

    it('should return no errors for valid form data', () => {
      const errors = validateForm(validFormData);
      expect(errors.name).toBeNull();
      expect(errors.quantity).toBeNull();
      expect(errors.unit).toBeNull();
      expect(errors.mealType).toBeNull();
      expect(errors.date).toBeNull();
    });

    it('should validate required food name', () => {
      const invalidData = { ...validFormData, name: '' };
      const errors = validateForm(invalidData);
      expect(errors.name).toBe('This field is required');
    });

    it('should validate food name length', () => {
      const shortNameData = { ...validFormData, name: 'a' };
      const errors = validateForm(shortNameData);
      expect(errors.name).toBe('Must be at least 2 characters');
    });

    it('should validate quantity as valid number', () => {
      const invalidQuantity = { ...validFormData, quantity: 'not-a-number' };
      const errors = validateForm(invalidQuantity);
      expect(errors.quantity).toBe('Please enter a valid number');
    });

    it('should validate quantity is positive', () => {
      const zeroQuantity = { ...validFormData, quantity: '0' };
      const errors = validateForm(zeroQuantity);
      expect(errors.quantity).toBe('Quantity must be greater than 0');
    });

    it('should validate quantity is not too large', () => {
      const largeQuantity = { ...validFormData, quantity: '150' };
      const errors = validateForm(largeQuantity);
      expect(errors.quantity).toBe('Quantity seems too large. Please check your input');
    });

    it('should validate valid measurement units', () => {
      const invalidUnit = { ...validFormData, unit: 'invalid-unit' as any };
      const errors = validateForm(invalidUnit);
      expect(errors.unit).toBe('Please select a valid measurement unit');
    });

    it('should validate date format and range', () => {
      const futureDate = { ...validFormData, date: '2030-01-01' };
      const errors = validateForm(futureDate);
      expect(errors.date).toBe('Cannot log food for future dates');
    });

    it('should validate date is not too old', () => {
      const oldDate = { ...validFormData, date: '2020-01-01' };
      const errors = validateForm(oldDate);
      expect(errors.date).toBe('Cannot log food more than one year ago');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2025-01-15');
    });

    it('should handle different date inputs', () => {
      const date1 = new Date(2025, 0, 1); // January 1, 2025
      const formatted = formatDate(date1);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});