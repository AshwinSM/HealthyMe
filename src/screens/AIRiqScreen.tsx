import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Brain } from 'lucide-react-native';

export const AIRiqScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Brain size={64} color="#8B5CF6" />
        </View>
        <Text style={styles.title}>AI Health Insights</Text>
        <Text style={styles.subtitle}>
          Coming Soon
        </Text>
        <Text style={styles.description}>
          Get personalized health recommendations and insights powered by AI.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});