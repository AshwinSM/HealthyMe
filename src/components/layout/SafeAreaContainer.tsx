import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface SafeAreaContainerProps extends ViewProps {
  children: React.ReactNode;
  testID?: string;
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({ 
  children, 
  style,
  testID,
  ...props 
}) => {
  return (
    <SafeAreaView style={[styles.container, style]} testID={testID} {...props}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});