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
  Alert,
  Vibration
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  WaterEntry,
  WaterAnalysis,
  WaterUnit,
  WaterGoal
} from '../types/health';
import { waterTrackingService } from '../services/firebase/services/WaterTrackingService';
import { useAuthStore } from '../stores/authStore';
import { WaterIntakeForm } from '../components/health/WaterIntakeForm';
import { WaterProgressDisplay } from '../components/health/WaterProgressDisplay';
import { DateNavigationUtils } from '../utils/dateNavigationUtils';

export const WaterTrackingScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [waterAnalysis, setWaterAnalysis] = useState<WaterAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaterEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<WaterUnit>('ml');
  const [selectedDate, setSelectedDate] = useState(DateNavigationUtils.getTodayString());
  const [waterGoal, setWaterGoal] = useState<number>(2000); // Default 2L in ml

  // Load water data on screen focus
  useFocusEffect(
    useCallback(() => {
      loadWaterData();
    }, [user, selectedDate])
  );

  // Set initial unit preference from user profile
  useEffect(() => {
    if (user?.preferences?.units?.water) {
      setSelectedUnit(user.preferences.units.water as WaterUnit);
    }
  }, [user]);

  // Set water goal from user profile or default
  useEffect(() => {
    if (user?.dailyWaterGoal) {
      setWaterGoal(user.dailyWaterGoal);
    } else {
      setWaterGoal(waterTrackingService.getDefaultWaterGoal('ml'));
    }
  }, [user]);

  const loadWaterData = async () => {
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Load water analysis for selected date
      const analysisResult = await waterTrackingService.analyzeWaterIntake(
        user.id,
        selectedDate,
        waterGoal
      );

      if (analysisResult.success) {
        setWaterAnalysis(analysisResult.data || null);
      } else {
        console.warn('Failed to load water analysis:', analysisResult.message);
        // Don't show error for analysis if there's no data
        if (analysisResult.error !== 'NO_WATER_DATA') {
          setError(analysisResult.message || 'Failed to load water data');
        } else {
          // Create empty analysis for new day
          setWaterAnalysis({
            date: selectedDate,
            totalConsumed: 0,
            goal: waterGoal,
            percentageAchieved: 0,
            remaining: waterGoal,
            entries: [],
            entriesCount: 0,
            avgEntrySize: 0,
            goalAchieved: false,
            hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({ hour, amount: 0 })),
            streak: { current: 0, longest: 0 }
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading water data:', error);
      setError('Failed to load water data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWaterData();
  };

  const handleAddWater = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: WaterEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleQuickAdd = async (amount: number, unit: WaterUnit) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Haptic feedback
      Vibration.vibrate(50);

      const result = await waterTrackingService.createWaterEntry(
        user.id,
        amount,
        unit,
        selectedDate,
        'water'
      );

      if (result.success && result.data) {
        // Show success message
        const formattedAmount = waterTrackingService.formatWaterAmount(result.data.amount, unit);

        // Reload data to show updated progress
        loadWaterData();

        // Success haptic feedback
        Vibration.vibrate([50, 100, 50]);

        Alert.alert(
          'Water Logged! 💧',
          `${formattedAmount} added to your daily intake`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to log water');
      }
    } catch (error: any) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleEntrySuccess = (entry: WaterEntry) => {
    setShowEntryForm(false);
    setEditingEntry(null);

    // Refresh data to show updated information
    loadWaterData();

    // Show success message
    const formattedAmount = waterTrackingService.formatWaterAmount(entry.amount, selectedUnit);
    Alert.alert(
      'Success',
      editingEntry
        ? 'Water entry updated successfully!'
        : `${formattedAmount} logged successfully!`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteEntry = (entry: WaterEntry) => {
    const formattedAmount = waterTrackingService.formatWaterAmount(entry.amount, selectedUnit);

    Alert.alert(
      'Delete Water Entry',
      `Are you sure you want to delete the ${formattedAmount} entry from ${DateNavigationUtils.formatDisplayDate(entry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await waterTrackingService.deleteWaterEntry(entry.id);
              if (result.success) {
                loadWaterData();
                Alert.alert('Success', 'Water entry deleted successfully');
              } else {
                Alert.alert('Error', result.message || 'Failed to delete water entry');
              }
            } catch (error: any) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Start Tracking Hydration</Text>
      <Text style={styles.emptyText}>
        Log your first water intake to see your progress toward your daily hydration goal.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddWater}>
        <Text style={styles.emptyButtonText}>💧 Log First Water</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDateSelector = () => (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          handleDateChange(DateNavigationUtils.formatDateString(yesterday));
        }}
        disabled={selectedDate === DateNavigationUtils.formatDateString(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))}
      >
        <Text style={styles.dateButtonText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.dateText}>
        {selectedDate === DateNavigationUtils.getTodayString()
          ? 'Today'
          : DateNavigationUtils.formatDisplayDate(selectedDate)
        }
      </Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          handleDateChange(DateNavigationUtils.formatDateString(tomorrow));
        }}
        disabled={selectedDate === DateNavigationUtils.getTodayString()}
      >
        <Text style={styles.dateButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUnitSelector = () => (
    <View style={styles.unitSelector}>
      {(['ml', 'fl_oz', 'cups'] as WaterUnit[]).map((unit) => (
        <TouchableOpacity
          key={unit}
          style={[
            styles.unitButton,
            selectedUnit === unit && styles.unitButtonActive
          ]}
          onPress={() => setSelectedUnit(unit)}
        >
          <Text style={[
            styles.unitButtonText,
            selectedUnit === unit && styles.unitButtonTextActive
          ]}>
            {unit === 'fl_oz' ? 'fl oz' : unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading water data...</Text>
      </View>
    );
  }

  if (error && !waterAnalysis) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWaterData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Water Tracking</Text>
        <View style={styles.headerActions}>
          {renderUnitSelector()}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddWater}
            accessibilityLabel="Add water entry"
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Selector */}
      {renderDateSelector()}

      {!waterAnalysis || waterAnalysis.entriesCount === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
            />
          }
        >
          <WaterProgressDisplay
            analysis={waterAnalysis}
            unit={selectedUnit}
            onAddWater={handleAddWater}
            onEditEntry={handleEditEntry}
            onQuickAdd={handleQuickAdd}
          />
        </ScrollView>
      )}

      {/* Water Entry Modal */}
      <Modal
        visible={showEntryForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <WaterIntakeForm
          initialDate={selectedDate}
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
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dateButtonText: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 120,
    textAlign: 'center',
  },
  content: {
    flex: 1,
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
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});