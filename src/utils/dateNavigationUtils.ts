import { Timestamp } from 'firebase/firestore'

export interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isSelectable: boolean
}

export class DateNavigationUtils {
  static validateDate(dateString: string): boolean {
    const date = new Date(dateString + 'T00:00:00.000Z')
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    oneYearAgo.setHours(0, 0, 0, 0) // Start of one year ago

    return (
      !isNaN(date.getTime()) &&
      date <= today &&
      date >= oneYearAgo
    )
  }

  static formatDisplayDate(dateString: string): string {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (this.isSameDay(date, today)) return 'Today'
    if (this.isSameDay(date, yesterday)) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  static getAdjacentDates(centerDate: string, range: number = 3): string[] {
    const dates = []
    const center = new Date(centerDate)

    for (let i = -range; i <= range; i++) {
      const date = new Date(center)
      date.setDate(center.getDate() + i)

      if (this.validateDate(this.formatDateString(date))) {
        dates.push(this.formatDateString(date))
      }
    }

    return dates
  }

  static formatDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString)
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString()
  }

  static getMonthDates(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1)
    const startCalendar = new Date(firstDay)

    // Start from Sunday of the first week
    startCalendar.setDate(startCalendar.getDate() - startCalendar.getDay())

    const calendarDays: CalendarDay[] = []
    const currentDate = new Date(startCalendar)

    // Generate exactly 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      calendarDays.push({
        date: this.formatDateString(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, new Date()),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        isSelectable: this.validateDate(this.formatDateString(currentDate))
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return calendarDays
  }

  static getTodayString(): string {
    return this.formatDateString(new Date())
  }

  static addDays(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return this.formatDateString(date)
  }

  static subtractDays(dateString: string, days: number): string {
    return this.addDays(dateString, -days)
  }

  static isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.test(dateString) && this.validateDate(dateString)
  }

  static getMonthName(year: number, month: number): string {
    return new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  static getWeekdayName(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long'
    })
  }

  static getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  static isToday(dateString: string): boolean {
    return dateString === this.getTodayString()
  }

  static isYesterday(dateString: string): boolean {
    const yesterday = this.subtractDays(this.getTodayString(), 1)
    return dateString === yesterday
  }

  static isFutureDate(dateString: string): boolean {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return date > today
  }

  static getRelativeDateString(dateString: string): string {
    if (this.isToday(dateString)) return 'Today'
    if (this.isYesterday(dateString)) return 'Yesterday'

    const daysDiff = this.getDaysBetween(dateString, this.getTodayString())

    if (daysDiff <= 7) {
      return `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`
    }

    return this.formatDisplayDate(dateString)
  }

  static getQuickSelectDates(count: number = 7): Array<{date: string, label: string, isToday: boolean}> {
    const dates = []
    const today = new Date()

    for (let i = 0; i < count; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = this.formatDateString(date)

      if (this.validateDate(dateString)) {
        dates.push({
          date: dateString,
          label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : this.getWeekdayName(dateString),
          isToday: i === 0
        })
      }
    }

    return dates
  }
}