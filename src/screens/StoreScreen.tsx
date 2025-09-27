import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

export const StoreScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShoppingBag size={64} color="#F59E0B" />
        </View>
        <Text style={styles.title}>Premium Store</Text>
        <Text style={styles.subtitle}>
          Coming Soon
        </Text>
        <Text style={styles.description}>
          Unlock premium features, custom plans, and advanced health analytics.
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
    color: '#F59E0B',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});