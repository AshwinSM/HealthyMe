import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { DailyActivitySummary, WorkoutEntry } from '../../types/health';

interface ActivitySummaryProps {
  date: string;
  summary: DailyActivitySummary;
  onEditSteps?: () => void;
  onAddWorkout?: () => void;
}

export const ActivitySummaryDashboard: React.FC<ActivitySummaryProps> = ({
  date,
  summary,
  onEditSteps,
  onAddWorkout
}) => {
  const getActivityScoreColor = (score: number): string => {
    if (score < 30) return '#EF4444';    // Red
    if (score < 60) return '#F59E0B';    // Orange
    if (score < 80) return '#3B82F6';    // Blue
    return '#10B981';                    // Green
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Today's Activity</Text>

      {/* Activity Score Circle */}
      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.scoreCircle,
            { borderColor: getActivityScoreColor(summary.combined.activityScore) }
          ]}
        >
          <Text style={styles.scoreValue}>{summary.combined.activityScore}</Text>
          <Text style={styles.scoreLabel}>Activity Score</Text>
        </View>
      </View>

      {/* Steps Section */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={styles.metricTitleRow}>
            <Text style={styles.metricIcon}>👟</Text>
            <Text style={styles.metricTitle}>Steps</Text>
          </View>

          {onEditSteps && (
            <TouchableOpacity style={styles.editMetricButton} onPress={onEditSteps}>
              <Text style={styles.editMetricButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.metricValue}>
          {summary.steps.total.toLocaleString()}
        </Text>

        <Text style={styles.metricSubtext}>
          Goal: {summary.goals.stepsGoal.toLocaleString()} •
          {summary.steps.goalAchieved ? ' 🎉 Achieved!' :
           ` ${(summary.goals.stepsGoal - summary.steps.total).toLocaleString()} remaining`}
        </Text>

        <Text style={styles.metricCalories}>
          🔥 {summary.steps.caloriesBurned} cal from steps
        </Text>
      </View>

      {/* Workouts Section */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={styles.metricTitleRow}>
            <Text style={styles.metricIcon}>💪</Text>
            <Text style={styles.metricTitle}>Workouts</Text>
          </View>

          {onAddWorkout && (
            <TouchableOpacity style={styles.addMetricButton} onPress={onAddWorkout}>
              <Text style={styles.addMetricButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {summary.workouts.sessions.length > 0 ? (
          <>
            <Text style={styles.metricValue}>
              {summary.workouts.sessions.length}
            </Text>

            <Text style={styles.metricSubtext}>
              {formatDuration(summary.workouts.totalDuration)} •
              {summary.workouts.activeMinutes} active minutes
            </Text>

            <Text style={styles.metricCalories}>
              🔥 {summary.workouts.totalCaloriesBurned} cal from workouts
            </Text>

            {/* Workout List */}
            <View style={styles.workoutList}>
              {summary.workouts.sessions.slice(0, 2).map((workout, index) => (
                <View key={workout.id} style={styles.workoutItem}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDetails}>
                    {formatDuration(workout.duration)} • {workout.intensity} intensity
                  </Text>
                </View>
              ))}

              {summary.workouts.sessions.length > 2 && (
                <Text style={styles.moreWorkouts}>
                  +{summary.workouts.sessions.length - 2} more...
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricSubtext}>No workouts logged today</Text>
          </>
        )}
      </View>

      {/* Combined Stats */}
      <View style={styles.combinedStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.combined.totalCaloriesBurned}</Text>
          <Text style={styles.statLabel}>Total Calories Burned</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.combined.totalActiveMinutes}</Text>
          <Text style={styles.statLabel}>Active Minutes</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center'
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB'
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  metricCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metricIcon: {
    fontSize: 20
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  editMetricButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E5E7EB'
  },
  editMetricButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151'
  },
  addMetricButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#DBEAFE'
  },
  addMetricButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF'
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  metricSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8
  },
  metricCalories: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500'
  },
  workoutList: {
    marginTop: 12,
    gap: 8
  },
  workoutItem: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  workoutDetails: {
    fontSize: 12,
    color: '#6B7280'
  },
  moreWorkouts: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4
  },
  combinedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  }
});