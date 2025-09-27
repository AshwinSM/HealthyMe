import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

// Interfaces for date navigation system
export interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isSelectable: boolean;
}

export interface CachedDayData {
  date: string;
  hasNutritionData: boolean;
  hasHealthData: boolean;
  nutritionSummary?: any;
  healthMetrics?: any;
  cacheTimestamp: Timestamp;
  isStale: boolean;
}

export interface DateNavigationState {
  selectedDate: string;          // YYYY-MM-DD format
  calendarDate: string;         // Current calendar view month (YYYY-MM format)
  isCalendarVisible: boolean;
  isLoading: boolean;
  availableDates: string[];     // Dates with logged data
  cachedData: Record<string, CachedDayData>;
  preloadQueue: string[];       // Dates to preload in background
  lastUpdated: Timestamp;
}

/**
 * Utility class for date navigation and management
 */
export class DateNavigationUtils {
  private static readonly STORAGE_KEY = 'selectedDate';
  private static readonly MAX_HISTORICAL_DAYS = 365; // 1 year
  private static readonly CACHE_EXPIRY_HOURS = 6;

  /**
   * Validates if a date is within allowed range (not future, not too old)
   */
  static validateDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const maxHistorical = new Date();
      maxHistorical.setDate(today.getDate() - this.MAX_HISTORICAL_DAYS);

      // Reset time components for accurate comparison
      today.setHours(23, 59, 59, 999);
      date.setHours(0, 0, 0, 0);
      maxHistorical.setHours(0, 0, 0, 0);

      return (
        !isNaN(date.getTime()) &&
        date <= today &&
        date >= maxHistorical
      );
    } catch {
      return false;
    }
  }

  /**
   * Formats a date string for display with smart relative formatting
   */
  static formatDisplayDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (this.isSameDay(date, today)) return 'Today';
      if (this.isSameDay(date, yesterday)) return 'Yesterday';

      // For dates within the current week, show day name
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      }

      // For other dates, show full format
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Gets adjacent dates around a center date for preloading
   */
  static getAdjacentDates(centerDate: string, range: number = 3): string[] {
    try {
      const dates: string[] = [];
      const center = new Date(centerDate);

      for (let i = -range; i <= range; i++) {
        const date = new Date(center);
        date.setDate(center.getDate() + i);

        const dateString = this.formatDateString(date);
        if (this.validateDate(dateString)) {
          dates.push(dateString);
        }
      }

      return dates;
    } catch {
      return [];
    }
  }

  /**
   * Formats a Date object to YYYY-MM-DD string
   */
  static formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Checks if two dates are the same day
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  /**
   * Generates calendar days for a given month
   */
  static getMonthDates(year: number, month: number): CalendarDay[] {
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startCalendar = new Date(firstDay);
      const endCalendar = new Date(lastDay);

      // Start from Sunday of the first week
      startCalendar.setDate(startCalendar.getDate() - startCalendar.getDay());

      // End on Saturday of the last week
      endCalendar.setDate(endCalendar.getDate() + (6 - endCalendar.getDay()));

      const calendarDays: CalendarDay[] = [];
      const currentDate = new Date(startCalendar);

      while (currentDate <= endCalendar) {
        const dateString = this.formatDateString(currentDate);
        calendarDays.push({
          date: dateString,
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: this.isSameDay(currentDate, new Date()),
          isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
          isSelectable: this.validateDate(dateString)
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return calendarDays;
    } catch {
      return [];
    }
  }

  /**
   * Gets the previous valid date
   */
  static getPreviousDate(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() - 1);
      const prevDate = this.formatDateString(date);
      return this.validateDate(prevDate) ? prevDate : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets the next valid date
   */
  static getNextDate(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1);
      const nextDate = this.formatDateString(date);
      return this.validateDate(nextDate) ? nextDate : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets today's date string
   */
  static getTodayString(): string {
    return this.formatDateString(new Date());
  }

  /**
   * Persists the selected date to storage
   */
  static async persistSelectedDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, date);
    } catch (error) {
      console.warn('Failed to persist selected date:', error);
    }
  }

  /**
   * Retrieves the persisted selected date from storage
   */
  static async getPersistedSelectedDate(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored && this.validateDate(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to retrieve persisted date:', error);
    }

    // Default to today if no valid stored date
    return this.getTodayString();
  }

  /**
   * Checks if cached data is still fresh
   */
  static isCacheDataFresh(cacheTimestamp: Timestamp): boolean {
    const now = Date.now();
    const cacheTime = cacheTimestamp.toMillis();
    const ageHours = (now - cacheTime) / (60 * 60 * 1000);
    return ageHours < this.CACHE_EXPIRY_HOURS;
  }

  /**
   * Gets formatted month/year string for calendar navigation
   */
  static getMonthYearString(year: number, month: number): string {
    return new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Parses calendar date string (YYYY-MM) to year and month
   */
  static parseCalendarDate(calendarDate: string): { year: number; month: number } {
    const [year, month] = calendarDate.split('-').map(Number);
    return { year, month: month - 1 }; // month is 0-indexed in Date
  }

  /**
   * Formats year and month to calendar date string (YYYY-MM)
   */
  static formatCalendarDate(year: number, month: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}`; // month is 0-indexed
  }

  /**
   * Gets the calendar date for a given date string
   */
  static getCalendarDateForDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return this.formatCalendarDate(date.getFullYear(), date.getMonth());
    } catch {
      return this.formatCalendarDate(new Date().getFullYear(), new Date().getMonth());
    }
  }

  /**
   * Gets an array of recent dates for quick selection
   */
  static getRecentDates(count: number = 7): Array<{ date: string; label: string; isToday: boolean }> {
    const dates: Array<{ date: string; label: string; isToday: boolean }> = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = this.formatDateString(date);

      if (this.validateDate(dateString)) {
        dates.push({
          date: dateString,
          label: this.formatDisplayDate(dateString),
          isToday: i === 0
        });
      }
    }

    return dates;
  }

  /**
   * Checks if a date has passed (is in the past)
   */
  static isDateInPast(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const today = new Date();
      date.setHours(23, 59, 59, 999);
      today.setHours(0, 0, 0, 0);
      return date < today;
    } catch {
      return false;
    }
  }

  /**
   * Gets the number of days between two dates
   */
  static getDaysBetween(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }
}