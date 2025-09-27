import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input, InputProps } from '../ui/Input';

export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry'> {
  testID?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ 
  style,
  testID,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Input
        {...props}
        secureTextEntry={!showPassword}
        style={[styles.input, style]}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={togglePasswordVisibility}
        activeOpacity={0.7}
        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
        testID={`${testID}-toggle`}
      >
        {showPassword ? (
          <EyeOff />
        ) : (
          <Eye />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    paddingRight: 48, // Make room for the eye icon
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 32, // Adjust based on label height
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});