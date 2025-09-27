import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import {
  WeightAnalysis,
  WeightEntry,
  BMICategory,
  TrendDirection
} from '../../types';
import { weightTrackingService } from '../../services/firebase/services/WeightTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';

interface WeightAnalysisDisplayProps {
  analysis: WeightAnalysis;
  unit: 'kg' | 'lbs';
  onEditEntry?: (entry: WeightEntry) => void;
  onViewHistory?: () => void;
}

export const WeightAnalysisDisplay: React.FC<WeightAnalysisDisplayProps> = ({
  analysis,
  unit,
  onEditEntry,
  onViewHistory
}) => {
  const formatWeight = (weightKg: number) => {
    return weightTrackingService.formatWeight(weightKg, unit);
  };

  const formatWeightChange = (changeKg: number) => {
    return weightTrackingService.formatWeightChange(changeKg, unit);
  };

  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'increasing': return '#EF4444'; // Red
      case 'decreasing': return '#10B981'; // Green
      default: return '#6B7280'; // Gray
    }
  };

  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };

  const getBMIColor = (category?: BMICategory) => {
    if (!category) return '#6B7280';
    return weightTrackingService.getBMIColor(category);
  };

  const getBMILabel = (category?: BMICategory) => {
    if (!category) return 'Unknown';
    return weightTrackingService.getBMILabel(category);
  };

  const getTrendDescription = (trend: WeightAnalysis['trend']) => {
    const { direction, strength, confidenceLevel } = trend;

    if (direction === 'stable') {
      return 'Your weight has been stable recently';
    }

    const directionText = direction === 'increasing' ? 'gaining' : 'losing';
    const strengthText = strength === 'strong' ? 'consistently' :
                        strength === 'moderate' ? 'moderately' : 'slightly';
    const confidenceText = confidenceLevel > 0.7 ? 'clear' :
                          confidenceLevel > 0.4 ? 'emerging' : 'early';

    return `You are ${strengthText} ${directionText} weight - ${confidenceText} trend (${Math.round(confidenceLevel * 100)}% confidence)`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Weight Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current Weight</Text>
          {onEditEntry && (
            <TouchableOpacity
              onPress={() => onEditEntry(analysis.currentEntry)}
              style={styles.editButton}
              accessibilityLabel="Edit weight entry"
              accessibilityRole="button"
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.currentWeightValue}>
          {formatWeight(analysis.currentEntry.weight)}
        </Text>

        <Text style={styles.currentWeightDate}>
          {DateNavigationUtils.formatDisplayDate(analysis.currentEntry.date)}
        </Text>

        {analysis.currentEntry.notes && (
          <Text style={styles.weightNotes}>
            "{analysis.currentEntry.notes}"
          </Text>
        )}
      </View>

      {/* BMI Card */}
      {analysis.currentEntry.bmi && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Body Mass Index</Text>
          <View style={styles.bmiContainer}>
            <Text style={styles.bmiValue}>
              {analysis.currentEntry.bmi}
            </Text>
            <Text
              style={[
                styles.bmiCategory,
                { color: getBMIColor(analysis.currentEntry.bmiCategory) }
              ]}
            >
              {getBMILabel(analysis.currentEntry.bmiCategory)}
            </Text>
          </View>

          <View style={styles.bmiBars}>
            {['underweight', 'normal', 'overweight', 'obese_class_1'].map((category, index) => (
              <View
                key={category}
                style={[
                  styles.bmiBar,
                  {
                    backgroundColor: analysis.currentEntry.bmiCategory === category
                      ? getBMIColor(category as BMICategory)
                      : '#E5E7EB'
                  }
                ]}
              />
            ))}
          </View>

          <Text style={styles.bmiNote}>
            BMI is a general indicator. Consult healthcare providers for personalized advice.
          </Text>
        </View>
      )}

      {/* Weight Change Card */}
      {analysis.previousEntry && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change from Previous Entry</Text>

          <View style={styles.changeContainer}>
            <View style={styles.changeRow}>
              <Text
                style={[
                  styles.changeValue,
                  { color: getTrendColor(analysis.changeFromPrevious.direction) }
                ]}
              >
                {getTrendIcon(analysis.changeFromPrevious.direction)}
                {formatWeightChange(analysis.changeFromPrevious.absolute)}
              </Text>

              <Text style={styles.changePercentage}>
                ({analysis.changeFromPrevious.percentage > 0 ? '+' : ''}
                {analysis.changeFromPrevious.percentage.toFixed(1)}%)
              </Text>
            </View>

            <Text style={styles.changeDays}>
              {analysis.changeFromPrevious.daysSincePrevious} day
              {analysis.changeFromPrevious.daysSincePrevious !== 1 ? 's' : ''} ago
            </Text>

            <Text style={styles.previousWeight}>
              Previous: {formatWeight(analysis.previousEntry.weight)} on{' '}
              {DateNavigationUtils.formatDisplayDate(analysis.previousEntry.date)}
            </Text>
          </View>
        </View>
      )}

      {/* Averages Card */}
      {(analysis.weeklyAverage || analysis.monthlyAverage) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Averages</Text>

          {analysis.weeklyAverage && (
            <View style={styles.averageRow}>
              <Text style={styles.averageLabel}>Weekly Average:</Text>
              <Text style={styles.averageValue}>
                {formatWeight(analysis.weeklyAverage)}
              </Text>
            </View>
          )}

          {analysis.monthlyAverage && (
            <View style={styles.averageRow}>
              <Text style={styles.averageLabel}>Monthly Average:</Text>
              <Text style={styles.averageValue}>
                {formatWeight(analysis.monthlyAverage)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Goal Progress Card */}
      {analysis.goalProgress && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal Progress</Text>

          <View style={styles.goalContainer}>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Target:</Text>
              <Text style={styles.goalValue}>
                {formatWeight(analysis.goalProgress.targetWeight)}
              </Text>
            </View>

            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Progress:</Text>
              <Text style={[
                styles.goalValue,
                { color: analysis.goalProgress.isOnTrack ? '#10B981' : '#F59E0B' }
              ]}>
                {analysis.goalProgress.currentProgress.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(analysis.goalProgress.currentProgress, 100)}%`,
                    backgroundColor: analysis.goalProgress.isOnTrack ? '#10B981' : '#F59E0B'
                  }
                ]}
              />
            </View>

            <Text style={[
              styles.goalStatus,
              { color: analysis.goalProgress.isOnTrack ? '#10B981' : '#F59E0B' }
            ]}>
              {analysis.goalProgress.isOnTrack ? '✓ On Track' : '⚠ Behind Schedule'}
            </Text>

            {analysis.goalProgress.estimatedDaysToGoal && (
              <Text style={styles.goalEstimate}>
                Estimated time to goal: {analysis.goalProgress.estimatedDaysToGoal} days
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Trend Analysis Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trend Analysis</Text>

        <View style={styles.trendContainer}>
          <View style={styles.trendRow}>
            <Text
              style={[
                styles.trendDirection,
                { color: getTrendColor(analysis.trend.direction) }
              ]}
            >
              {getTrendIcon(analysis.trend.direction)} {analysis.trend.direction.charAt(0).toUpperCase() + analysis.trend.direction.slice(1)}
            </Text>

            <Text style={styles.trendStrength}>
              ({analysis.trend.strength} trend)
            </Text>
          </View>

          <Text style={styles.trendDescription}>
            {getTrendDescription(analysis.trend)}
          </Text>

          <View style={styles.trendConfidenceContainer}>
            <Text style={styles.trendConfidenceLabel}>Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${analysis.trend.confidenceLevel * 100}%`,
                    backgroundColor: analysis.trend.confidenceLevel > 0.7 ? '#10B981' :
                                   analysis.trend.confidenceLevel > 0.4 ? '#F59E0B' : '#EF4444'
                  }
                ]}
              />
            </View>
            <Text style={styles.trendConfidenceValue}>
              {Math.round(analysis.trend.confidenceLevel * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {onViewHistory && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewHistory}
            accessibilityLabel="View weight history"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>📊 View History</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          accessibilityLabel="Share weight progress"
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>📤 Share Progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  card: {
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
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  currentWeightValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentWeightDate: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  weightNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
  },
  bmiContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  bmiBars: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    gap: 2,
  },
  bmiBar: {
    flex: 1,
    borderRadius: 2,
  },
  bmiNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  changeContainer: {
    alignItems: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  changeValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  changePercentage: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  changeDays: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previousWeight: {
    fontSize: 14,
    color: '#6B7280',
  },
  averageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  averageLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  averageValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  goalContainer: {
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalEstimate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  trendContainer: {
    gap: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendDirection: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trendStrength: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  trendDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  trendConfidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendConfidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendConfidenceValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});