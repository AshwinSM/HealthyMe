import { Timestamp, FirestoreDataConverter, Unsubscribe } from 'firebase/firestore';
import { BaseFirebaseService, QueryFilter } from '../base/BaseFirebaseService';
import { FoodEntry, MacroNutrients, MealType, MeasurementUnit, ApiResponse } from '../../../types';

// Firestore converter for FoodEntry
const foodEntryConverter: FirestoreDataConverter<FoodEntry> = {
  toFirestore: (foodEntry: FoodEntry) => {
    return {
      id: foodEntry.id,
      userId: foodEntry.userId,
      date: foodEntry.date,
      mealType: foodEntry.mealType,
      name: foodEntry.name,
      quantity: foodEntry.quantity,
      unit: foodEntry.unit,
      calories: foodEntry.calories,
      macros: foodEntry.macros,
      photoURL: foodEntry.photoURL,
      notes: foodEntry.notes,
      createdAt: foodEntry.createdAt,
      updatedAt: foodEntry.updatedAt
    };
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: data.id,
      userId: data.userId,
      date: data.date,
      mealType: data.mealType,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      calories: data.calories,
      macros: data.macros,
      photoURL: data.photoURL,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    } as FoodEntry;
  }
};

/**
 * Service for managing food entries in Firestore
 * Handles food logging, nutrition tracking, and meal organization
 */
export class FoodEntryService extends BaseFirebaseService<FoodEntry> {
  constructor() {
    super('foodEntries', foodEntryConverter);
  }

  /**
   * Create a new food entry with validation
   */
  async create(foodData: Omit<FoodEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<FoodEntry>> {
    try {
      const now = Timestamp.now();
      const id = this.generateFoodEntryId(foodData.userId, foodData.date, foodData.mealType);
      
      const foodEntry: FoodEntry = {
        ...foodData,
        id,
        createdAt: now,
        updatedAt: now
      };

      // Validate nutrition data
      if (!this.isValidNutritionData(foodData.macros)) {
        return {
          success: false,
          error: 'INVALID_NUTRITION_DATA',
          message: 'Nutrition data contains invalid values',
          timestamp: now
        };
      }

      const result = await super.create(foodEntry as any);

      // Update daily summary in background (don't await to avoid blocking)
      if (result.success) {
        this.updateDailySummary(foodData.userId, foodData.date).catch(error => {
          console.warn('Failed to update daily summary:', error);
        });
      }

      return result;
    } catch (error: any) {
      console.error('Food entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to log food entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get food entries for a specific date
   */
  async getFoodEntriesForDate(userId: string, date: string): Promise<ApiResponse<FoodEntry[]>> {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date }
    ];

    return this.query(filters, 'createdAt', 'asc');
  }

  /**
   * Get food entries by meal type for a specific date
   */
  async getFoodEntriesByMealType(userId: string, date: string, mealType: MealType): Promise<ApiResponse<FoodEntry[]>> {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date },
      { field: 'mealType', operator: '==', value: mealType }
    ];

    return this.query(filters, 'createdAt', 'asc');
  }

  /**
   * Get food entries for a date range
   */
  async getFoodEntriesForDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<FoodEntry[]>> {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '>=', value: startDate },
      { field: 'date', operator: '<=', value: endDate }
    ];

    return this.query(filters, 'date', 'desc');
  }

  /**
   * Subscribe to food entries for a specific date
   */
  subscribeToDateEntries(userId: string, date: string, callback: (entries: FoodEntry[]) => void): Unsubscribe {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date }
    ];

    return this.subscribeToQuery(filters, callback, 'createdAt');
  }

  /**
   * Subscribe to food entries by meal type for a specific date
   */
  subscribeToMealTypeEntries(
    userId: string, 
    date: string, 
    mealType: MealType, 
    callback: (entries: FoodEntry[]) => void
  ): Unsubscribe {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date },
      { field: 'mealType', operator: '==', value: mealType }
    ];

    return this.subscribeToQuery(filters, callback, 'createdAt');
  }

  /**
   * Calculate total nutrition for a date
   */
  async calculateDailyNutrition(userId: string, date: string): Promise<ApiResponse<{
    totalCalories: number;
    totalMacros: MacroNutrients;
    entriesCount: number;
  }>> {
    try {
      const entriesResponse = await this.getFoodEntriesForDate(userId, date);
      
      if (!entriesResponse.success) {
        return entriesResponse as any;
      }

      const entries = entriesResponse.data || [];
      let totalCalories = 0;
      let totalMacros: MacroNutrients = {
        protein: 0,
        carbohydrates: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      };

      entries.forEach(entry => {
        totalCalories += entry.calories;
        totalMacros.protein += entry.macros.protein;
        totalMacros.carbohydrates += entry.macros.carbohydrates;
        totalMacros.fats += entry.macros.fats;
        totalMacros.fiber += entry.macros.fiber;
        totalMacros.sugar = (totalMacros.sugar || 0) + (entry.macros.sugar || 0);
        totalMacros.sodium = (totalMacros.sodium || 0) + (entry.macros.sodium || 0);
      });

      return {
        success: true,
        data: {
          totalCalories,
          totalMacros,
          entriesCount: entries.length
        },
        message: 'Daily nutrition calculated successfully',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to calculate daily nutrition',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Search food entries by name
   */
  async searchFoodEntries(userId: string, searchTerm: string, limit: number = 20): Promise<ApiResponse<FoodEntry[]>> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation using array-contains for now
      // In production, you'd want to use Algolia or similar for better search
      
      const filters: QueryFilter[] = [
        { field: 'userId', operator: '==', value: userId }
      ];

      const allEntriesResponse = await this.query(filters, 'createdAt', 'desc');
      
      if (!allEntriesResponse.success) {
        return allEntriesResponse;
      }

      // Client-side filtering (not efficient for large datasets)
      const searchResults = (allEntriesResponse.data || [])
        .filter(entry => 
          entry.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limit);

      return {
        success: true,
        data: searchResults,
        message: `Found ${searchResults.length} matching food entries`,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to search food entries',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Generate unique food entry ID
   */
  protected generateFoodEntryId(userId: string, date: string, mealType: MealType): string {
    const timestamp = Date.now();
    return `${userId}_${date}_${mealType}_${timestamp}`;
  }

  /**
   * Validate nutrition data
   */
  private isValidNutritionData(macros: MacroNutrients): boolean {
    return (
      macros.protein >= 0 &&
      macros.carbohydrates >= 0 &&
      macros.fats >= 0 &&
      macros.fiber >= 0 &&
      (macros.sugar === undefined || macros.sugar >= 0) &&
      (macros.sodium === undefined || macros.sodium >= 0)
    );
  }

  /**
   * Update daily summary (placeholder for integration with DailySummaryService)
   */
  private async updateDailySummary(userId: string, date: string): Promise<void> {
    try {
      // This would integrate with DailySummaryService
      // For now, just log the operation
      console.log(`Updating daily summary for user ${userId} on ${date}`);
      
      // Calculate nutrition for the day
      const nutritionResult = await this.calculateDailyNutrition(userId, date);
      
      if (nutritionResult.success) {
        // This data would be sent to DailySummaryService
        console.log('Daily nutrition calculated:', nutritionResult.data);
      }
    } catch (error) {
      console.warn('Failed to update daily summary:', error);
    }
  }

  /**
   * Validate food entry data
   */
  protected validateData(data: FoodEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Food name is required');
    }

    if (!data.date || !this.isValidDate(data.date)) {
      errors.push('Valid date is required (YYYY-MM-DD format)');
    }

    if (!data.mealType || !this.isValidMealType(data.mealType)) {
      errors.push('Valid meal type is required');
    }

    if (!data.quantity || data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!data.unit || !this.isValidMeasurementUnit(data.unit)) {
      errors.push('Valid measurement unit is required');
    }

    if (data.calories < 0) {
      errors.push('Calories cannot be negative');
    }

    if (!this.isValidNutritionData(data.macros)) {
      errors.push('Invalid nutrition data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  /**
   * Validate meal type
   */
  private isValidMealType(mealType: string): boolean {
    const validMealTypes: MealType[] = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];
    return validMealTypes.includes(mealType as MealType);
  }

  /**
   * Validate measurement unit
   */
  private isValidMeasurementUnit(unit: string): boolean {
    const validUnits: MeasurementUnit[] = [
      'cups', 'ounces', 'grams', 'pounds', 'pieces',
      'slices', 'tablespoons', 'teaspoons', 'liters', 'milliliters'
    ];
    return validUnits.includes(unit as MeasurementUnit);
  }
}

export const foodEntryService = new FoodEntryService();