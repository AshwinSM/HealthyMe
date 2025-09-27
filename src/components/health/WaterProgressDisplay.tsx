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
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import {
  WaterAnalysis,
  WaterEntry,
  WaterUnit,
  WaterQuickAdd
} from '../../types/health';
import { waterTrackingService } from '../../services/firebase/services/WaterTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';

interface WaterProgressDisplayProps {
  analysis: WaterAnalysis;
  unit: WaterUnit;
  onAddWater?: () => void;
  onEditEntry?: (entry: WaterEntry) => void;
  onQuickAdd?: (amount: number, unit: WaterUnit) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const WaterProgressDisplay: React.FC<WaterProgressDisplayProps> = ({
  analysis,
  unit,
  onAddWater,
  onEditEntry,
  onQuickAdd
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedWave = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(1)).current;

  const quickAddOptions = waterTrackingService.getQuickAddOptions(unit);

  // Animate progress when analysis changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(analysis.percentageAchieved / 100, 1),
      duration: 1000,
      useNativeDriver: false
    }).start();

    // Celebration animation when goal is achieved
    if (analysis.goalAchieved) {
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
  }, [analysis.percentageAchieved, analysis.goalAchieved]);

  // Continuous wave animation
  useEffect(() => {
    const waveAnimation = Animated.loop(
      Animated.timing(animatedWave, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false
      })
    );
    waveAnimation.start();

    return () => waveAnimation.stop();
  }, []);

  const formatWaterAmount = (amountMl: number) => {
    return waterTrackingService.formatWaterAmount(amountMl, unit);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981'; // Green - goal achieved
    if (percentage >= 75) return '#3B82F6'; // Blue - close to goal
    if (percentage >= 50) return '#06B6D4'; // Cyan - halfway
    if (percentage >= 25) return '#8B5CF6'; // Purple - getting started
    return '#E5E7EB'; // Gray - just started
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return '#F59E0B'; // Gold - weekly streak
    if (streak >= 3) return '#10B981'; // Green - good streak
    if (streak >= 1) return '#3B82F6'; // Blue - started
    return '#6B7280'; // Gray - no streak
  };

  const CircularProgress: React.FC<{
    percentage: number;
    size: number;
    strokeWidth: number;
  }> = ({ percentage, size, strokeWidth }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;

    return (
      <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
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
            {animatedProgress && (
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getProgressColor(percentage)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [strokeDasharray, 0]
                })}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </Animated.View>

          {/* Percentage text */}
          <SvgText
            x={size / 2}
            y={size / 2 - 10}
            fontSize="24"
            fontWeight="bold"
            fill="#111827"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {Math.round(percentage)}%
          </SvgText>

          {/* Status text */}
          <SvgText
            x={size / 2}
            y={size / 2 + 15}
            fontSize="12"
            fill="#6B7280"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {percentage >= 100 ? 'Goal Achieved!' : 'of daily goal'}
          </SvgText>
        </Svg>
      </Animated.View>
    );
  };

  // Animated Circle component
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const WaterBottleVisualization: React.FC<{ percentage: number }> = ({ percentage }) => {
    const bottleHeight = 120;
    const bottleWidth = 60;
    const waterHeight = (percentage / 100) * (bottleHeight - 20);

    return (
      <View style={styles.bottleContainer}>
        <Svg width={bottleWidth + 20} height={bottleHeight + 20}>
          {/* Bottle outline */}
          <Path
            d={`M${bottleWidth * 0.3} 10
               L${bottleWidth * 0.7} 10
               L${bottleWidth * 0.7} 20
               L${bottleWidth * 0.9} 25
               L${bottleWidth * 0.9} ${bottleHeight - 5}
               Q${bottleWidth * 0.9} ${bottleHeight} ${bottleWidth * 0.8} ${bottleHeight}
               L${bottleWidth * 0.2} ${bottleHeight}
               Q${bottleWidth * 0.1} ${bottleHeight} ${bottleWidth * 0.1} ${bottleHeight - 5}
               L${bottleWidth * 0.1} 25
               L${bottleWidth * 0.3} 20
               Z`}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="2"
          />

          {/* Water fill */}
          <Animated.View>
            <Path
              d={`M${bottleWidth * 0.15} ${bottleHeight - 5 - waterHeight}
                 L${bottleWidth * 0.85} ${bottleHeight - 5 - waterHeight}
                 L${bottleWidth * 0.85} ${bottleHeight - 5}
                 Q${bottleWidth * 0.85} ${bottleHeight} ${bottleWidth * 0.8} ${bottleHeight}
                 L${bottleWidth * 0.2} ${bottleHeight}
                 Q${bottleWidth * 0.15} ${bottleHeight} ${bottleWidth * 0.15} ${bottleHeight - 5}
                 Z`}
              fill={getProgressColor(percentage)}
              opacity={0.8}
            />
          </Animated.View>

          {/* Water surface animation */}
          <Animated.View>
            <Path
              d={animatedWave.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  `M${bottleWidth * 0.15} ${bottleHeight - 5 - waterHeight}
                   Q${bottleWidth * 0.35} ${bottleHeight - 5 - waterHeight - 2}
                   ${bottleWidth * 0.5} ${bottleHeight - 5 - waterHeight}
                   Q${bottleWidth * 0.65} ${bottleHeight - 5 - waterHeight + 2}
                   ${bottleWidth * 0.85} ${bottleHeight - 5 - waterHeight}`,
                  `M${bottleWidth * 0.15} ${bottleHeight - 5 - waterHeight}
                   Q${bottleWidth * 0.35} ${bottleHeight - 5 - waterHeight + 2}
                   ${bottleWidth * 0.5} ${bottleHeight - 5 - waterHeight}
                   Q${bottleWidth * 0.65} ${bottleHeight - 5 - waterHeight - 2}
                   ${bottleWidth * 0.85} ${bottleHeight - 5 - waterHeight}`
                ]
              })}
              fill="none"
              stroke={getProgressColor(percentage)}
              strokeWidth="2"
            />
          </Animated.View>
        </Svg>

        {/* Drop animation when goal achieved */}
        {analysis.goalAchieved && (
          <View style={styles.dropAnimation}>
            <Text style={styles.dropEmoji}>💧</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Main Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Daily Hydration</Text>
          <Text style={styles.progressDate}>
            {DateNavigationUtils.formatDisplayDate(analysis.date)}
          </Text>
        </View>

        <View style={styles.progressContent}>
          {/* Circular Progress */}
          <View style={styles.circularProgressContainer}>
            <CircularProgress
              percentage={analysis.percentageAchieved}
              size={160}
              strokeWidth={12}
            />
          </View>

          {/* Water Bottle Visualization */}
          <WaterBottleVisualization percentage={analysis.percentageAchieved} />
        </View>

        {/* Progress Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatWaterAmount(analysis.totalConsumed)}
            </Text>
            <Text style={styles.statLabel}>Consumed</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatWaterAmount(analysis.goal)}
            </Text>
            <Text style={styles.statLabel}>Daily Goal</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: analysis.remaining > 0 ? '#F59E0B' : '#10B981' }
            ]}>
              {analysis.remaining > 0
                ? formatWaterAmount(analysis.remaining)
                : 'Goal Achieved!'
              }
            </Text>
            <Text style={styles.statLabel}>
              {analysis.remaining > 0 ? 'Remaining' : 'Status'}
            </Text>
          </View>
        </View>

        {/* Streak Information */}
        {analysis.streak.current > 0 && (
          <View style={styles.streakContainer}>
            <Text style={[styles.streakText, { color: getStreakColor(analysis.streak.current) }]}>
              🔥 {analysis.streak.current} day streak
            </Text>
            {analysis.streak.longest > analysis.streak.current && (
              <Text style={styles.streakSubtext}>
                Best: {analysis.streak.longest} days
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Quick Add Section */}
      <View style={styles.quickAddCard}>
        <Text style={styles.quickAddTitle}>Quick Add</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickAddOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAddButton}
              onPress={() => onQuickAdd?.(option.amount, unit)}
              accessibilityLabel={`Quick add ${option.label}`}
              accessibilityRole="button"
            >
              <Text style={styles.quickAddIcon}>{option.icon}</Text>
              <Text style={styles.quickAddLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Entries */}
      {analysis.entries.length > 0 && (
        <View style={styles.entriesCard}>
          <Text style={styles.entriesTitle}>
            Today's Entries ({analysis.entriesCount})
          </Text>

          {analysis.entries.slice(0, 5).map((entry, index) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryItem}
              onPress={() => onEditEntry?.(entry)}
            >
              <View style={styles.entryContent}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryAmount}>
                    {formatWaterAmount(entry.amount)}
                  </Text>
                  <Text style={styles.entryTime}>
                    {entry.timestamp.toDate().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                </View>

                <View style={styles.entryMeta}>
                  {entry.source && entry.source !== 'water' && (
                    <Text style={styles.entrySource}>
                      {entry.source === 'coffee' ? '☕' :
                       entry.source === 'tea' ? '🍵' :
                       entry.source === 'juice' ? '🧃' : '🥤'}
                    </Text>
                  )}
                  <Text style={styles.entryChevron}>›</Text>
                </View>
              </View>

              {entry.notes && (
                <Text style={styles.entryNotes} numberOfLines={1}>
                  "{entry.notes}"
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {analysis.entries.length > 5 && (
            <Text style={styles.moreEntriesText}>
              +{analysis.entries.length - 5} more entries
            </Text>
          )}
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddWater}
          accessibilityLabel="Add water entry"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>💧 Log Water</Text>
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
  progressCard: {
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
  progressHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  bottleContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  dropAnimation: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  dropEmoji: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  streakContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickAddCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickAddButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 80,
  },
  quickAddIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  entriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  entryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryInfo: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entrySource: {
    fontSize: 16,
  },
  entryChevron: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  entryNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  moreEntriesText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingTop: 8,
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});