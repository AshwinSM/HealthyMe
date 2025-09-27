import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Dimensions,
  PanResponder,
  Animated
} from 'react-native';
import { 
  Utensils, 
  Dumbbell, 
  Scale, 
  Droplets, 
  Footprints, 
  Moon,
  ChevronRight,
  X
} from 'lucide-react-native';

export type TrackingCategory = 'food' | 'workout' | 'weight' | 'water' | 'steps' | 'sleep';

interface TrackingSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: TrackingCategory) => void;
}

interface TrackingOption {
  id: TrackingCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;

export const TrackingSelectionModal: React.FC<TrackingSelectionModalProps> = ({
  visible,
  onClose,
  onSelectCategory,
}) => {
  const slideAnim = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const trackingOptions: TrackingOption[] = [
    {
      id: 'food',
      label: 'Food',
      icon: <Utensils size={24} color="#FFFFFF" />,
      color: '#F97316',
      backgroundColor: '#FED7AA',
    },
    {
      id: 'workout',
      label: 'Workout',
      icon: <Dumbbell size={24} color="#FFFFFF" />,
      color: '#EC4899',
      backgroundColor: '#FECACA',
    },
    {
      id: 'weight',
      label: 'Weight',
      icon: <Scale size={24} color="#FFFFFF" />,
      color: '#6366F1',
      backgroundColor: '#C7D2FE',
    },
    {
      id: 'water',
      label: 'Water',
      icon: <Droplets size={24} color="#FFFFFF" />,
      color: '#06B6D4',
      backgroundColor: '#CFFAFE',
    },
    {
      id: 'steps',
      label: 'Steps',
      icon: <Footprints size={24} color="#FFFFFF" />,
      color: '#10B981',
      backgroundColor: '#D1FAE5',
    },
    {
      id: 'sleep',
      label: 'Sleep',
      icon: <Moon size={24} color="#FFFFFF" />,
      color: '#8B5CF6',
      backgroundColor: '#DDD6FE',
    },
  ];

  // Pan responder for swipe down gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 150) {
        handleClose();
      } else {
        // Snap back to open position
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

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
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  const handleSelectCategory = (category: TrackingCategory) => {
    onSelectCategory(category);
    handleClose();
  };

  React.useEffect(() => {
    if (visible) {
      handleOpen();
    }
  }, [visible]);

  if (!visible) return null;

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
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>What Would You Like to Track?</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {trackingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={() => handleSelectCategory(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  {option.icon}
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </View>
              <ChevronRight size={20} color={option.color} />
            </TouchableOpacity>
          ))}
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
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    paddingTop: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
});