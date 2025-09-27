import React from 'react';
import { TextInput, View, Text, TextInputProps, StyleSheet } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  style,
  testID,
  ...props 
}) => {
  return (
    <View style={styles.container} testID={testID}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#6B7280"
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 44,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});