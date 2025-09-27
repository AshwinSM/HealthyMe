import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import {
  ActivityAnalysis,
  StepsEntry,
  WorkoutEntry,
  WorkoutType
} from '../../types/health';
import { activityTrackingService } from '../../services/firebase/services/ActivityTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';

interface ActivityProgressDisplayProps {
  analysis: ActivityAnalysis;
  onAddSteps?: () => void;
  onAddWorkout?: () => void;
  onEditSteps?: (entry: StepsEntry) => void;
  onEditWorkout?: (entry: WorkoutEntry) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ActivityProgressDisplay: React.FC<ActivityProgressDisplayProps> = ({
  analysis,
  onAddSteps,
  onAddWorkout,
  onEditSteps,
  onEditWorkout
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(1)).current;

  // Animate progress when analysis changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(analysis.stepsProgress / 100, 1),
      duration: 1000,
      useNativeDriver: false
    }).start();

    // Celebration animation when goal is achieved
    if (analysis.stepsGoalAchieved) {
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [analysis.stepsProgress, analysis.stepsGoalAchieved]);

  const getActivityScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green - excellent
    if (score >= 60) return '#3B82F6'; // Blue - good
    if (score >= 40) return '#F59E0B'; // Yellow - moderate
    return '#EF4444'; // Red - low
  };

  const getWorkoutTypeIcon = (type: WorkoutType) => {
    const typeInfo = activityTrackingService.getWorkoutTypeInfo(type);
    return typeInfo?.icon || '🏃‍♂️';
  };

  const CircularProgress: React.FC<{
    percentage: number;
    size: number;
    strokeWidth: number;
    color: string;
    label: string;
  }> = ({ percentage, size, strokeWidth, color, label }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <View style={styles.circularProgressContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <Animated.View>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [circumference, 0]
              })}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Animated.View>

          {/* Percentage text */}
          <SvgText
            x={size / 2}
            y={size / 2 - 5}
            fontSize="18"
            fontWeight="bold"
            fill="#111827"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {Math.round(percentage)}%
          </SvgText>

          {/* Label text */}
          <SvgText
            x={size / 2}
            y={size / 2 + 15}
            fontSize="10"
            fill="#6B7280"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {label}
          </SvgText>
        </Svg>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Main Activity Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Daily Activity</Text>
          <Text style={styles.summaryDate}>
            {DateNavigationUtils.formatDisplayDate(analysis.date)}
          </Text>
        </View>

        <View style={styles.summaryContent}>
          {/* Activity Score */}
          <View style={styles.scoreContainer}>
            <Animated.View style={[styles.scoreCircle, { transform: [{ scale: animatedScale }] }]}>
              <Text style={[styles.scoreValue, { color: getActivityScoreColor(analysis.activityScore) }]}>
                {analysis.activityScore}
              </Text>
              <Text style={styles.scoreLabel}>Activity Score</Text>
            </Animated.View>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.totalSteps.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Steps</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.totalWorkoutDuration}
              </Text>
              <Text style={styles.metricLabel}>Workout Min</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.totalCaloriesBurned}
              </Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Steps Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Steps Goal</Text>
          {onEditSteps && analysis.stepsEntry && (
            <TouchableOpacity
              onPress={() => onEditSteps(analysis.stepsEntry!)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stepsContent}>
          <CircularProgress
            percentage={analysis.stepsProgress}
            size={120}
            strokeWidth={8}
            color={analysis.stepsGoalAchieved ? '#10B981' : '#3B82F6'}
            label="of goal"
          />

          <View style={styles.stepsDetails}>
            <View style={styles.stepsRow}>
              <Text style={styles.stepsMainValue}>
                {analysis.totalSteps.toLocaleString()}
              </Text>
              <Text style={styles.stepsGoalText}>
                / {analysis.stepsGoal.toLocaleString()} steps
              </Text>
            </View>

            <Text style={styles.stepsCalories}>
              {analysis.stepsCaloriesBurned} calories burned
            </Text>

            {analysis.stepsGoalAchieved && (
              <Text style={styles.goalAchievedText}>🎯 Goal Achieved!</Text>
            )}
          </View>
        </View>

        {!analysis.stepsEntry && (
          <TouchableOpacity style={styles.addStepsButton} onPress={onAddSteps}>
            <Text style={styles.addButtonText}>🚶 Log Steps</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Workouts Summary Card */}
      <View style={styles.workoutsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Workouts ({analysis.totalWorkouts})
          </Text>
          <TouchableOpacity
            style={styles.addWorkoutButton}
            onPress={onAddWorkout}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {analysis.workoutEntries.length > 0 ? (
          <>
            {/* Workout Summary */}
            <View style={styles.workoutSummary}>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>
                  {analysis.totalWorkoutDuration}
                </Text>
                <Text style={styles.workoutStatLabel}>Total Minutes</Text>
              </View>

              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>
                  {analysis.workoutCaloriesBurned}
                </Text>
                <Text style={styles.workoutStatLabel}>Calories Burned</Text>
              </View>

              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>
                  {analysis.avgWorkoutDuration}
                </Text>
                <Text style={styles.workoutStatLabel}>Avg Duration</Text>
              </View>
            </View>

            {/* Individual Workouts */}
            <View style={styles.workoutsList}>
              {analysis.workoutEntries.slice(0, 3).map((workout, index) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutItem}
                  onPress={() => onEditWorkout?.(workout)}
                >
                  <View style={styles.workoutItemContent}>
                    <Text style={styles.workoutIcon}>
                      {getWorkoutTypeIcon(workout.type)}
                    </Text>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      <Text style={styles.workoutDetails}>
                        {workout.duration} min • {workout.intensity} intensity
                      </Text>
                    </View>
                    <View style={styles.workoutMeta}>
                      <Text style={styles.workoutCalories}>
                        {workout.caloriesBurned} cal
                      </Text>
                      <Text style={styles.workoutChevron}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {analysis.workoutEntries.length > 3 && (
                <Text style={styles.moreWorkoutsText}>
                  +{analysis.workoutEntries.length - 3} more workouts
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noWorkoutsContainer}>
            <Text style={styles.noWorkoutsText}>
              No workouts logged today. Add your first workout to start tracking your fitness progress!
            </Text>
            <TouchableOpacity style={styles.firstWorkoutButton} onPress={onAddWorkout}>
              <Text style={styles.firstWorkoutButtonText}>💪 Log First Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Activity Breakdown Card */}
      {analysis.workoutEntries.length > 0 && (
        <View style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Activity Breakdown</Text>

          <View style={styles.breakdownContent}>
            {Object.entries(analysis.workoutsByType)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => (
                <View key={type} style={styles.breakdownItem}>
                  <Text style={styles.breakdownIcon}>
                    {getWorkoutTypeIcon(type as WorkoutType)}
                  </Text>
                  <Text style={styles.breakdownType}>
                    {activityTrackingService.getWorkoutTypeInfo(type as WorkoutType)?.name || type}
                  </Text>
                  <Text style={styles.breakdownCount}>
                    {count} workout{count !== 1 ? 's' : ''}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Streaks and Achievements */}
      {(analysis.streaks.stepsGoalDays > 0 || analysis.streaks.workoutDays > 0) && (
        <View style={styles.streaksCard}>
          <Text style={styles.cardTitle}>Streaks & Achievements</Text>

          <View style={styles.streaksContent}>
            {analysis.streaks.stepsGoalDays > 0 && (
              <View style={styles.streakItem}>
                <Text style={styles.streakIcon}>🎯</Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>
                    {analysis.streaks.stepsGoalDays} day{analysis.streaks.stepsGoalDays !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.streakLabel}>Steps Goal Streak</Text>
                </View>
              </View>
            )}

            {analysis.streaks.workoutDays > 0 && (
              <View style={styles.streakItem}>
                <Text style={styles.streakIcon}>💪</Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>
                    {analysis.streaks.workoutDays} day{analysis.streaks.workoutDays !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.streakLabel}>Workout Streak</Text>
                </View>
              </View>
            )}

            {analysis.streaks.activeMinutesDays > 0 && (
              <View style={styles.streakItem}>
                <Text style={styles.streakIcon}>⏱️</Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>
                    {analysis.streaks.activeMinutesDays} day{analysis.streaks.activeMinutesDays !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.streakLabel}>Active Minutes Streak</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  metricsContainer: {
    flex: 1,
    marginLeft: 20,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  stepsDetails: {
    flex: 1,
    marginLeft: 20,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  stepsMainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepsGoalText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  stepsCalories: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  goalAchievedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  addStepsButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addWorkoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  workoutSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  workoutsList: {
    gap: 12,
  },
  workoutItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  workoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  workoutMeta: {
    alignItems: 'flex-end',
  },
  workoutCalories: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 2,
  },
  workoutChevron: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  moreWorkoutsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noWorkoutsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noWorkoutsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  firstWorkoutButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  firstWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownContent: {
    gap: 12,
    marginTop: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  breakdownType: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  breakdownCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  streaksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streaksContent: {
    gap: 16,
    marginTop: 12,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});