import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native'
import { DateNavigationUtils } from '../../utils/dateNavigationUtils'

interface DateNavigationHeaderProps {
  selectedDate: string
  isLoading: boolean
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  onPreviousDay: () => void
  onNextDay: () => void
  onOpenCalendar: () => void
  onGoToToday: () => void
  formatDisplayDate: (date: string) => string
}

export const DateNavigationHeader: React.FC<DateNavigationHeaderProps> = ({
  selectedDate,
  isLoading,
  canNavigatePrevious,
  canNavigateNext,
  onPreviousDay,
  onNextDay,
  onOpenCalendar,
  onGoToToday,
  formatDisplayDate
}) => {
  const isToday = selectedDate === DateNavigationUtils.getTodayString()

  return (
    <View style={styles.container}>
      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            !canNavigatePrevious && styles.navButtonDisabled
          ]}
          onPress={onPreviousDay}
          disabled={!canNavigatePrevious || isLoading}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Text style={[
            styles.navButtonText,
            !canNavigatePrevious && styles.navButtonTextDisabled
          ]}>
            ‹
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateDisplay}
          onPress={onOpenCalendar}
          disabled={isLoading}
          accessibilityLabel={`Selected date: ${formatDisplayDate(selectedDate)}. Tap to open calendar`}
          accessibilityRole="button"
        >
          <Text style={styles.dateDisplayText}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>

          {isLoading && (
            <ActivityIndicator
              size="small"
              color="#10B981"
              style={styles.loadingIndicator}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            !canNavigateNext && styles.navButtonDisabled
          ]}
          onPress={onNextDay}
          disabled={!canNavigateNext || isLoading}
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <Text style={[
            styles.navButtonText,
            !canNavigateNext && styles.navButtonTextDisabled
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {!isToday && (
        <TouchableOpacity
          style={styles.todayButton}
          onPress={onGoToToday}
          disabled={isLoading}
          accessibilityLabel="Go to today"
          accessibilityRole="button"
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  navButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  dateDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
    textAlign: 'center',
  },
  calendarIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#10B981',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
})