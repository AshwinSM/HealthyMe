import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  FoodItem, 
  MealType, 
  NutritionInfo, 
  DailyNutritionSummary, 
  AddFoodForm,
  ApiResponse 
} from '../../types';
import { calculateNutritionForFood } from '../../utils/nutritionCalculator';

export class FoodService {
  private static readonly COLLECTION_NAME = 'food_entries';

  /**
   * Clean nutrition data to remove undefined values that Firebase can't handle
   */
  private static cleanNutritionData(nutrition: any): any {
    const cleanNutrition: any = {
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      fiber: nutrition.fiber || 0
    };

    // Only include optional fields if they have defined values
    if (nutrition.sugar !== undefined && nutrition.sugar !== null) {
      cleanNutrition.sugar = nutrition.sugar;
    }
    if (nutrition.sodium !== undefined && nutrition.sodium !== null) {
      cleanNutrition.sodium = nutrition.sodium;
    }
    if (nutrition.cholesterol !== undefined && nutrition.cholesterol !== null) {
      cleanNutrition.cholesterol = nutrition.cholesterol;
    }

    return cleanNutrition;
  }

  /**
   * Add a new food item with random nutrition data
   */
  static async addFoodItem(
    userId: string,
    date: string,
    formData: AddFoodForm
  ): Promise<ApiResponse<FoodItem>> {
    console.log('🔥 FoodService.addFoodItem - Starting request');
    console.log('🔥 Firebase DB instance:', !!db ? 'Available' : 'NOT AVAILABLE');
    console.log('🔥 Input params:', {
      userId: userId || 'undefined',
      date: date || 'undefined',
      formData: formData || 'undefined'
    });

    try {
      // Generate nutrition using the enhanced calculation engine
      console.log('🔥 About to calculate nutrition for:', {
        name: formData?.foodName || 'undefined',
        quantity: formData?.quantity || 'undefined',
        unit: formData?.unit || 'undefined'
      });
      const nutrition = await calculateNutritionForFood(
        formData.foodName,
        formData.quantity,
        formData.unit as any
      ) || {
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
      };
      console.log('🔥 Nutrition calculation result:', {
        calories: nutrition?.calories || 0,
        protein: nutrition?.protein || 0,
        carbs: nutrition?.carbs || 0,
        fat: nutrition?.fat || 0,
        fiber: nutrition?.fiber || 0,
        sugar: nutrition?.sugar || 'undefined',
        sodium: nutrition?.sodium || 'undefined'
      });
      
      // Validate nutrition data before creating food item
      if (!nutrition || typeof nutrition.calories !== 'number' || nutrition.calories < 0) {
        console.error('🚨 Invalid nutrition data - calories:', nutrition?.calories || 'undefined');
        return {
          success: false,
          error: 'Invalid nutrition data calculated',
          message: 'Failed to calculate nutrition information'
        };
      }

      // Clean nutrition data to remove undefined values (Firebase doesn't accept undefined)
      const cleanNutrition = this.cleanNutritionData(nutrition);
      console.log('🔥 Cleaned nutrition data for Firebase:', cleanNutrition);

      const foodItem: Omit<FoodItem, 'id'> = {
        userId,
        date,
        mealType: formData.mealType,
        foodName: formData.foodName.trim(),
        brand: formData.brand,
        quantity: formData.quantity,
        unit: formData.unit,
        nutrition: cleanNutrition,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        notes: formData.notes || '',
      };
      console.log('🔥 Prepared food item for addition - foodName:', foodItem.foodName, 'quantity:', foodItem.quantity, 'unit:', foodItem.unit);
      console.log('🔥 Collection name:', this.COLLECTION_NAME);
      console.log('🔥 About to call addDoc...');

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), foodItem);
      console.log('🔥 addDoc completed successfully, docRef.id:', docRef.id);
      
      const newFoodItem: FoodItem = {
        id: docRef.id,
        ...foodItem
      };

      console.log('🔥 Returning success response with newFoodItem ID:', newFoodItem.id, 'name:', newFoodItem.foodName);
      return {
        success: true,
        data: newFoodItem,
        message: 'Food item added successfully'
      };
    } catch (error: any) {
      console.error('🚨 ERROR in FoodService.addFoodItem:', error);
      console.error('🚨 Error type:', typeof error);
      console.error('🚨 Error constructor:', error?.constructor?.name);
      console.error('🚨 Error message:', error?.message);
      console.error('🚨 Error code:', error?.code);
      console.error('🚨 Error stack:', error?.stack);

      // Check if Firebase is properly initialized
      if (error?.code === 'app/no-app') {
        console.error('🚨 Firebase app not initialized!');
      }

      // Check for authentication issues
      if (error?.code?.includes('permission-denied') || error?.code?.includes('unauthenticated')) {
        console.error('🚨 Firebase authentication/permission error!');
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: `Failed to add food item: ${error?.code || 'unknown-error'}`
      };
    }
  }

  /**
   * Get food items for a specific date
   */
  static async getFoodItemsByDate(userId: string, date: string): Promise<ApiResponse<FoodItem[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const foodItems: FoodItem[] = [];

      querySnapshot.forEach((doc) => {
        foodItems.push({
          id: doc.id,
          ...doc.data()
        } as FoodItem);
      });

      return {
        success: true,
        data: foodItems,
        message: `Found ${foodItems.length} food items for ${date}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get food items'
      };
    }
  }

  /**
   * Update a food item
   */
  static async updateFoodItem(
    foodItemId: string, 
    updates: Partial<AddFoodForm>
  ): Promise<ApiResponse<FoodItem>> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, foodItemId);
      
      let updateData: Partial<FoodItem> = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Recalculate nutrition if quantity or food name changed
      if (updates.quantity || updates.foodName) {
        const currentDoc = await getDoc(docRef);
        if (currentDoc.exists()) {
          const currentData = currentDoc.data() as FoodItem;
          const newQuantity = updates.quantity || currentData.quantity;
          const newFoodName = updates.foodName || currentData.foodName;
          const newUnit = updates.unit || currentData.unit;
          const nutrition = await calculateNutritionForFood(
            newFoodName,
            newQuantity,
            newUnit as any
          );
          // Clean nutrition data to remove undefined values
          const baseNutrition = nutrition || {
            calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
          };
          updateData.nutrition = this.cleanNutritionData(baseNutrition);
        }
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: 'Food item updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update food item'
      };
    }
  }

  /**
   * Delete a food item
   */
  static async deleteFoodItem(foodItemId: string): Promise<ApiResponse<null>> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, foodItemId));
      
      return {
        success: true,
        message: 'Food item deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete food item'
      };
    }
  }

  /**
   * Calculate daily nutrition summary from food items
   */
  static calculateDailyNutrition(
    foodItems: FoodItem[], 
    calorieGoal: number = 2000
  ): DailyNutritionSummary {
    if (foodItems.length === 0) {
      return {
        date: new Date().toISOString().split('T')[0],
        userId: '',
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        calorieGoal,
        caloriesRemaining: calorieGoal,
        mealBreakdown: {
          breakfast: { calories: 0, itemCount: 0 },
          lunch: { calories: 0, itemCount: 0 },
          dinner: { calories: 0, itemCount: 0 },
          morning_snack: { calories: 0, itemCount: 0 },
          evening_snack: { calories: 0, itemCount: 0 }
        },
        lastUpdated: Timestamp.now()
      };
    }

    const summary: DailyNutritionSummary = {
      date: foodItems[0].date,
      userId: foodItems[0].userId,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      calorieGoal,
      caloriesRemaining: 0,
      mealBreakdown: {
        breakfast: { calories: 0, itemCount: 0 },
        lunch: { calories: 0, itemCount: 0 },
        dinner: { calories: 0, itemCount: 0 },
        morning_snack: { calories: 0, itemCount: 0 },
        evening_snack: { calories: 0, itemCount: 0 }
      },
      lastUpdated: Timestamp.now()
    };

    // Calculate totals
    foodItems.forEach(item => {
      summary.totalCalories += item.nutrition.calories;
      summary.totalProtein += item.nutrition.protein;
      summary.totalCarbs += item.nutrition.carbs;
      summary.totalFat += item.nutrition.fat;
      summary.totalFiber += item.nutrition.fiber;

      // Update meal breakdown
      summary.mealBreakdown[item.mealType].calories += item.nutrition.calories;
      summary.mealBreakdown[item.mealType].itemCount += 1;
    });

    summary.caloriesRemaining = calorieGoal - summary.totalCalories;

    return summary;
  }

}