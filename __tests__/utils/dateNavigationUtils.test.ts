import { DateNavigationUtils, CalendarDay } from '../../src/utils/dateNavigationUtils'

describe('DateNavigationUtils', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-06-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('validateDate', () => {
    it('should validate dates within the last year', () => {
      const today = '2023-06-15'
      const validDate = '2023-01-01'
      const oneYearAgo = '2022-06-15'

      expect(DateNavigationUtils.validateDate(today)).toBe(true)
      expect(DateNavigationUtils.validateDate(validDate)).toBe(true)
      expect(DateNavigationUtils.validateDate(oneYearAgo)).toBe(true)
    })

    it('should reject future dates', () => {
      const futureDate = '2023-06-16'
      const farFutureDate = '2024-01-01'

      expect(DateNavigationUtils.validateDate(futureDate)).toBe(false)
      expect(DateNavigationUtils.validateDate(farFutureDate)).toBe(false)
    })

    it('should reject dates older than one year', () => {
      const oldDate = '2022-06-14'
      const veryOldDate = '2021-01-01'

      expect(DateNavigationUtils.validateDate(oldDate)).toBe(false)
      expect(DateNavigationUtils.validateDate(veryOldDate)).toBe(false)
    })

    it('should reject invalid date strings', () => {
      const invalidDate = 'invalid-date'
      const malformedDate = '2023-13-32'

      expect(DateNavigationUtils.validateDate(invalidDate)).toBe(false)
      expect(DateNavigationUtils.validateDate(malformedDate)).toBe(false)
    })
  })

  describe('formatDisplayDate', () => {
    it('should return "Today" for current date', () => {
      const today = '2023-06-15'
      expect(DateNavigationUtils.formatDisplayDate(today)).toBe('Today')
    })

    it('should return "Yesterday" for previous day', () => {
      const yesterday = '2023-06-14'
      expect(DateNavigationUtils.formatDisplayDate(yesterday)).toBe('Yesterday')
    })

    it('should return formatted date for other dates', () => {
      const otherDate = '2023-06-10'
      const result = DateNavigationUtils.formatDisplayDate(otherDate)
      expect(result).toBe('Saturday, June 10')
    })
  })

  describe('getAdjacentDates', () => {
    it('should return correct adjacent dates with default range', () => {
      const centerDate = '2023-06-15'
      const adjacentDates = DateNavigationUtils.getAdjacentDates(centerDate)

      expect(adjacentDates).toHaveLength(4) // Only past and current dates
      expect(adjacentDates).toContain('2023-06-12') // -3 days
      expect(adjacentDates).toContain('2023-06-15') // center
      expect(adjacentDates).not.toContain('2023-06-18') // +3 days (filtered out as future)
    })

    it('should respect custom range', () => {
      const centerDate = '2023-06-15'
      const adjacentDates = DateNavigationUtils.getAdjacentDates(centerDate, 1)

      expect(adjacentDates).toHaveLength(2) // Only past and current
      expect(adjacentDates).toContain('2023-06-14') // -1 day
      expect(adjacentDates).toContain('2023-06-15') // center
    })

    it('should filter out invalid dates', () => {
      const centerDate = '2022-06-15' // One year ago
      const adjacentDates = DateNavigationUtils.getAdjacentDates(centerDate, 2)

      // Should include center date and a couple more since our boundary is inclusive
      expect(adjacentDates).toContain('2022-06-15')
      expect(adjacentDates.length).toBeGreaterThan(0)
    })
  })

  describe('formatDateString', () => {
    it('should format date to YYYY-MM-DD string', () => {
      const date = new Date('2023-06-15T12:00:00Z')
      const formatted = DateNavigationUtils.formatDateString(date)
      expect(formatted).toBe('2023-06-15')
    })

    it('should handle edge cases with timezone', () => {
      const date = new Date('2023-01-01T00:00:00Z')
      const formatted = DateNavigationUtils.formatDateString(date)
      expect(formatted).toBe('2023-01-01')
    })
  })

  describe('getMonthDates', () => {
    it('should generate correct calendar grid for June 2023', () => {
      const calendarDays = DateNavigationUtils.getMonthDates(2023, 5) // June (0-indexed)

      // Should include full weeks, so 42 days (6 weeks)
      expect(calendarDays).toHaveLength(42)

      // First day should be Sunday before June 1st
      expect(calendarDays[0].day).toBe(28) // May 28, 2023
      expect(calendarDays[0].isCurrentMonth).toBe(false)

      // June 1st should be marked as current month
      const june1 = calendarDays.find(day => day.day === 1 && day.isCurrentMonth)
      expect(june1).toBeDefined()
      expect(june1?.isCurrentMonth).toBe(true)

      // June 15th should be marked as today
      const today = calendarDays.find(day => day.day === 15 && day.isCurrentMonth)
      expect(today?.isToday).toBe(true)
    })

    it('should mark weekends correctly', () => {
      const calendarDays = DateNavigationUtils.getMonthDates(2023, 5) // June 2023

      // Find a known Saturday (June 3, 2023)
      const saturday = calendarDays.find(day => day.day === 3 && day.isCurrentMonth)
      expect(saturday?.isWeekend).toBe(true)

      // Find a known Sunday (June 4, 2023)
      const sunday = calendarDays.find(day => day.day === 4 && day.isCurrentMonth)
      expect(sunday?.isWeekend).toBe(true)

      // Find a known weekday (June 5, 2023 - Monday)
      const monday = calendarDays.find(day => day.day === 5 && day.isCurrentMonth)
      expect(monday?.isWeekend).toBe(false)
    })

    it('should mark selectable dates correctly', () => {
      const calendarDays = DateNavigationUtils.getMonthDates(2023, 5) // June 2023

      // Today should be selectable
      const today = calendarDays.find(day => day.day === 15 && day.isCurrentMonth)
      expect(today?.isSelectable).toBe(true)

      // Future dates should not be selectable
      const futureDate = calendarDays.find(day => day.day === 20 && day.isCurrentMonth)
      expect(futureDate?.isSelectable).toBe(false)

      // Dates within the last year should be selectable
      const lastMonth = calendarDays.find(day => day.day === 28 && !day.isCurrentMonth)
      expect(lastMonth?.isSelectable).toBe(true) // May 28, 2023 is within the last year
    })
  })

  describe('getTodayString', () => {
    it('should return today\'s date as string', () => {
      const today = DateNavigationUtils.getTodayString()
      expect(today).toBe('2023-06-15')
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      const baseDate = '2023-06-15'
      const result = DateNavigationUtils.addDays(baseDate, 5)
      expect(result).toBe('2023-06-20')
    })

    it('should handle month boundaries', () => {
      const baseDate = '2023-06-28'
      const result = DateNavigationUtils.addDays(baseDate, 5)
      expect(result).toBe('2023-07-03')
    })
  })

  describe('subtractDays', () => {
    it('should subtract days correctly', () => {
      const baseDate = '2023-06-15'
      const result = DateNavigationUtils.subtractDays(baseDate, 5)
      expect(result).toBe('2023-06-10')
    })

    it('should handle month boundaries', () => {
      const baseDate = '2023-06-03'
      const result = DateNavigationUtils.subtractDays(baseDate, 5)
      expect(result).toBe('2023-05-29')
    })
  })

  describe('isValidDateString', () => {
    it('should validate YYYY-MM-DD format and date validity', () => {
      expect(DateNavigationUtils.isValidDateString('2023-06-15')).toBe(true)
      expect(DateNavigationUtils.isValidDateString('2023-01-01')).toBe(true)
      expect(DateNavigationUtils.isValidDateString('invalid')).toBe(false)
      expect(DateNavigationUtils.isValidDateString('2023/06/15')).toBe(false)
      expect(DateNavigationUtils.isValidDateString('2023-13-01')).toBe(false)
    })
  })

  describe('getMonthName', () => {
    it('should return correct month and year', () => {
      const monthName = DateNavigationUtils.getMonthName(2023, 5) // June
      expect(monthName).toBe('June 2023')
    })
  })

  describe('getDaysBetween', () => {
    it('should calculate days between dates', () => {
      const start = '2023-06-10'
      const end = '2023-06-15'
      const days = DateNavigationUtils.getDaysBetween(start, end)
      expect(days).toBe(5)
    })

    it('should handle negative differences', () => {
      const start = '2023-06-15'
      const end = '2023-06-10'
      const days = DateNavigationUtils.getDaysBetween(start, end)
      expect(days).toBe(5) // Should return absolute value
    })
  })

  describe('isToday', () => {
    it('should correctly identify today', () => {
      expect(DateNavigationUtils.isToday('2023-06-15')).toBe(true)
      expect(DateNavigationUtils.isToday('2023-06-14')).toBe(false)
      expect(DateNavigationUtils.isToday('2023-06-16')).toBe(false)
    })
  })

  describe('isYesterday', () => {
    it('should correctly identify yesterday', () => {
      expect(DateNavigationUtils.isYesterday('2023-06-14')).toBe(true)
      expect(DateNavigationUtils.isYesterday('2023-06-15')).toBe(false)
      expect(DateNavigationUtils.isYesterday('2023-06-13')).toBe(false)
    })
  })

  describe('getQuickSelectDates', () => {
    it('should return correct quick select dates', () => {
      const quickDates = DateNavigationUtils.getQuickSelectDates(5)

      expect(quickDates).toHaveLength(5)
      expect(quickDates[0].label).toBe('Today')
      expect(quickDates[0].isToday).toBe(true)
      expect(quickDates[1].label).toBe('Yesterday')
      expect(quickDates[1].isToday).toBe(false)

      // Should be in descending order (most recent first)
      expect(quickDates[0].date).toBe('2023-06-15')
      expect(quickDates[1].date).toBe('2023-06-14')
    })

    it('should filter out invalid dates', () => {
      // Set system time to a date where going back would hit the validation limit
      jest.setSystemTime(new Date('2022-06-16T12:00:00Z'))

      const quickDates = DateNavigationUtils.getQuickSelectDates(10)

      // Should include several days since our validation allows one year back
      expect(quickDates.length).toBeGreaterThan(1)
      expect(quickDates[0].label).toBe('Today')
    })
  })
})