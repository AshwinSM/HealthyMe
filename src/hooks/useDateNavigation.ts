import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Timestamp } from 'firebase/firestore'
import { DateNavigationUtils, CalendarDay } from '../utils/dateNavigationUtils'
import { useNutritionStore } from '../stores/nutritionStore'
import { useHealthMetricsStore } from '../stores/healthMetricsStore'
import { useAuthStore } from '../stores/authStore'

interface CachedDayData {
  date: string
  hasNutritionData: boolean
  hasHealthData: boolean
  nutritionSummary?: any
  healthMetrics?: any
  cacheTimestamp: Timestamp
  isStale: boolean
}

interface DateNavigationState {
  selectedDate: string
  calendarDate: string
  isCalendarVisible: boolean
  isLoading: boolean
  availableDates: string[]
  cachedData: Record<string, CachedDayData>
  preloadQueue: string[]
  lastUpdated: Timestamp
}

const SELECTED_DATE_KEY = 'selectedDate'
const CACHE_EXPIRY_HOURS = 2

export const useDateNavigation = () => {
  const nutritionStore = useNutritionStore()
  const healthMetricsStore = useHealthMetricsStore()
  const { user } = useAuthStore()

  const [state, setState] = useState<DateNavigationState>({
    selectedDate: DateNavigationUtils.getTodayString(),
    calendarDate: new Date().toISOString().slice(0, 7), // YYYY-MM
    isCalendarVisible: false,
    isLoading: false,
    availableDates: [],
    cachedData: {},
    preloadQueue: [],
    lastUpdated: Timestamp.now()
  })

  // Load persisted selected date on mount
  useEffect(() => {
    loadPersistedDate()
  }, [])

  // Load available dates on mount
  useEffect(() => {
    if (user) {
      loadAvailableDates()
    }
  }, [user])

  // Preload adjacent dates when selected date changes
  useEffect(() => {
    if (state.selectedDate && user) {
      preloadAdjacentDates(state.selectedDate, 7)
    }
  }, [state.selectedDate, user])

  // Background cache cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      clearOldCache(30) // Keep 30 days of cache
    }, 60000) // Clean up every minute

    return () => clearInterval(cleanup)
  }, [])

  const loadPersistedDate = async () => {
    try {
      const persistedDate = await AsyncStorage.getItem(SELECTED_DATE_KEY)
      if (persistedDate && DateNavigationUtils.isValidDateString(persistedDate)) {
        setState(prev => ({
          ...prev,
          selectedDate: persistedDate,
          calendarDate: persistedDate.slice(0, 7)
        }))
      }
    } catch (error) {
      console.warn('Failed to load persisted date:', error)
    }
  }

  const loadAvailableDates = async () => {
    if (!user) return

    try {
      // Get dates with any health data from last 90 days
      const endDate = DateNavigationUtils.getTodayString()
      const startDate = DateNavigationUtils.subtractDays(endDate, 90)

      const [nutritionDates, healthDates] = await Promise.all([
        nutritionStore.getAvailableDates(user.id, startDate, endDate),
        healthMetricsStore.getAvailableDates(user.id, startDate, endDate)
      ])

      const allDates = Array.from(new Set([
        ...nutritionDates,
        ...healthDates
      ])).sort()

      setState(prev => ({ ...prev, availableDates: allDates }))
    } catch (error) {
      console.error('Failed to load available dates:', error)
    }
  }

  const selectDate = useCallback(async (date: string) => {
    if (!DateNavigationUtils.validateDate(date) || state.isLoading) {
      return
    }

    setState(prev => ({ ...prev, isLoading: true, selectedDate: date }))

    try {
      // Check if data is already cached and fresh
      const cached = state.cachedData[date]
      const isCacheFresh = cached && !cached.isStale &&
        (Timestamp.now().toMillis() - cached.cacheTimestamp.toMillis()) < (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)

      if (!isCacheFresh) {
        // Load data for selected date
        await Promise.all([
          nutritionStore.loadFoodEntriesForDate(date),
          healthMetricsStore.loadHealthDataForDate(date)
        ])

        // Update cache
        const cachedData = {
          ...state.cachedData,
          [date]: {
            date,
            hasNutritionData: nutritionStore.hasDataForDate(date),
            hasHealthData: healthMetricsStore.hasDataForDate(date),
            nutritionSummary: nutritionStore.getDailySummary(date),
            healthMetrics: healthMetricsStore.getDailyMetrics(date),
            cacheTimestamp: Timestamp.now(),
            isStale: false
          }
        }

        setState(prev => ({
          ...prev,
          selectedDate: date,
          cachedData,
          isLoading: false,
          lastUpdated: Timestamp.now()
        }))
      } else {
        setState(prev => ({
          ...prev,
          selectedDate: date,
          isLoading: false,
          lastUpdated: Timestamp.now()
        }))
      }

      // Store selected date in persistent storage
      await AsyncStorage.setItem(SELECTED_DATE_KEY, date)

    } catch (error) {
      console.error('Failed to load date data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.isLoading, state.cachedData, nutritionStore, healthMetricsStore])

  const navigateToToday = useCallback(async () => {
    const today = DateNavigationUtils.getTodayString()
    await selectDate(today)

    // Update calendar view to current month
    setState(prev => ({
      ...prev,
      calendarDate: new Date().toISOString().slice(0, 7)
    }))
  }, [selectDate])

  const navigateToNextDay = useCallback(async () => {
    const nextDate = DateNavigationUtils.addDays(state.selectedDate, 1)

    if (DateNavigationUtils.validateDate(nextDate)) {
      await selectDate(nextDate)
    }
  }, [state.selectedDate, selectDate])

  const navigateToPreviousDay = useCallback(async () => {
    const prevDate = DateNavigationUtils.subtractDays(state.selectedDate, 1)

    if (DateNavigationUtils.validateDate(prevDate)) {
      await selectDate(prevDate)
    }
  }, [state.selectedDate, selectDate])

  const openCalendar = useCallback(() => {
    // Set calendar to show the month of selected date
    const selectedMonth = state.selectedDate.slice(0, 7)
    setState(prev => ({
      ...prev,
      isCalendarVisible: true,
      calendarDate: selectedMonth
    }))
  }, [state.selectedDate])

  const closeCalendar = useCallback(() => {
    setState(prev => ({ ...prev, isCalendarVisible: false }))
  }, [])

  const navigateCalendar = useCallback((direction: 'prev' | 'next') => {
    const [year, month] = state.calendarDate.split('-').map(Number)
    const newDate = new Date(year, month - 1) // month is 0-indexed

    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    const newCalendarDate = newDate.toISOString().slice(0, 7)
    setState(prev => ({ ...prev, calendarDate: newCalendarDate }))
  }, [state.calendarDate])

  const preloadAdjacentDates = useCallback(async (centerDate: string, range: number = 3) => {
    if (!user) return

    const adjacentDates = DateNavigationUtils.getAdjacentDates(centerDate, range)
    const datesToLoad = adjacentDates.filter(date => {
      const cached = state.cachedData[date]
      return !cached || cached.isStale ||
        (Timestamp.now().toMillis() - cached.cacheTimestamp.toMillis()) > (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
    })

    if (datesToLoad.length === 0) return

    // Add to preload queue
    setState(prev => ({
      ...prev,
      preloadQueue: [...prev.preloadQueue, ...datesToLoad]
    }))

    // Process preload queue in background
    setTimeout(() => processPreloadQueue(), 100)
  }, [state.cachedData, user])

  const processPreloadQueue = useCallback(async () => {
    if (state.preloadQueue.length === 0 || state.isLoading) return

    const dateToLoad = state.preloadQueue[0]
    const remainingQueue = state.preloadQueue.slice(1)

    try {
      await Promise.all([
        nutritionStore.loadFoodEntriesForDate(dateToLoad),
        healthMetricsStore.loadHealthDataForDate(dateToLoad)
      ])

      // Update cache
      const cachedData = {
        ...state.cachedData,
        [dateToLoad]: {
          date: dateToLoad,
          hasNutritionData: nutritionStore.hasDataForDate(dateToLoad),
          hasHealthData: healthMetricsStore.hasDataForDate(dateToLoad),
          nutritionSummary: nutritionStore.getDailySummary(dateToLoad),
          healthMetrics: healthMetricsStore.getDailyMetrics(dateToLoad),
          cacheTimestamp: Timestamp.now(),
          isStale: false
        }
      }

      setState(prev => ({
        ...prev,
        cachedData,
        preloadQueue: remainingQueue
      }))

      // Continue processing queue
      if (remainingQueue.length > 0) {
        setTimeout(processPreloadQueue, 50) // Small delay between preloads
      }
    } catch (error) {
      console.warn('Preload failed for date:', dateToLoad, error)
      setState(prev => ({ ...prev, preloadQueue: remainingQueue }))
    }
  }, [state.preloadQueue, state.isLoading, state.cachedData, nutritionStore, healthMetricsStore])

  const clearOldCache = useCallback((daysToKeep: number) => {
    const cutoffDate = DateNavigationUtils.subtractDays(DateNavigationUtils.getTodayString(), daysToKeep)

    const filteredCache: Record<string, CachedDayData> = {}

    Object.entries(state.cachedData).forEach(([date, data]) => {
      if (date >= cutoffDate) {
        filteredCache[date] = data
      }
    })

    setState(prev => ({ ...prev, cachedData: filteredCache }))
  }, [state.cachedData])

  const getCalendarDays = useCallback((): CalendarDay[] => {
    const [year, month] = state.calendarDate.split('-').map(Number)
    return DateNavigationUtils.getMonthDates(year, month - 1) // month is 0-indexed
  }, [state.calendarDate])

  const hasDataForDate = useCallback((date: string): boolean => {
    return state.availableDates.includes(date)
  }, [state.availableDates])

  const isDateCached = useCallback((date: string): boolean => {
    const cached = state.cachedData[date]
    return cached && !cached.isStale
  }, [state.cachedData])

  const canNavigateNext = useCallback(() => {
    const nextDate = DateNavigationUtils.addDays(state.selectedDate, 1)
    return DateNavigationUtils.validateDate(nextDate)
  }, [state.selectedDate])

  const canNavigatePrevious = useCallback(() => {
    const prevDate = DateNavigationUtils.subtractDays(state.selectedDate, 1)
    return DateNavigationUtils.validateDate(prevDate)
  }, [state.selectedDate])

  return {
    // State
    selectedDate: state.selectedDate,
    calendarDate: state.calendarDate,
    isCalendarVisible: state.isCalendarVisible,
    isLoading: state.isLoading,
    availableDates: state.availableDates,

    // Actions
    selectDate,
    navigateToToday,
    navigateToNextDay,
    navigateToPreviousDay,
    openCalendar,
    closeCalendar,
    navigateCalendar,

    // Utilities
    getCalendarDays,
    hasDataForDate,
    isDateCached,
    canNavigateNext,
    canNavigatePrevious,
    formatDisplayDate: DateNavigationUtils.formatDisplayDate,
    getQuickSelectDates: DateNavigationUtils.getQuickSelectDates,

    // Performance info
    cacheSize: Object.keys(state.cachedData).length,
    preloadQueueSize: state.preloadQueue.length
  }
}