import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useDateNavigation } from '../../hooks/useDateNavigation'
import { DateNavigationHeader } from './DateNavigationHeader'
import { CalendarModal } from './CalendarModal'
import { DateRangeQuickSelector } from './DateRangeQuickSelector'

interface DateNavigationProps {
  showQuickSelector?: boolean
  onDateChange?: (date: string) => void
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  showQuickSelector = true,
  onDateChange
}) => {
  const {
    selectedDate,
    calendarDate,
    isCalendarVisible,
    isLoading,
    availableDates,
    selectDate,
    navigateToToday,
    navigateToNextDay,
    navigateToPreviousDay,
    openCalendar,
    closeCalendar,
    navigateCalendar,
    getCalendarDays,
    canNavigateNext,
    canNavigatePrevious,
    formatDisplayDate
  } = useDateNavigation()

  const handleSelectDate = async (date: string) => {
    await selectDate(date)
    onDateChange?.(date)
  }

  const handleNavigateToToday = async () => {
    await navigateToToday()
    onDateChange?.(selectedDate)
  }

  const handleNavigateToNextDay = async () => {
    await navigateToNextDay()
    onDateChange?.(selectedDate)
  }

  const handleNavigateToPreviousDay = async () => {
    await navigateToPreviousDay()
    onDateChange?.(selectedDate)
  }

  return (
    <View style={styles.container}>
      <DateNavigationHeader
        selectedDate={selectedDate}
        isLoading={isLoading}
        canNavigatePrevious={canNavigatePrevious}
        canNavigateNext={canNavigateNext}
        onPreviousDay={handleNavigateToPreviousDay}
        onNextDay={handleNavigateToNextDay}
        onOpenCalendar={openCalendar}
        onGoToToday={handleNavigateToToday}
        formatDisplayDate={formatDisplayDate}
      />

      {showQuickSelector && (
        <DateRangeQuickSelector
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          formatDisplayDate={formatDisplayDate}
          isLoading={isLoading}
        />
      )}

      <CalendarModal
        isVisible={isCalendarVisible}
        selectedDate={selectedDate}
        calendarDate={calendarDate}
        availableDates={availableDates}
        onClose={closeCalendar}
        onSelectDate={handleSelectDate}
        onNavigateCalendar={navigateCalendar}
        getCalendarDays={getCalendarDays}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
})