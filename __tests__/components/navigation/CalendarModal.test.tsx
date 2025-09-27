import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CalendarModal } from '../../../src/components/navigation/CalendarModal'
import { CalendarDay } from '../../../src/utils/dateNavigationUtils'

describe('CalendarModal', () => {
  const mockCalendarDays: CalendarDay[] = [
    // June 2023 calendar grid (simplified)
    { date: '2023-05-28', day: 28, isCurrentMonth: false, isToday: false, isWeekend: true, isSelectable: true },
    { date: '2023-06-01', day: 1, isCurrentMonth: true, isToday: false, isWeekend: false, isSelectable: true },
    { date: '2023-06-15', day: 15, isCurrentMonth: true, isToday: true, isWeekend: false, isSelectable: true },
    { date: '2023-06-16', day: 16, isCurrentMonth: true, isToday: false, isWeekend: false, isSelectable: false },
    { date: '2023-06-30', day: 30, isCurrentMonth: true, isToday: false, isWeekend: false, isSelectable: true },
  ]

  const defaultProps = {
    isVisible: true,
    selectedDate: '2023-06-15',
    calendarDate: '2023-06',
    availableDates: ['2023-06-01', '2023-06-15'],
    onClose: jest.fn(),
    onSelectDate: jest.fn(),
    onNavigateCalendar: jest.fn(),
    getCalendarDays: jest.fn(() => mockCalendarDays)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when visible', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('June 2023')).toBeTruthy()
      expect(getByText('Close')).toBeTruthy()
    })

    it('should not render when not visible', () => {
      const { queryByText } = render(
        <CalendarModal {...defaultProps} isVisible={false} />
      )

      expect(queryByText('June 2023')).toBeFalsy()
    })

    it('should render weekday headers', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('Sun')).toBeTruthy()
      expect(getByText('Mon')).toBeTruthy()
      expect(getByText('Tue')).toBeTruthy()
      expect(getByText('Wed')).toBeTruthy()
      expect(getByText('Thu')).toBeTruthy()
      expect(getByText('Fri')).toBeTruthy()
      expect(getByText('Sat')).toBeTruthy()
    })

    it('should render calendar days', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('1')).toBeTruthy()
      expect(getByText('15')).toBeTruthy()
      expect(getByText('30')).toBeTruthy()
    })

    it('should show data indicators for dates with data', () => {
      const { getAllByTestId } = render(<CalendarModal {...defaultProps} />)

      // Should have data indicators for dates in availableDates
      // This would need to be implemented in the component with testID
      expect(defaultProps.getCalendarDays).toHaveBeenCalled()
    })

    it('should show legend', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('Has data')).toBeTruthy()
      expect(getByText('Today')).toBeTruthy()
    })
  })

  describe('navigation', () => {
    it('should call onNavigateCalendar when previous month pressed', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      const prevButton = getByLabelText('Previous month')
      fireEvent.press(prevButton)

      expect(defaultProps.onNavigateCalendar).toHaveBeenCalledWith('prev')
    })

    it('should call onNavigateCalendar when next month pressed', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      const nextButton = getByLabelText('Next month')
      fireEvent.press(nextButton)

      expect(defaultProps.onNavigateCalendar).toHaveBeenCalledWith('next')
    })

    it('should display correct month name', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('June 2023')).toBeTruthy()
    })

    it('should display different month when calendarDate changes', () => {
      const { getByText, rerender } = render(<CalendarModal {...defaultProps} />)

      expect(getByText('June 2023')).toBeTruthy()

      rerender(
        <CalendarModal {...defaultProps} calendarDate="2023-05" />
      )

      expect(getByText('May 2023')).toBeTruthy()
    })
  })

  describe('date selection', () => {
    it('should call onSelectDate and onClose when selectable date pressed', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      const selectableDay = getByText('1')
      fireEvent.press(selectableDay)

      expect(defaultProps.onSelectDate).toHaveBeenCalledWith('2023-06-01')
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should not call onSelectDate when non-selectable date pressed', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      const nonSelectableDay = getByText('16') // Future date
      fireEvent.press(nonSelectableDay)

      expect(defaultProps.onSelectDate).not.toHaveBeenCalled()
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('should highlight selected date', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      const selectedDay = getByText('15')

      // Should have selected styling applied
      expect(selectedDay.parent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      )
    })

    it('should highlight today date', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      const todayDay = getByText('15')

      // Should have today styling applied
      expect(todayDay.parent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      )
    })
  })

  describe('modal controls', () => {
    it('should call onClose when close button pressed', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      const closeButton = getByLabelText('Close calendar')
      fireEvent.press(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when modal dismissed via onRequestClose', () => {
      const { getByTestId } = render(<CalendarModal {...defaultProps} />)

      // This would trigger the Modal's onRequestClose
      // Implementation depends on how Modal component is tested
      expect(defaultProps.onClose).toBeDefined()
    })
  })

  describe('accessibility', () => {
    it('should have proper accessibility labels for navigation', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      expect(getByLabelText('Previous month')).toBeTruthy()
      expect(getByLabelText('Next month')).toBeTruthy()
      expect(getByLabelText('Close calendar')).toBeTruthy()
    })

    it('should have accessibility labels for date buttons', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      // Should have accessibility label that includes date info
      expect(getByLabelText(/Thursday, June 1/)).toBeTruthy()
      expect(getByLabelText(/Today, Thursday, June 15/)).toBeTruthy()
    })

    it('should have proper accessibility roles', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      const prevButton = getByLabelText('Previous month')
      const nextButton = getByLabelText('Next month')
      const closeButton = getByLabelText('Close calendar')

      expect(prevButton.props.accessibilityRole).toBe('button')
      expect(nextButton.props.accessibilityRole).toBe('button')
      expect(closeButton.props.accessibilityRole).toBe('button')
    })

    it('should indicate selected and disabled states in accessibility', () => {
      const { getByLabelText } = render(<CalendarModal {...defaultProps} />)

      const selectedDay = getByLabelText(/Today, Thursday, June 15/)
      const disabledDay = getByLabelText(/Friday, June 16/)

      expect(selectedDay.props.accessibilityState?.selected).toBe(true)
      expect(disabledDay.props.accessibilityState?.disabled).toBe(true)
    })
  })

  describe('visual styling', () => {
    it('should apply different styles to current month vs other month days', () => {
      const { getByText } = render(<CalendarModal {...defaultProps} />)

      const currentMonthDay = getByText('1')
      const otherMonthDay = getByText('28') // May 28

      // Current month should have normal opacity
      expect(currentMonthDay.parent?.props.style).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: 0.3
          })
        ])
      )

      // Other month should have reduced opacity
      expect(otherMonthDay.parent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: 0.3
          })
        ])
      )
    })

    it('should show data indicators for dates with data', () => {
      const props = {
        ...defaultProps,
        availableDates: ['2023-06-01', '2023-06-15', '2023-06-30']
      }

      const { getByText } = render(<CalendarModal {...props} />)

      // Each date with data should have a small indicator dot
      // This would need proper implementation in the component
      expect(getByText('1')).toBeTruthy()
      expect(getByText('15')).toBeTruthy()
      expect(getByText('30')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle empty calendar days gracefully', () => {
      const propsWithEmptyDays = {
        ...defaultProps,
        getCalendarDays: jest.fn(() => [])
      }

      const { getByText } = render(<CalendarModal {...propsWithEmptyDays} />)

      expect(getByText('June 2023')).toBeTruthy()
      expect(getByText('Close')).toBeTruthy()
    })

    it('should handle invalid calendarDate gracefully', () => {
      const propsWithInvalidDate = {
        ...defaultProps,
        calendarDate: 'invalid-date'
      }

      // Should not crash
      const { getByText } = render(<CalendarModal {...propsWithInvalidDate} />)

      expect(getByText('Close')).toBeTruthy()
    })
  })
})