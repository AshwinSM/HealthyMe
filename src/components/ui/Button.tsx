import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  testID,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      {...props}
    >
      <Text style={textStyles}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  // Variants
  primary: {
    backgroundColor: '#10B981',
  },
  secondary: {
    backgroundColor: '#6366F1',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  // Sizes
  small: {
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    minHeight: 52,
  },
  // Text styles
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  outlineText: {
    color: '#10B981',
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});