import { renderHook, act, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDateNavigation } from '../../src/hooks/useDateNavigation'
import { useNutritionStore } from '../../src/stores/nutritionStore'
import { useHealthMetricsStore } from '../../src/stores/healthMetricsStore'
import { useAuthStore } from '../../src/stores/authStore'

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('../../src/stores/nutritionStore')
jest.mock('../../src/stores/healthMetricsStore')
jest.mock('../../src/stores/authStore')

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockUseNutritionStore = useNutritionStore as jest.MockedFunction<typeof useNutritionStore>
const mockUseHealthMetricsStore = useHealthMetricsStore as jest.MockedFunction<typeof useHealthMetricsStore>
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('useDateNavigation', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User'
  }

  const mockNutritionStore = {
    getAvailableDates: jest.fn(),
    loadFoodEntriesForDate: jest.fn(),
    hasDataForDate: jest.fn(),
    getDailySummary: jest.fn()
  }

  const mockHealthStore = {
    getAvailableDates: jest.fn(),
    loadHealthDataForDate: jest.fn(),
    hasDataForDate: jest.fn(),
    getDailyMetrics: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-06-15T12:00:00Z'))

    // Mock store implementations
    mockUseAuthStore.mockReturnValue({ user: mockUser } as any)
    mockUseNutritionStore.mockReturnValue(mockNutritionStore as any)
    mockUseHealthMetricsStore.mockReturnValue(mockHealthStore as any)

    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null)
    mockAsyncStorage.setItem.mockResolvedValue()

    // Mock store methods
    mockNutritionStore.getAvailableDates.mockResolvedValue(['2023-06-14', '2023-06-15'])
    mockHealthStore.getAvailableDates.mockResolvedValue(['2023-06-13', '2023-06-15'])
    mockNutritionStore.loadFoodEntriesForDate.mockResolvedValue()
    mockHealthStore.loadHealthDataForDate.mockResolvedValue()
    mockNutritionStore.hasDataForDate.mockReturnValue(false)
    mockHealthStore.hasDataForDate.mockReturnValue(false)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with today\'s date', () => {
      const { result } = renderHook(() => useDateNavigation())

      expect(result.current.selectedDate).toBe('2023-06-15')
      expect(result.current.calendarDate).toBe('2023-06')
      expect(result.current.isCalendarVisible).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should load persisted date from AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('2023-06-10')

      const { result } = renderHook(() => useDateNavigation())

      await waitFor(() => {
        expect(result.current.selectedDate).toBe('2023-06-10')
      })

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('selectedDate')
    })

    it('should load available dates when user is present', async () => {
      const { result } = renderHook(() => useDateNavigation())

      await waitFor(() => {
        expect(mockNutritionStore.getAvailableDates).toHaveBeenCalledWith(
          'user123',
          expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          '2023-06-15'
        )
        expect(mockHealthStore.getAvailableDates).toHaveBeenCalledWith(
          'user123',
          expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          '2023-06-15'
        )
      })

      await waitFor(() => {
        expect(result.current.availableDates).toEqual(['2023-06-13', '2023-06-14', '2023-06-15'])
      })
    })
  })

  describe('date selection', () => {
    it('should select a valid date and load data', async () => {
      const { result } = renderHook(() => useDateNavigation())

      await act(async () => {
        await result.current.selectDate('2023-06-14')
      })

      expect(result.current.selectedDate).toBe('2023-06-14')
      expect(mockNutritionStore.loadFoodEntriesForDate).toHaveBeenCalledWith('2023-06-14')
      expect(mockHealthStore.loadHealthDataForDate).toHaveBeenCalledWith('2023-06-14')
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('selectedDate', '2023-06-14')
    })

    it('should not select invalid dates', async () => {
      const { result } = renderHook(() => useDateNavigation())
      const originalDate = result.current.selectedDate

      await act(async () => {
        await result.current.selectDate('2024-06-15') // Future date
      })

      expect(result.current.selectedDate).toBe(originalDate)
      expect(mockNutritionStore.loadFoodEntriesForDate).not.toHaveBeenCalledWith('2024-06-15')
    })

    it('should show loading state during date selection', async () => {
      const { result } = renderHook(() => useDateNavigation())

      let loadingPromiseResolve: () => void
      const loadingPromise = new Promise<void>((resolve) => {
        loadingPromiseResolve = resolve
      })

      mockNutritionStore.loadFoodEntriesForDate.mockImplementation(() => loadingPromise)

      const selectPromise = act(async () => {
        await result.current.selectDate('2023-06-14')
      })

      // Should show loading immediately
      expect(result.current.isLoading).toBe(true)

      // Resolve the loading
      loadingPromiseResolve!()
      await selectPromise

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('navigation methods', () => {
    it('should navigate to today', async () => {
      const { result } = renderHook(() => useDateNavigation())

      // First select a different date
      await act(async () => {
        await result.current.selectDate('2023-06-10')
      })

      // Then navigate to today
      await act(async () => {
        await result.current.navigateToToday()
      })

      expect(result.current.selectedDate).toBe('2023-06-15')
      expect(result.current.calendarDate).toBe('2023-06')
    })

    it('should navigate to next day', async () => {
      const { result } = renderHook(() => useDateNavigation())

      // Start with a date that has a valid next day
      await act(async () => {
        await result.current.selectDate('2023-06-14')
      })

      await act(async () => {
        await result.current.navigateToNextDay()
      })

      expect(result.current.selectedDate).toBe('2023-06-15')
    })

    it('should navigate to previous day', async () => {
      const { result } = renderHook(() => useDateNavigation())

      await act(async () => {
        await result.current.navigateToPreviousDay()
      })

      expect(result.current.selectedDate).toBe('2023-06-14')
    })

    it('should not navigate to invalid next day', async () => {
      const { result } = renderHook(() => useDateNavigation())
      const originalDate = result.current.selectedDate

      // Try to navigate to future (invalid)
      await act(async () => {
        await result.current.navigateToNextDay()
      })

      expect(result.current.selectedDate).toBe(originalDate)
    })

    it('should not navigate to invalid previous day', async () => {
      const { result } = renderHook(() => useDateNavigation())

      // Set date to boundary where previous would be invalid
      jest.setSystemTime(new Date('2022-06-16T12:00:00Z')) // Exactly one year from validation boundary

      await act(async () => {
        await result.current.selectDate('2022-06-16')
      })

      const originalDate = result.current.selectedDate

      await act(async () => {
        await result.current.navigateToPreviousDay()
      })

      expect(result.current.selectedDate).toBe(originalDate)
    })
  })

  describe('calendar controls', () => {
    it('should open and close calendar', () => {
      const { result } = renderHook(() => useDateNavigation())

      act(() => {
        result.current.openCalendar()
      })

      expect(result.current.isCalendarVisible).toBe(true)
      expect(result.current.calendarDate).toBe('2023-06')

      act(() => {
        result.current.closeCalendar()
      })

      expect(result.current.isCalendarVisible).toBe(false)
    })

    it('should navigate calendar months', () => {
      const { result } = renderHook(() => useDateNavigation())

      act(() => {
        result.current.navigateCalendar('prev')
      })

      expect(result.current.calendarDate).toBe('2023-05')

      act(() => {
        result.current.navigateCalendar('next')
      })

      expect(result.current.calendarDate).toBe('2023-06')
    })

    it('should generate calendar days', () => {
      const { result } = renderHook(() => useDateNavigation())

      const calendarDays = result.current.getCalendarDays()

      expect(calendarDays).toHaveLength(42) // 6 weeks
      expect(calendarDays.some(day => day.isToday)).toBe(true)
      expect(calendarDays.some(day => day.isCurrentMonth)).toBe(true)
    })
  })

  describe('utility methods', () => {
    it('should check if date has data', () => {
      const { result } = renderHook(() => useDateNavigation())

      // Mock that data exists for a specific date
      mockNutritionStore.hasDataForDate.mockReturnValue(true)

      expect(result.current.hasDataForDate('2023-06-14')).toBe(false) // Based on availableDates
    })

    it('should provide navigation capability checks', async () => {
      const { result } = renderHook(() => useDateNavigation())

      // At today (2023-06-15)
      expect(result.current.canNavigateNext()).toBe(false) // Can't go to future
      expect(result.current.canNavigatePrevious()).toBe(true) // Can go to past

      // Navigate to a past date
      await act(async () => {
        await result.current.selectDate('2023-06-10')
      })

      expect(result.current.canNavigateNext()).toBe(true) // Can go forward
      expect(result.current.canNavigatePrevious()).toBe(true) // Can go back
    })

    it('should format display dates', () => {
      const { result } = renderHook(() => useDateNavigation())

      expect(result.current.formatDisplayDate('2023-06-15')).toBe('Today')
      expect(result.current.formatDisplayDate('2023-06-14')).toBe('Yesterday')
      expect(result.current.formatDisplayDate('2023-06-10')).toBe('Saturday, June 10')
    })

    it('should provide quick select dates', () => {
      const { result } = renderHook(() => useDateNavigation())

      const quickDates = result.current.getQuickSelectDates()

      expect(quickDates).toHaveLength(8) // Default count
      expect(quickDates[0].label).toBe('Today')
      expect(quickDates[0].isToday).toBe(true)
      expect(quickDates[1].label).toBe('Yesterday')
    })
  })

  describe('cache management', () => {
    it('should provide cache information', () => {
      const { result } = renderHook(() => useDateNavigation())

      expect(typeof result.current.cacheSize).toBe('number')
      expect(typeof result.current.preloadQueueSize).toBe('number')
    })

    it('should check if date is cached', () => {
      const { result } = renderHook(() => useDateNavigation())

      expect(result.current.isDateCached('2023-06-15')).toBe(false) // Initially not cached
    })
  })

  describe('error handling', () => {
    it('should handle data loading errors gracefully', async () => {
      const { result } = renderHook(() => useDateNavigation())

      mockNutritionStore.loadFoodEntriesForDate.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.selectDate('2023-06-14')
      })

      expect(result.current.isLoading).toBe(false)
      // Should still update selected date even if loading fails
      expect(result.current.selectedDate).toBe('2023-06-14')
    })

    it('should handle AsyncStorage errors', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))

      const { result } = renderHook(() => useDateNavigation())

      // Should not throw error
      await act(async () => {
        await result.current.selectDate('2023-06-14')
      })

      expect(result.current.selectedDate).toBe('2023-06-14')
    })
  })
})