import React, { useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native'
import { CalendarDay, DateNavigationUtils } from '../../utils/dateNavigationUtils'

interface CalendarModalProps {
  isVisible: boolean
  selectedDate: string
  calendarDate: string
  availableDates: string[]
  onClose: () => void
  onSelectDate: (date: string) => void
  onNavigateCalendar: (direction: 'prev' | 'next') => void
  getCalendarDays: () => CalendarDay[]
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isVisible,
  selectedDate,
  calendarDate,
  availableDates,
  onClose,
  onSelectDate,
  onNavigateCalendar,
  getCalendarDays
}) => {
  const calendarDays = getCalendarDays()
  const [year, month] = calendarDate.split('-').map(Number)
  const monthName = DateNavigationUtils.getMonthName(year, month - 1)

  const renderDay = useCallback((day: CalendarDay) => {
    const hasData = availableDates.includes(day.date)
    const isSelected = day.date === selectedDate

    return (
      <TouchableOpacity
        key={day.date}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.calendarDayOtherMonth,
          day.isToday && styles.calendarDayToday,
          isSelected && styles.calendarDaySelected,
          !day.isSelectable && styles.calendarDayDisabled
        ]}
        onPress={() => {
          if (day.isSelectable) {
            onSelectDate(day.date)
            onClose()
          }
        }}
        disabled={!day.isSelectable}
        accessibilityLabel={`${DateNavigationUtils.formatDisplayDate(day.date)}${
          hasData ? ', has data' : ''
        }${isSelected ? ', selected' : ''}${day.isToday ? ', today' : ''}`}
        accessibilityRole="button"
        accessibilityState={{
          selected: isSelected,
          disabled: !day.isSelectable
        }}
      >
        <Text style={[
          styles.calendarDayText,
          !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
          day.isToday && styles.calendarDayTextToday,
          isSelected && styles.calendarDayTextSelected,
          !day.isSelectable && styles.calendarDayTextDisabled
        ]}>
          {day.day}
        </Text>

        {hasData && day.isCurrentMonth && (
          <View style={styles.dataIndicator} />
        )}
      </TouchableOpacity>
    )
  }, [availableDates, selectedDate, onSelectDate, onClose])

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => onNavigateCalendar('prev')}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
            >
              <Text style={styles.calendarNavButtonText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.calendarTitle}>{monthName}</Text>

            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => onNavigateCalendar('next')}
              accessibilityLabel="Next month"
              accessibilityRole="button"
            >
              <Text style={styles.calendarNavButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekdayHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView
            style={styles.calendarScrollView}
            contentContainerStyle={styles.calendarGrid}
            showsVerticalScrollIndicator={false}
          >
            {calendarDays.map(renderDay)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.calendarFooter}>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.dataIndicator]} />
                <Text style={styles.legendText}>Has data</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.todayIndicator]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={onClose}
              accessibilityLabel="Close calendar"
              accessibilityRole="button"
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  calendarNavButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekdayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  calendarScrollView: {
    maxHeight: 300,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
    borderRadius: 8,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  calendarDaySelected: {
    backgroundColor: '#10B981',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  calendarDayDisabled: {
    opacity: 0.2,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayTextOtherMonth: {
    color: '#9CA3AF',
  },
  calendarDayTextToday: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: '#D1D5DB',
  },
  dataIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayIndicator: {
    backgroundColor: '#3B82F6',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  calendarCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  calendarCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
})