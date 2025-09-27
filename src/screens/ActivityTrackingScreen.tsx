import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { HealthService } from '../services/firebase/health';
import {
  StepsTracking,
  WorkoutEntryForm,
  ActivitySummaryDashboard
} from '../components/activity';
import {
  DailyActivitySummary,
  ActivityGoals,
  WorkoutEntry
} from '../types/health';

interface ActivityTrackingScreenProps {
  route?: {
    params?: {
      date?: string;
    };
  };
}

export const ActivityTrackingScreen: React.FC<ActivityTrackingScreenProps> = ({
  route
}) => {
  const { user } = useAuthStore();
  const [selectedDate] = useState(
    route?.params?.date || new Date().toISOString().split('T')[0]
  );
  const [activitySummary, setActivitySummary] = useState<DailyActivitySummary | null>(null);
  const [isWorkoutModalVisible, setIsWorkoutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadActivitySummary();
  }, [selectedDate]);

  const loadActivitySummary = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await HealthService.getDailyActivitySummary(user.id, selectedDate);
      if (result.success && result.data) {
        setActivitySummary(result.data);
      }
    } catch (error) {
      console.error('Failed to load activity summary:', error);
      Alert.alert('Error', 'Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepsUpdate = () => {
    // Reload activity summary when steps are updated
    loadActivitySummary();
  };

  const handleWorkoutSuccess = (workout: WorkoutEntry) => {
    setIsWorkoutModalVisible(false);
    Alert.alert(
      '✅ Workout Logged!',
      `${workout.name} has been successfully logged.`,
      [{ text: 'Great!', style: 'default' }]
    );
    // Reload activity summary to include new workout
    loadActivitySummary();
  };

  const handleAddWorkout = () => {
    setIsWorkoutModalVisible(true);
  };

  const handleEditSteps = () => {
    // Steps editing is handled within the StepsTracking component
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity Tracking</Text>
          <Text style={styles.headerSubtitle}>{formatDate(selectedDate)}</Text>
        </View>

        {/* Steps Tracking */}
        <StepsTracking
          date={selectedDate}
          onStepsUpdate={handleStepsUpdate}
        />

        {/* Activity Summary Dashboard */}
        {activitySummary && (
          <ActivitySummaryDashboard
            date={selectedDate}
            summary={activitySummary}
            onEditSteps={handleEditSteps}
            onAddWorkout={handleAddWorkout}
          />
        )}

        {/* Quick Add Workout Button */}
        <TouchableOpacity
          style={styles.addWorkoutButton}
          onPress={handleAddWorkout}
        >
          <Text style={styles.addWorkoutButtonText}>+ Add Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Workout Entry Modal */}
      <Modal
        visible={isWorkoutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsWorkoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <WorkoutEntryForm
            date={selectedDate}
            onSuccess={handleWorkoutSuccess}
            onCancel={() => setIsWorkoutModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280'
  },
  addWorkoutButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  addWorkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  }
});