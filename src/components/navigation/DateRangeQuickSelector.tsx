import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native'
import { DateNavigationUtils } from '../../utils/dateNavigationUtils'

interface DateRangeQuickSelectorProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  formatDisplayDate: (date: string) => string
  isLoading?: boolean
}

export const DateRangeQuickSelector: React.FC<DateRangeQuickSelectorProps> = ({
  selectedDate,
  onSelectDate,
  formatDisplayDate,
  isLoading = false
}) => {
  const quickDates = DateNavigationUtils.getQuickSelectDates(8)

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {quickDates.map(({ date, label, isToday }) => {
          const isSelected = date === selectedDate

          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.quickDateButton,
                isSelected && styles.quickDateButtonSelected,
                isToday && styles.quickDateButtonToday
              ]}
              onPress={() => onSelectDate(date)}
              disabled={isLoading}
              accessibilityLabel={`Select ${label}`}
              accessibilityRole="button"
              accessibilityState={{
                selected: isSelected,
                disabled: isLoading
              }}
            >
              <Text style={[
                styles.quickDateButtonText,
                isSelected && styles.quickDateButtonTextSelected,
                isToday && styles.quickDateButtonTextToday
              ]}>
                {label}
              </Text>

              {isToday && !isSelected && (
                <View style={styles.todayDot} />
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollView: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quickDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  quickDateButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    elevation: 2,
    shadowOpacity: 0.2,
  },
  quickDateButtonToday: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  quickDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  quickDateButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  quickDateButtonTextToday: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  todayDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
})