import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Dimensions,
  Animated
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DateSelectionModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  onConfirm: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onDateSelect,
  onConfirm,
  minDate,
  maxDate,
}) => {
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  const slideAnim = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const formatDateForCalendar = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseCalendarDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00.000Z');
  };

  const handleOpen = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: MODAL_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setTempSelectedDate(selectedDate); // Reset to original date
      onClose();
    });
  };

  const handleDatePress = (day: any) => {
    const newDate = parseCalendarDate(day.dateString);
    setTempSelectedDate(newDate);
    onDateSelect(newDate);
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedDate);
    Animated.timing(slideAnim, {
      toValue: MODAL_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(onClose);
  };

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  React.useEffect(() => {
    if (visible) {
      setTempSelectedDate(selectedDate);
      handleOpen();
    }
  }, [visible, selectedDate]);

  if (!visible) return null;

  const selectedDateString = formatDateForCalendar(tempSelectedDate);
  const todayString = formatDateForCalendar(new Date());
  
  const markedDates = {
    [selectedDateString]: {
      selected: true,
      selectedColor: '#2DD4BF',
      selectedTextColor: '#FFFFFF',
    },
    [todayString]: selectedDateString !== todayString ? {
      marked: true,
      dotColor: '#2DD4BF',
    } : {},
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.backdropOverlay} />
      </TouchableOpacity>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Select Date</Text>
          
          <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {formatDisplayDate(tempSelectedDate)}
          </Text>
          <Text style={styles.selectedDateSubtext}>
            {tempSelectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDateString}
            onDayPress={handleDatePress}
            markedDates={markedDates}
            minDate={minDate ? formatDateForCalendar(minDate) : undefined}
            maxDate={maxDate ? formatDateForCalendar(maxDate) : formatDateForCalendar(new Date())}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#2DD4BF',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#2DD4BF',
              dayTextColor: '#111827',
              textDisabledColor: '#D1D5DB',
              dotColor: '#2DD4BF',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#2DD4BF',
              disabledArrowColor: '#D1D5DB',
              monthTextColor: '#111827',
              indicatorColor: '#2DD4BF',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            renderArrow={(direction) => (
              direction === 'left' ? 
                <ChevronLeft size={24} color="#2DD4BF" /> : 
                <ChevronRight size={24} color="#2DD4BF" />
            )}
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: MODAL_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneText: {
    fontSize: 16,
    color: '#2DD4BF',
    fontWeight: '600',
  },
  selectedDateContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDateText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2DD4BF',
    marginBottom: 4,
  },
  selectedDateSubtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});