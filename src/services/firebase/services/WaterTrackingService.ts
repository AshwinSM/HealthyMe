import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db as firestore } from '../../../config/firebase';
import { BaseFirebaseService } from '../BaseFirebaseService';
import {
  WaterEntry,
  WaterAnalysis,
  WaterGoal,
  WaterStats,
  WaterUnit,
  WaterQuickAdd,
  ApiResponse
} from '../../../types/health';
import { DateNavigationUtils } from '../../../utils/dateNavigationUtils';

export class WaterTrackingService extends BaseFirebaseService<WaterEntry> {
  constructor() {
    super('waterEntries');
  }

  // Unit conversion constants (all to ml)
  private readonly unitConversions = {
    ml: 1,
    fl_oz: 29.5735, // 1 fl oz = 29.5735 ml
    cups: 236.588   // 1 cup = 236.588 ml
  };

  // Default quick-add amounts by unit
  private readonly defaultQuickAdds: Record<WaterUnit, WaterQuickAdd[]> = {
    ml: [
      { amount: 250, label: '250ml', icon: '🥛' },
      { amount: 500, label: '500ml', icon: '🍶' },
      { amount: 750, label: '750ml', icon: '🍼' },
      { amount: 1000, label: '1L', icon: '💧' }
    ],
    fl_oz: [
      { amount: 8, label: '8 fl oz', icon: '🥛' },
      { amount: 16, label: '16 fl oz', icon: '🍶' },
      { amount: 24, label: '24 fl oz', icon: '🍼' },
      { amount: 32, label: '32 fl oz', icon: '💧' }
    ],
    cups: [
      { amount: 1, label: '1 cup', icon: '☕' },
      { amount: 2, label: '2 cups', icon: '🥛' },
      { amount: 3, label: '3 cups', icon: '🍶' },
      { amount: 4, label: '4 cups', icon: '💧' }
    ]
  };

  /**
   * Convert water amount between units
   */
  convertWaterAmount(amount: number, fromUnit: WaterUnit, toUnit: WaterUnit): number {
    if (fromUnit === toUnit) return amount;

    // Convert to ml first, then to target unit
    const amountInMl = amount * this.unitConversions[fromUnit];
    return amountInMl / this.unitConversions[toUnit];
  }

  /**
   * Format water amount for display
   */
  formatWaterAmount(amountMl: number, unit: WaterUnit): string {
    const convertedAmount = this.convertWaterAmount(amountMl, 'ml', unit);
    const roundedAmount = Math.round(convertedAmount * 10) / 10;

    switch (unit) {
      case 'ml':
        return `${roundedAmount} ml`;
      case 'fl_oz':
        return `${roundedAmount} fl oz`;
      case 'cups':
        return `${roundedAmount} cup${roundedAmount !== 1 ? 's' : ''}`;
      default:
        return `${roundedAmount} ${unit}`;
    }
  }

  /**
   * Validate water amount range
   */
  validateWaterAmount(amount: number, unit: WaterUnit): { isValid: boolean; message?: string } {
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, message: 'Please enter a valid amount' };
    }

    // Convert to ml for validation
    const amountInMl = this.convertWaterAmount(amount, unit, 'ml');

    // Reasonable limits: 10ml to 3000ml (3L) per entry
    if (amountInMl < 10) {
      return {
        isValid: false,
        message: 'Amount too small. Minimum 10ml per entry.'
      };
    }

    if (amountInMl > 3000) {
      return {
        isValid: false,
        message: 'Amount too large. Maximum 3L per entry.'
      };
    }

    return { isValid: true };
  }

  /**
   * Get default goal based on user profile or standard recommendation
   */
  getDefaultWaterGoal(unit: WaterUnit = 'ml'): number {
    // Standard recommendation: 2000ml (2L) per day
    const defaultMl = 2000;
    return this.convertWaterAmount(defaultMl, 'ml', unit);
  }

  /**
   * Get quick-add options for a unit
   */
  getQuickAddOptions(unit: WaterUnit): WaterQuickAdd[] {
    return this.defaultQuickAdds[unit] || this.defaultQuickAdds.ml;
  }

  /**
   * Create a water entry
   */
  async createWaterEntry(
    userId: string,
    amount: number,
    unit: WaterUnit,
    date: string,
    source?: 'water' | 'coffee' | 'tea' | 'juice' | 'other',
    notes?: string
  ): Promise<ApiResponse<WaterEntry>> {
    try {
      // Validate amount
      const validation = this.validateWaterAmount(amount, unit);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'INVALID_AMOUNT',
          message: validation.message || 'Invalid water amount',
          timestamp: Timestamp.now()
        };
      }

      // Validate date
      if (!DateNavigationUtils.isValidDateString(date)) {
        return {
          success: false,
          error: 'INVALID_DATE',
          message: 'Please select a valid date',
          timestamp: Timestamp.now()
        };
      }

      if (DateNavigationUtils.isFutureDate(date)) {
        return {
          success: false,
          error: 'FUTURE_DATE',
          message: 'Cannot log water for future dates',
          timestamp: Timestamp.now()
        };
      }

      // Convert amount to ml for storage
      const amountInMl = this.convertWaterAmount(amount, unit, 'ml');

      const id = `${userId}_${date}_${Date.now()}`;
      const waterEntry: WaterEntry = {
        id,
        userId,
        date,
        amount: amountInMl,
        unit,
        timestamp: Timestamp.now(),
        source: source || 'water',
        notes: notes?.trim() || undefined,
        createdAt: Timestamp.now()
      };

      const docRef = doc(firestore, this.collectionName, id);
      await setDoc(docRef, waterEntry);

      return {
        success: true,
        data: waterEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Water entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to save water entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get water entries for a specific date
   */
  async getWaterEntriesForDate(userId: string, date: string): Promise<ApiResponse<WaterEntry[]>> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => doc.data() as WaterEntry);

      return {
        success: true,
        data: entries,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load water entries',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get water history for a date range
   */
  async getWaterHistory(
    userId: string,
    days: number = 30
  ): Promise<ApiResponse<WaterEntry[]>> {
    try {
      const endDate = DateNavigationUtils.getTodayString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateString = DateNavigationUtils.formatDateString(startDate);

      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        where('date', '>=', startDateString),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => doc.data() as WaterEntry);

      return {
        success: true,
        data: entries,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load water history',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Analyze water intake for a specific date
   */
  async analyzeWaterIntake(
    userId: string,
    date: string,
    goalMl: number = 2000
  ): Promise<ApiResponse<WaterAnalysis>> {
    try {
      const entriesResult = await this.getWaterEntriesForDate(userId, date);
      if (!entriesResult.success || !entriesResult.data) {
        return {
          success: false,
          error: 'NO_WATER_DATA',
          message: 'No water entries found for analysis',
          timestamp: Timestamp.now()
        };
      }

      const entries = entriesResult.data;
      const totalConsumed = entries.reduce((sum, entry) => sum + entry.amount, 0);
      const percentageAchieved = Math.round((totalConsumed / goalMl) * 100);
      const remaining = goalMl - totalConsumed;

      // Calculate hourly distribution
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({ hour, amount: 0 }));
      entries.forEach(entry => {
        const hour = entry.timestamp.toDate().getHours();
        hourlyDistribution[hour].amount += entry.amount;
      });

      // Calculate streak (would need historical data for full implementation)
      const streak = await this.calculateWaterStreak(userId, date, goalMl);

      const analysis: WaterAnalysis = {
        date,
        totalConsumed,
        goal: goalMl,
        percentageAchieved,
        remaining,
        entries,
        entriesCount: entries.length,
        avgEntrySize: entries.length > 0 ? Math.round(totalConsumed / entries.length) : 0,
        goalAchieved: totalConsumed >= goalMl,
        hourlyDistribution,
        streak
      };

      return {
        success: true,
        data: analysis,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to analyze water intake',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Calculate water intake streak
   */
  private async calculateWaterStreak(
    userId: string,
    currentDate: string,
    goalMl: number
  ): Promise<{ current: number; longest: number }> {
    try {
      // Get last 30 days of data to calculate streak
      const historyResult = await this.getWaterHistory(userId, 30);
      if (!historyResult.success || !historyResult.data) {
        return { current: 0, longest: 0 };
      }

      // Group entries by date and calculate daily totals
      const dailyTotals = new Map<string, number>();
      historyResult.data.forEach(entry => {
        const current = dailyTotals.get(entry.date) || 0;
        dailyTotals.set(entry.date, current + entry.amount);
      });

      // Calculate current streak (consecutive days from current date backwards)
      let currentStreak = 0;
      let checkDate = new Date(currentDate);

      while (currentStreak < 30) { // Limit to prevent infinite loop
        const dateString = DateNavigationUtils.formatDateString(checkDate);
        const dailyTotal = dailyTotals.get(dateString) || 0;

        if (dailyTotal >= goalMl) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate longest streak (simplified - would need full historical data)
      let longestStreak = currentStreak;

      return { current: currentStreak, longest: longestStreak };
    } catch (error) {
      console.error('Error calculating water streak:', error);
      return { current: 0, longest: 0 };
    }
  }

  /**
   * Update water entry
   */
  async updateWaterEntry(
    id: string,
    updates: Partial<Omit<WaterEntry, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ApiResponse<WaterEntry>> {
    try {
      const docRef = doc(firestore, this.collectionName, id);

      // If amount and unit are being updated, convert to ml
      if (updates.amount && updates.unit) {
        updates.amount = this.convertWaterAmount(updates.amount, updates.unit, 'ml');
      }

      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatedData);

      // Fetch updated entry
      const snapshot = await getDoc(docRef);
      const updatedEntry = snapshot.data() as WaterEntry;

      return {
        success: true,
        data: updatedEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update water entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Delete water entry
   */
  async deleteWaterEntry(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, this.collectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete water entry',
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get water statistics for a user
   */
  async getWaterStats(userId: string): Promise<ApiResponse<WaterStats>> {
    try {
      const historyResult = await this.getWaterHistory(userId, 365); // Last year
      if (!historyResult.success || !historyResult.data) {
        return {
          success: false,
          error: 'NO_DATA',
          message: 'No water data available',
          timestamp: Timestamp.now()
        };
      }

      const entries = historyResult.data;
      if (entries.length === 0) {
        return {
          success: false,
          error: 'NO_DATA',
          message: 'No water entries found',
          timestamp: Timestamp.now()
        };
      }

      // Group by date for daily analysis
      const dailyTotals = new Map<string, number>();
      const hourCounts = new Array(24).fill(0);

      entries.forEach(entry => {
        // Daily totals
        const current = dailyTotals.get(entry.date) || 0;
        dailyTotals.set(entry.date, current + entry.amount);

        // Hour distribution
        const hour = entry.timestamp.toDate().getHours();
        hourCounts[hour]++;
      });

      const dailyAmounts = Array.from(dailyTotals.values());
      const totalVolume = entries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalDays = dailyTotals.size;
      const averageDaily = totalDays > 0 ? totalVolume / totalDays : 0;

      // Find favorite hour (most common logging time)
      const favoriteHour = hourCounts.indexOf(Math.max(...hourCounts));

      // Find best day
      const bestAmount = Math.max(...dailyAmounts);
      const bestDate = Array.from(dailyTotals.entries())
        .find(([_, amount]) => amount === bestAmount)?.[0] || '';

      // Calculate goal achievement rate (assuming 2L goal)
      const goalMl = 2000;
      const daysMetGoal = dailyAmounts.filter(amount => amount >= goalMl).length;
      const goalAchievementRate = totalDays > 0 ? (daysMetGoal / totalDays) * 100 : 0;

      // Calculate current streak
      const streakResult = await this.calculateWaterStreak(userId, DateNavigationUtils.getTodayString(), goalMl);

      const stats: WaterStats = {
        totalDays,
        totalVolume: Math.round(totalVolume),
        averageDaily: Math.round(averageDaily),
        goalAchievementRate: Math.round(goalAchievementRate * 10) / 10,
        currentStreak: streakResult.current,
        longestStreak: streakResult.longest,
        favoriteHour,
        averageEntriesPerDay: totalDays > 0 ? Math.round((entries.length / totalDays) * 10) / 10 : 0,
        bestDay: {
          date: bestDate,
          amount: Math.round(bestAmount)
        }
      };

      return {
        success: true,
        data: stats,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to calculate water statistics',
        timestamp: Timestamp.now()
      };
    }
  }
}

// Export singleton instance
export const waterTrackingService = new WaterTrackingService();