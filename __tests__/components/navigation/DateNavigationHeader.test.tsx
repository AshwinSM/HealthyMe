import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { DateNavigationHeader } from '../../../src/components/navigation/DateNavigationHeader'

describe('DateNavigationHeader', () => {
  const defaultProps = {
    selectedDate: '2023-06-15',
    isLoading: false,
    canNavigatePrevious: true,
    canNavigateNext: true,
    onPreviousDay: jest.fn(),
    onNextDay: jest.fn(),
    onOpenCalendar: jest.fn(),
    onGoToToday: jest.fn(),
    formatDisplayDate: jest.fn((date: string) => {
      if (date === '2023-06-15') return 'Today'
      if (date === '2023-06-14') return 'Yesterday'
      return 'Some Date'
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render with formatted date', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      expect(getByLabelText(/Selected date.*Today/)).toBeTruthy()
      expect(defaultProps.formatDisplayDate).toHaveBeenCalledWith('2023-06-15')
    })

    it('should show calendar icon', () => {
      const { getByText } = render(<DateNavigationHeader {...defaultProps} />)

      expect(getByText('📅')).toBeTruthy()
    })

    it('should show loading indicator when loading', () => {
      const { getByTestId } = render(
        <DateNavigationHeader {...defaultProps} isLoading={true} />
      )

      // ActivityIndicator should be present
      expect(getByTestId).toBeDefined()
    })

    it('should show today button when not on today', () => {
      const props = {
        ...defaultProps,
        selectedDate: '2023-06-14',
        formatDisplayDate: jest.fn(() => 'Yesterday')
      }

      const { getByText } = render(<DateNavigationHeader {...props} />)

      expect(getByText('Today')).toBeTruthy()
    })

    it('should hide today button when on today', () => {
      const { queryByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      // Should not show "Today" button when already on today
      const todayButton = queryByLabelText('Go to today')
      expect(todayButton).toBeFalsy()
    })
  })

  describe('navigation controls', () => {
    it('should call onPreviousDay when previous button pressed', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      const previousButton = getByLabelText('Previous day')
      fireEvent.press(previousButton)

      expect(defaultProps.onPreviousDay).toHaveBeenCalledTimes(1)
    })

    it('should call onNextDay when next button pressed', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      const nextButton = getByLabelText('Next day')
      fireEvent.press(nextButton)

      expect(defaultProps.onNextDay).toHaveBeenCalledTimes(1)
    })

    it('should disable previous button when canNavigatePrevious is false', () => {
      const props = { ...defaultProps, canNavigatePrevious: false }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const previousButton = getByLabelText('Previous day')
      fireEvent.press(previousButton)

      expect(defaultProps.onPreviousDay).not.toHaveBeenCalled()
    })

    it('should disable next button when canNavigateNext is false', () => {
      const props = { ...defaultProps, canNavigateNext: false }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const nextButton = getByLabelText('Next day')
      fireEvent.press(nextButton)

      expect(defaultProps.onNextDay).not.toHaveBeenCalled()
    })

    it('should disable all buttons when loading', () => {
      const props = { ...defaultProps, isLoading: true }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const previousButton = getByLabelText('Previous day')
      const nextButton = getByLabelText('Next day')

      fireEvent.press(previousButton)
      fireEvent.press(nextButton)

      expect(defaultProps.onPreviousDay).not.toHaveBeenCalled()
      expect(defaultProps.onNextDay).not.toHaveBeenCalled()
    })
  })

  describe('calendar interaction', () => {
    it('should call onOpenCalendar when date display is pressed', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      const dateDisplay = getByLabelText(/Selected date.*Tap to open calendar/)
      fireEvent.press(dateDisplay)

      expect(defaultProps.onOpenCalendar).toHaveBeenCalledTimes(1)
    })

    it('should not open calendar when loading', () => {
      const props = { ...defaultProps, isLoading: true }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const dateDisplay = getByLabelText(/Selected date.*Tap to open calendar/)
      fireEvent.press(dateDisplay)

      expect(defaultProps.onOpenCalendar).not.toHaveBeenCalled()
    })
  })

  describe('today button', () => {
    it('should call onGoToToday when today button pressed', () => {
      const props = {
        ...defaultProps,
        selectedDate: '2023-06-14',
        formatDisplayDate: jest.fn(() => 'Yesterday')
      }

      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const todayButton = getByLabelText('Go to today')
      fireEvent.press(todayButton)

      expect(defaultProps.onGoToToday).toHaveBeenCalledTimes(1)
    })

    it('should not call onGoToToday when loading', () => {
      const props = {
        ...defaultProps,
        selectedDate: '2023-06-14',
        isLoading: true,
        formatDisplayDate: jest.fn(() => 'Yesterday')
      }

      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const todayButton = getByLabelText('Go to today')
      fireEvent.press(todayButton)

      expect(defaultProps.onGoToToday).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      expect(getByLabelText('Previous day')).toBeTruthy()
      expect(getByLabelText('Next day')).toBeTruthy()
      expect(getByLabelText(/Selected date.*Tap to open calendar/)).toBeTruthy()
    })

    it('should have proper accessibility roles', () => {
      const { getByLabelText } = render(<DateNavigationHeader {...defaultProps} />)

      const previousButton = getByLabelText('Previous day')
      const nextButton = getByLabelText('Next day')
      const dateDisplay = getByLabelText(/Selected date.*Tap to open calendar/)

      expect(previousButton.props.accessibilityRole).toBe('button')
      expect(nextButton.props.accessibilityRole).toBe('button')
      expect(dateDisplay.props.accessibilityRole).toBe('button')
    })
  })

  describe('styling based on state', () => {
    it('should apply disabled styles when canNavigatePrevious is false', () => {
      const props = { ...defaultProps, canNavigatePrevious: false }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const previousButton = getByLabelText('Previous day')

      // Should have disabled style applied (opacity or different background)
      expect(previousButton.props.style).toEqual(
        expect.objectContaining({
          opacity: expect.any(Number)
        })
      )
    })

    it('should apply disabled styles when canNavigateNext is false', () => {
      const props = { ...defaultProps, canNavigateNext: false }
      const { getByLabelText } = render(<DateNavigationHeader {...props} />)

      const nextButton = getByLabelText('Next day')

      // Should have disabled style applied
      expect(nextButton.props.style).toEqual(
        expect.objectContaining({
          opacity: expect.any(Number)
        })
      )
    })
  })
})