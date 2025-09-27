import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';
import { BaseFirebaseService, QueryFilter } from '../base/BaseFirebaseService';
import { WaterEntry, ApiResponse } from '../../../types';

// Firestore converter for WaterEntry
const waterEntryConverter: FirestoreDataConverter<WaterEntry> = {
  toFirestore: (waterEntry: WaterEntry) => {
    return {
      id: waterEntry.id,
      userId: waterEntry.userId,
      amount: waterEntry.amount,
      date: waterEntry.date,
      timestamp: waterEntry.timestamp,
      method: waterEntry.method
    };
  },
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: data.id,
      userId: data.userId,
      amount: data.amount,
      date: data.date,
      timestamp: data.timestamp,
      method: data.method
    } as WaterEntry;
  }
};

/**
 * Service for managing water intake entries in Firestore
 */
export class WaterEntryService extends BaseFirebaseService<WaterEntry> {
  constructor() {
    super('waterEntries', waterEntryConverter);
  }

  /**
   * Get water entries for a specific date
   */
  async getWaterEntriesForDate(userId: string, date: string): Promise<ApiResponse<WaterEntry[]>> {
    const filters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'date', operator: '==', value: date }
    ];

    return this.query(filters, 'timestamp', 'asc');
  }

  /**
   * Calculate total water intake for a date
   */
  async calculateDailyWaterIntake(userId: string, date: string): Promise<ApiResponse<{
    totalIntake: number;
    entriesCount: number;
  }>> {
    try {
      const entriesResponse = await this.getWaterEntriesForDate(userId, date);
      
      if (!entriesResponse.success) {
        return entriesResponse as any;
      }

      const entries = entriesResponse.data || [];
      const totalIntake = entries.reduce((sum, entry) => sum + entry.amount, 0);

      return {
        success: true,
        data: {
          totalIntake,
          entriesCount: entries.length
        },
        message: 'Daily water intake calculated',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to calculate daily water intake',
        timestamp: Timestamp.now()
      };
    }
  }

  protected validateData(data: WaterEntry): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) errors.push('User ID is required');
    if (!data.amount || data.amount <= 0) errors.push('Amount must be greater than 0');
    if (!data.date) errors.push('Date is required');
    if (!data.method || !['quick_add', 'custom_entry'].includes(data.method)) {
      errors.push('Valid method is required');
    }

    return { isValid: errors.length === 0, errors };
  }
}

export const waterEntryService = new WaterEntryService();