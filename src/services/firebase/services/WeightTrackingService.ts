import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db as firestore } from '../../../config/firebase';
import { BaseFirebaseService } from './BaseFirebaseService';
import {
  WeightEntry,
  WeightAnalysis,
  WeightStats,
  BMICategory,
  TrendDirection,
  TrendStrength,
  ApiResponse
} from '../../../types';
import { DateNavigationUtils } from '../../../utils/dateNavigationUtils';

export class WeightTrackingService extends BaseFirebaseService<WeightEntry> {
  constructor() {
    super('weightEntries');
  }

  async createWeightEntry(
    userId: string,
    weight: number,
    unit: 'kg' | 'lbs',
    date: string,
    notes?: string
  ): Promise<ApiResponse<WeightEntry>> {
    try {
      // Convert to kg if needed
      const weightInKg = unit === 'lbs' ? weight * 0.453592 : weight;

      // Validate weight range
      if (weightInKg < 30 || weightInKg > 500) {
        return {
          success: false,
          error: 'INVALID_WEIGHT_RANGE',
          message: 'Weight must be between 30-500 kg (66-1100 lbs)',
          timestamp: Timestamp.now()
        };
      }

      // Check for duplicate entry on same date
      const existingEntry = await this.getWeightForDate(userId, date);
      if (existingEntry.success && existingEntry.data) {
        return {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: 'Weight entry already exists for this date',
          timestamp: Timestamp.now(),
          data: existingEntry.data
        };
      }

      // Calculate BMI if height available from user profile
      let bmi: number | undefined;
      let bmiCategory: BMICategory | undefined;

      // For now, we'll skip height lookup and calculate later when profile integration is complete
      // TODO: Integrate with user profile service to get height

      const id = `${userId}_${date}_${Date.now()}`;
      const weightEntry: WeightEntry = {
        id,
        userId,
        weight: weightInKg,
        unit,
        bmi,
        bmiCategory,
        notes: notes?.trim() || undefined,
        date,
        createdAt: Timestamp.now()
      };

      const docRef = doc(firestore, this.collectionName, id);
      await setDoc(docRef, weightEntry);

      return {
        success: true,
        data: weightEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Weight entry creation error:', error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to save weight entry',
        timestamp: Timestamp.now()
      };
    }
  }

  async getWeightForDate(userId: string, date: string): Promise<ApiResponse<WeightEntry | null>> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        where('date', '==', date),
        limit(1)
      );

      const snapshot = await getDocs(q);
      const entry = snapshot.docs[0]?.data() as WeightEntry;

      return {
        success: true,
        data: entry || null,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  async getWeightHistory(
    userId: string,
    days: number = 90
  ): Promise<ApiResponse<WeightEntry[]>> {
    try {
      const endDate = DateNavigationUtils.getTodayString();
      const startDate = DateNavigationUtils.subtractDays(endDate, days);

      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => doc.data() as WeightEntry);

      return {
        success: true,
        data: entries,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load weight history',
        timestamp: Timestamp.now()
      };
    }
  }

  async analyzeWeightProgress(userId: string): Promise<ApiResponse<WeightAnalysis>> {
    try {
      const historyResult = await this.getWeightHistory(userId, 90);
      if (!historyResult.success || !historyResult.data || historyResult.data.length === 0) {
        return {
          success: false,
          error: 'NO_WEIGHT_DATA',
          message: 'No weight entries found for analysis',
          timestamp: Timestamp.now()
        };
      }

      const entries = historyResult.data;
      const currentEntry = entries[0]; // Most recent
      const previousEntry = entries[1]; // Second most recent

      // Calculate change from previous entry
      const changeFromPrevious = previousEntry
        ? this.calculateWeightChange(currentEntry, previousEntry)
        : {
            absolute: 0,
            percentage: 0,
            direction: 'stable' as TrendDirection,
            daysSincePrevious: 0
          };

      // Calculate averages
      const weeklyAverage = this.calculateWeeklyAverage(entries);
      const monthlyAverage = this.calculateMonthlyAverage(entries);

      // Analyze trend
      const trend = this.analyzeTrend(entries);

      // Get goal progress (placeholder - would integrate with user profile)
      const goalProgress = undefined; // TODO: Integrate with user profile goals

      const analysis: WeightAnalysis = {
        currentEntry,
        previousEntry,
        changeFromPrevious,
        weeklyAverage,
        monthlyAverage,
        trend,
        goalProgress
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
        message: 'Failed to analyze weight progress',
        timestamp: Timestamp.now()
      };
    }
  }

  async updateWeightEntry(
    id: string,
    updates: Partial<Omit<WeightEntry, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ApiResponse<WeightEntry>> {
    try {
      const docRef = doc(firestore, this.collectionName, id);
      const updatedData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatedData);

      // Fetch updated entry
      const snapshot = await getDoc(docRef);
      const updatedEntry = snapshot.data() as WeightEntry;

      return {
        success: true,
        data: updatedEntry,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update weight entry',
        timestamp: Timestamp.now()
      };
    }
  }

  async deleteWeightEntry(id: string): Promise<ApiResponse<void>> {
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
        message: 'Failed to delete weight entry',
        timestamp: Timestamp.now()
      };
    }
  }

  // BMI Calculation Methods
  calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }

  getBMICategory(bmi: number): BMICategory {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    if (bmi < 35) return 'obese_class_1';
    if (bmi < 40) return 'obese_class_2';
    return 'obese_class_3';
  }

  getBMILabel(category: BMICategory): string {
    switch (category) {
      case 'underweight': return 'Underweight';
      case 'normal': return 'Normal Weight';
      case 'overweight': return 'Overweight';
      case 'obese_class_1': return 'Obesity Class I';
      case 'obese_class_2': return 'Obesity Class II';
      case 'obese_class_3': return 'Obesity Class III';
      default: return 'Unknown';
    }
  }

  getBMIColor(category: BMICategory): string {
    switch (category) {
      case 'underweight': return '#3B82F6';
      case 'normal': return '#10B981';
      case 'overweight': return '#F59E0B';
      case 'obese_class_1':
      case 'obese_class_2':
      case 'obese_class_3': return '#EF4444';
      default: return '#6B7280';
    }
  }

  // Analysis Helper Methods
  private calculateWeightChange(current: WeightEntry, previous: WeightEntry) {
    const absolute = Math.round((current.weight - previous.weight) * 100) / 100;
    const percentage = Math.round((absolute / previous.weight) * 10000) / 100;
    const direction: TrendDirection = Math.abs(absolute) < 0.1 ? 'stable' :
                                     absolute > 0 ? 'increasing' : 'decreasing';

    const daysDiff = Math.floor(
      (new Date(current.date).getTime() - new Date(previous.date).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return {
      absolute,
      percentage,
      direction,
      daysSincePrevious: daysDiff
    };
  }

  private calculateWeeklyAverage(entries: WeightEntry[]): number | undefined {
    const sevenDaysAgo = DateNavigationUtils.subtractDays(DateNavigationUtils.getTodayString(), 7);
    const recentEntries = entries.filter(entry => entry.date >= sevenDaysAgo);

    if (recentEntries.length === 0) return undefined;

    const total = recentEntries.reduce((sum, entry) => sum + entry.weight, 0);
    return Math.round((total / recentEntries.length) * 10) / 10;
  }

  private calculateMonthlyAverage(entries: WeightEntry[]): number | undefined {
    const thirtyDaysAgo = DateNavigationUtils.subtractDays(DateNavigationUtils.getTodayString(), 30);
    const recentEntries = entries.filter(entry => entry.date >= thirtyDaysAgo);

    if (recentEntries.length === 0) return undefined;

    const total = recentEntries.reduce((sum, entry) => sum + entry.weight, 0);
    return Math.round((total / recentEntries.length) * 10) / 10;
  }

  private analyzeTrend(entries: WeightEntry[]): { direction: TrendDirection; strength: TrendStrength; confidenceLevel: number } {
    if (entries.length < 3) {
      return { direction: 'stable', strength: 'weak', confidenceLevel: 0.1 };
    }

    // Simple linear regression to determine trend
    const recentEntries = entries.slice(0, Math.min(10, entries.length));
    const weights = recentEntries.map(e => e.weight).reverse(); // Oldest first
    const n = weights.length;

    // Calculate trend slope
    const xSum = n * (n + 1) / 2;
    const ySum = weights.reduce((sum, weight) => sum + weight, 0);
    const xySum = weights.reduce((sum, weight, index) => sum + weight * (index + 1), 0);
    const x2Sum = n * (n + 1) * (2 * n + 1) / 6;

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    // Determine direction and strength
    const absSlope = Math.abs(slope);
    let direction: TrendDirection = 'stable';
    let strength: TrendStrength = 'weak';

    if (absSlope > 0.05) {
      direction = slope > 0 ? 'increasing' : 'decreasing';

      if (absSlope > 0.2) strength = 'strong';
      else if (absSlope > 0.1) strength = 'moderate';
      else strength = 'weak';
    }

    // Calculate confidence based on consistency
    const changes = recentEntries.slice(1).map((entry, index) =>
      entry.weight - recentEntries[index].weight
    );
    const positiveChanges = changes.filter(change => change > 0.1).length;
    const negativeChanges = changes.filter(change => change < -0.1).length;
    const consistency = Math.max(positiveChanges, negativeChanges) / changes.length;

    const confidenceLevel = Math.min(consistency * n / 10, 1);

    return { direction, strength, confidenceLevel };
  }

  async getWeightStats(userId: string): Promise<ApiResponse<WeightStats>> {
    try {
      const historyResult = await this.getWeightHistory(userId, 365); // Last year
      if (!historyResult.success || !historyResult.data) {
        return {
          success: false,
          error: 'NO_DATA',
          message: 'No weight data available',
          timestamp: Timestamp.now()
        };
      }

      const entries = historyResult.data;
      if (entries.length === 0) {
        return {
          success: false,
          error: 'NO_DATA',
          message: 'No weight entries found',
          timestamp: Timestamp.now()
        };
      }

      const weights = entries.map(e => e.weight);
      const lowestWeight = Math.min(...weights);
      const highestWeight = Math.max(...weights);
      const averageWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

      // Calculate average weekly change
      let totalWeeklyChanges = 0;
      let weeklyChangeCount = 0;

      for (let i = 0; i < entries.length - 1; i++) {
        const current = entries[i];
        const next = entries[i + 1];
        const daysDiff = Math.floor(
          (new Date(current.date).getTime() - new Date(next.date).getTime()) /
          (1000 * 60 * 60 * 24)
        );

        if (daysDiff > 0) {
          const weeklyChange = ((current.weight - next.weight) / daysDiff) * 7;
          totalWeeklyChanges += weeklyChange;
          weeklyChangeCount++;
        }
      }

      const averageWeeklyChange = weeklyChangeCount > 0 ? totalWeeklyChanges / weeklyChangeCount : 0;

      const stats: WeightStats = {
        totalEntries: entries.length,
        firstEntryDate: entries[entries.length - 1]?.date,
        lastEntryDate: entries[0].date,
        lowestWeight: {
          weight: lowestWeight,
          date: entries.find(e => e.weight === lowestWeight)?.date || ''
        },
        highestWeight: {
          weight: highestWeight,
          date: entries.find(e => e.weight === highestWeight)?.date || ''
        },
        averageWeight: Math.round(averageWeight * 10) / 10,
        weightRange: Math.round((highestWeight - lowestWeight) * 10) / 10,
        averageWeeklyChange: Math.round(averageWeeklyChange * 100) / 100
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
        message: 'Failed to calculate weight statistics',
        timestamp: Timestamp.now()
      };
    }
  }

  // Unit Conversion Helpers
  convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
    if (fromUnit === toUnit) return weight;

    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return weight * 0.453592;
    } else {
      return weight * 2.20462;
    }
  }

  formatWeight(weightKg: number, unit: 'kg' | 'lbs'): string {
    const weight = unit === 'kg' ? weightKg : weightKg * 2.20462;
    return `${Math.round(weight * 10) / 10} ${unit}`;
  }

  formatWeightChange(changeKg: number, unit: 'kg' | 'lbs'): string {
    const change = unit === 'kg' ? changeKg : changeKg * 2.20462;
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    return `${sign}${Math.round(absChange * 10) / 10} ${unit}`;
  }

  validateWeightRange(weight: number, unit: 'kg' | 'lbs'): { isValid: boolean; message?: string } {
    const minWeight = unit === 'kg' ? 30 : 66;
    const maxWeight = unit === 'kg' ? 500 : 1100;

    if (isNaN(weight) || weight <= 0) {
      return { isValid: false, message: 'Please enter a valid weight' };
    }

    if (weight < minWeight || weight > maxWeight) {
      return {
        isValid: false,
        message: `Weight must be between ${minWeight}-${maxWeight} ${unit}`
      };
    }

    return { isValid: true };
  }
}

export const weightTrackingService = new WeightTrackingService();