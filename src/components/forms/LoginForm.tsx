import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { Input, Button } from '../ui';
import { PasswordInput } from './PasswordInput';
import { useAuthStore } from '../../stores';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  testID?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin,
  onForgotPassword, 
  loading: externalLoading = false,
  testID 
}) => {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  
  const { login, register, isLoading } = useAuthStore();
  const isProcessing = isLoading || externalLoading;

  const handleLogin = async () => {
    try {
      // Call the optional onLogin callback first (for logging, etc.)
      if (onLogin) {
        onLogin(email, password);
      }
      
      const success = await login(email, password);
      
      if (success) {
        // Navigation will be handled automatically by auth state change in RootNavigator
        console.log('Login successful - auth state will trigger navigation');
      } else {
        Alert.alert(
          'Login Failed',
          'Please check your email and password and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Login Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRegister = async () => {
    try {
      const success = await register(email, password);
      
      if (success) {
        // Navigation will be handled automatically by auth state change in RootNavigator
        console.log('Registration successful - auth state will trigger navigation');
      } else {
        Alert.alert(
          'Registration Failed',
          'Please check your email and password and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email or username"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="email-input"
          accessibilityLabel="Email input field"
          accessibilityHint="Enter your email address or username"
        />
        
        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          testID="password-input"
          accessibilityLabel="Password input field"
          accessibilityHint="Enter your password"
        />
        
        <Button
          title={showRegister ? "Register" : "Login"}
          onPress={showRegister ? handleRegister : handleLogin}
          loading={isProcessing}
          disabled={!email || !password || isProcessing}
          variant="primary"
          size="large"
          style={styles.loginButton}
          testID={showRegister ? "register-button" : "login-button"}
          accessibilityLabel={showRegister ? "Register button" : "Login button"}
          accessibilityHint={showRegister ? "Tap to create a new account" : "Tap to login with your credentials"}
        />
        
        {!showRegister && (
          <Button
            title="Forgot Password?"
            onPress={onForgotPassword}
            loading={false}
            disabled={isProcessing}
            variant="outline"
            size="medium"
            style={styles.forgotButton}
            testID="forgot-password-button"
            accessibilityLabel="Forgot password"
            accessibilityHint="Tap to reset your password"
          />
        )}
        
        <Button
          title={showRegister ? "Already have an account? Login" : "Need an account? Register"}
          onPress={() => setShowRegister(!showRegister)}
          loading={false}
          disabled={isProcessing}
          variant="secondary"
          size="large"
          style={styles.switchButton}
          testID="switch-mode-button"
          accessibilityLabel={showRegister ? "Switch to login" : "Switch to register"}
          accessibilityHint={showRegister ? "Tap to switch to login mode" : "Tap to switch to register mode"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  forgotButton: {
    marginTop: 12,
  },
  switchButton: {
    marginTop: 16,
  },
});