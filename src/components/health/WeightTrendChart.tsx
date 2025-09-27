import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { WeightEntry } from '../../types';
import { weightTrackingService } from '../../services/firebase/services/WeightTrackingService';
import { DateNavigationUtils } from '../../utils/dateNavigationUtils';

interface WeightTrendChartProps {
  entries: WeightEntry[];
  unit: 'kg' | 'lbs';
  height?: number;
  goalWeight?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  entries,
  unit,
  height = 200,
  goalWeight
}) => {
  const chartData = useMemo(() => {
    if (entries.length === 0) return null;

    // Sort entries by date (oldest first for chart)
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Convert weights to display unit
    const weights = sortedEntries.map(entry =>
      unit === 'kg' ? entry.weight : entry.weight * 2.20462
    );

    // Calculate chart dimensions
    const chartWidth = screenWidth - 40; // Account for padding
    const chartHeight = height - 60; // Account for labels and padding
    const padding = 20;

    // Find min and max weights for scaling
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight;

    // Add some padding to the range
    const paddedMin = minWeight - (weightRange * 0.1);
    const paddedMax = maxWeight + (weightRange * 0.1);
    const paddedRange = paddedMax - paddedMin;

    // Calculate points for the line chart
    const points = sortedEntries.map((entry, index) => {
      const x = padding + (index / (sortedEntries.length - 1)) * (chartWidth - 2 * padding);
      const weight = unit === 'kg' ? entry.weight : entry.weight * 2.20462;
      const y = chartHeight - padding - ((weight - paddedMin) / paddedRange) * (chartHeight - 2 * padding);

      return {
        x,
        y,
        weight,
        date: entry.date,
        entry
      };
    });

    // Create SVG path string
    const pathData = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    // Calculate goal line position if provided
    let goalY: number | undefined;
    if (goalWeight) {
      const goalWeightInUnit = unit === 'kg' ? goalWeight : goalWeight * 2.20462;
      if (goalWeightInUnit >= paddedMin && goalWeightInUnit <= paddedMax) {
        goalY = chartHeight - padding - ((goalWeightInUnit - paddedMin) / paddedRange) * (chartHeight - 2 * padding);
      }
    }

    return {
      points,
      pathData,
      chartWidth,
      chartHeight,
      padding,
      minWeight: paddedMin,
      maxWeight: paddedMax,
      goalY,
      goalWeight: goalWeight ? (unit === 'kg' ? goalWeight : goalWeight * 2.20462) : undefined
    };
  }, [entries, unit, height, goalWeight]);

  if (!chartData || entries.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No weight data to display</Text>
      </View>
    );
  }

  const { points, pathData, chartWidth, chartHeight, padding, minWeight, maxWeight, goalY, goalWeight: goalWeightInUnit } = chartData;

  // Generate Y-axis labels
  const yAxisLabels = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    const weight = minWeight + (maxWeight - minWeight) * (i / (labelCount - 1));
    const y = chartHeight - padding - (i / (labelCount - 1)) * (chartHeight - 2 * padding);
    yAxisLabels.push({
      weight: Math.round(weight * 10) / 10,
      y
    });
  }

  // Generate X-axis labels (dates)
  const xAxisLabels = [];
  const maxLabels = 4;
  const labelInterval = Math.max(1, Math.floor(points.length / maxLabels));

  for (let i = 0; i < points.length; i += labelInterval) {
    const point = points[i];
    xAxisLabels.push({
      x: point.x,
      date: point.date,
      formattedDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    });
  }

  // Add the last point if it's not already included
  if (points.length > 1 && (points.length - 1) % labelInterval !== 0) {
    const lastPoint = points[points.length - 1];
    xAxisLabels.push({
      x: lastPoint.x,
      date: lastPoint.date,
      formattedDate: new Date(lastPoint.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    });
  }

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>Weight Trend ({unit})</Text>

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        {/* Grid lines */}
        {yAxisLabels.map((label, index) => (
          <Line
            key={`grid-${index}`}
            x1={padding}
            y1={label.y}
            x2={chartWidth - padding}
            y2={label.y}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Goal line */}
        {goalY && goalWeightInUnit && (
          <Line
            x1={padding}
            y1={goalY}
            x2={chartWidth - padding}
            y2={goalY}
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}

        {/* Weight trend line */}
        <Path
          d={pathData}
          stroke="#10B981"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => (
          <SvgText
            key={`y-label-${index}`}
            x={padding - 5}
            y={label.y + 3}
            fontSize="12"
            fill="#6B7280"
            textAnchor="end"
          >
            {label.weight}
          </SvgText>
        ))}

        {/* Goal weight label */}
        {goalY && goalWeightInUnit && (
          <SvgText
            x={chartWidth - padding + 5}
            y={goalY + 3}
            fontSize="10"
            fill="#F59E0B"
            textAnchor="start"
          >
            Goal: {Math.round(goalWeightInUnit * 10) / 10}
          </SvgText>
        )}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisContainer}>
        {xAxisLabels.map((label, index) => (
          <Text
            key={`x-label-${index}`}
            style={[
              styles.xAxisLabel,
              { left: label.x - 30 } // Center the label
            ]}
          >
            {label.formattedDate}
          </Text>
        ))}
      </View>

      {/* Chart legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Weight Trend</Text>
        </View>
        {goalWeightInUnit && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { borderColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Goal Weight</Text>
          </View>
        )}
      </View>

      {/* Chart summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Range:</Text>
          <Text style={styles.summaryValue}>
            {weightTrackingService.formatWeight(Math.min(...entries.map(e => e.weight)), unit)} - {weightTrackingService.formatWeight(Math.max(...entries.map(e => e.weight)), unit)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Period:</Text>
          <Text style={styles.summaryValue}>
            {entries.length} entries over {DateNavigationUtils.getDaysBetween(entries[entries.length - 1]?.date || entries[0].date, entries[0].date)} days
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  chart: {
    alignSelf: 'center',
  },
  xAxisContainer: {
    height: 30,
    position: 'relative',
    marginTop: 8,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    width: 60,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  legendLine: {
    width: 12,
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  summary: {
    marginTop: 12,
    gap: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 60,
  },
});