import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WeightEntry, WeightAnalysis } from '../types';
import { weightTrackingService } from '../services/firebase/services/WeightTrackingService';
import { useAuthStore } from '../stores/authStore';
import { WeightEntryForm } from '../components/health/WeightEntryForm';
import { WeightAnalysisDisplay } from '../components/health/WeightAnalysisDisplay';
import { WeightTrendChart } from '../components/health/WeightTrendChart';

export const WeightTrackingScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [analysis, setAnalysis] = useState<WeightAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'lbs'>('kg');
  const [selectedView, setSelectedView] = useState<'analysis' | 'chart' | 'history'>('analysis');

  // Load weight data on screen focus
  useFocusEffect(
    useCallback(() => {
      loadWeightData();
    }, [user])
  );

  // Set initial unit preference from user profile
  useEffect(() => {
    if (user?.preferences?.units?.weight) {
      setSelectedUnit(user.preferences.units.weight);
    }
  }, [user]);

  const loadWeightData = async () => {
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Load weight history and analysis in parallel
      const [historyResult, analysisResult] = await Promise.all([
        weightTrackingService.getWeightHistory(user.id, 90),
        weightTrackingService.analyzeWeightProgress(user.id)
      ]);

      if (historyResult.success) {
        setWeightHistory(historyResult.data || []);
      } else {
        console.warn('Failed to load weight history:', historyResult.message);
      }

      if (analysisResult.success) {
        setAnalysis(analysisResult.data || null);
      } else {
        console.warn('Failed to load weight analysis:', analysisResult.message);
        // Don't show error for analysis if there's no data
        if (analysisResult.error !== 'NO_WEIGHT_DATA') {
          setError(analysisResult.message || 'Failed to load weight analysis');
        }
      }
    } catch (error: any) {
      console.error('Error loading weight data:', error);
      setError('Failed to load weight data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWeightData();
  };

  const handleAddWeight = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleEntrySuccess = (entry: WeightEntry) => {
    setShowEntryForm(false);
    setEditingEntry(null);

    // Refresh data to show updated information
    loadWeightData();

    // Show success message
    Alert.alert(
      'Success',
      editingEntry ? 'Weight entry updated successfully!' : 'Weight logged successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteEntry = (entry: WeightEntry) => {
    Alert.alert(
      'Delete Weight Entry',
      `Are you sure you want to delete the weight entry from ${entry.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await weightTrackingService.deleteWeightEntry(entry.id);
              if (result.success) {
                loadWeightData();
                Alert.alert('Success', 'Weight entry deleted successfully');
              } else {
                Alert.alert('Error', result.message || 'Failed to delete weight entry');
              }
            } catch (error: any) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Start Tracking Your Weight</Text>
      <Text style={styles.emptyText}>
        Log your first weight entry to see your progress, trends, and BMI calculation.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddWeight}>
        <Text style={styles.emptyButtonText}>📊 Log First Weight</Text>
      </TouchableOpacity>
    </View>
  );

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'analysis', label: 'Analysis', icon: '📊' },
        { key: 'chart', label: 'Chart', icon: '📈' },
        { key: 'history', label: 'History', icon: '📋' }
      ].map(({ key, label, icon }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.viewButton,
            selectedView === key && styles.viewButtonActive
          ]}
          onPress={() => setSelectedView(key as any)}
        >
          <Text style={[
            styles.viewButtonText,
            selectedView === key && styles.viewButtonTextActive
          ]}>
            {icon} {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUnitSelector = () => (
    <View style={styles.unitSelector}>
      <TouchableOpacity
        style={[
          styles.unitButton,
          selectedUnit === 'kg' && styles.unitButtonActive
        ]}
        onPress={() => setSelectedUnit('kg')}
      >
        <Text style={[
          styles.unitButtonText,
          selectedUnit === 'kg' && styles.unitButtonTextActive
        ]}>
          kg
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.unitButton,
          selectedUnit === 'lbs' && styles.unitButtonActive
        ]}
        onPress={() => setSelectedUnit('lbs')}
      >
        <Text style={[
          styles.unitButtonText,
          selectedUnit === 'lbs' && styles.unitButtonTextActive
        ]}>
          lbs
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryView = () => (
    <View style={styles.historyContainer}>
      {weightHistory.map((entry, index) => (
        <TouchableOpacity
          key={entry.id}
          style={styles.historyItem}
          onPress={() => handleEditEntry(entry)}
          onLongPress={() => handleDeleteEntry(entry)}
        >
          <View style={styles.historyItemContent}>
            <Text style={styles.historyWeight}>
              {weightTrackingService.formatWeight(entry.weight, selectedUnit)}
            </Text>
            <Text style={styles.historyDate}>{entry.date}</Text>
            {entry.notes && (
              <Text style={styles.historyNotes} numberOfLines={1}>
                "{entry.notes}"
              </Text>
            )}
          </View>
          <View style={styles.historyActions}>
            {entry.bmi && (
              <Text style={styles.historyBMI}>BMI: {entry.bmi}</Text>
            )}
            <Text style={styles.historyChevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading weight data...</Text>
      </View>
    );
  }

  if (error && weightHistory.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeightData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weight Tracking</Text>
        <View style={styles.headerActions}>
          {renderUnitSelector()}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddWeight}
            accessibilityLabel="Add weight entry"
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {weightHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderViewSelector()}

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#10B981']}
              />
            }
          >
            {selectedView === 'analysis' && analysis && (
              <WeightAnalysisDisplay
                analysis={analysis}
                unit={selectedUnit}
                onEditEntry={handleEditEntry}
                onViewHistory={() => setSelectedView('history')}
              />
            )}

            {selectedView === 'chart' && weightHistory.length > 1 && (
              <WeightTrendChart
                entries={weightHistory}
                unit={selectedUnit}
                height={250}
              />
            )}

            {selectedView === 'history' && renderHistoryView()}

            {selectedView === 'analysis' && !analysis && (
              <View style={styles.noAnalysisContainer}>
                <Text style={styles.noAnalysisText}>
                  Add more weight entries to see detailed analysis and trends.
                </Text>
              </View>
            )}

            {selectedView === 'chart' && weightHistory.length <= 1 && (
              <View style={styles.noChartContainer}>
                <Text style={styles.noChartText}>
                  Add more weight entries to see your weight trend chart.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Weight Entry Modal */}
      <Modal
        visible={showEntryForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WeightEntryForm
          existingEntry={editingEntry || undefined}
          onSuccess={handleEntrySuccess}
          onCancel={() => {
            setShowEntryForm(false);
            setEditingEntry(null);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#10B981',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#10B981',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  viewButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItemContent: {
    flex: 1,
  },
  historyWeight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  historyNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  historyActions: {
    alignItems: 'flex-end',
  },
  historyBMI: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  historyChevron: {
    fontSize: 18,
    color: '#D1D5DB',
  },
  noAnalysisContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noAnalysisText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  noChartContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noChartText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});