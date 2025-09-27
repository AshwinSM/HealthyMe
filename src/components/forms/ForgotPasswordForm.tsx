import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { Input, Button } from '../ui';
import { AuthService } from '../../services/firebase/auth';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export interface ForgotPasswordFormProps {
  onBack?: () => void;
  testID?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onBack,
  testID 
}) => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.sendPasswordResetEmail(email);
      
      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Email Sent',
          'Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Reset Failed',
          result.message || 'Failed to send password reset email. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.form}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
        
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!emailSent}
          testID="reset-email-input"
          accessibilityLabel="Email input for password reset"
          accessibilityHint="Enter the email address associated with your account"
          style={emailSent ? styles.disabledInput : undefined}
        />
        
        <Button
          title={emailSent ? "Email Sent" : "Send Reset Instructions"}
          onPress={handleSendResetEmail}
          loading={isLoading}
          disabled={!email || isLoading || emailSent}
          variant="primary"
          size="large"
          style={styles.sendButton}
          testID="send-reset-button"
          accessibilityLabel="Send password reset email"
          accessibilityHint="Tap to send password reset instructions to your email"
        />

        {emailSent && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              ✓ Reset instructions sent to your email
            </Text>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </Text>
          </View>
        )}
        
        <Button
          title="Back to Login"
          onPress={handleBackToLogin}
          loading={false}
          disabled={isLoading}
          variant="secondary"
          size="large"
          style={styles.backButton}
          testID="back-to-login-button"
          accessibilityLabel="Back to login"
          accessibilityHint="Tap to return to the login screen"
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  disabledInput: {
    opacity: 0.6,
  },
  sendButton: {
    marginTop: 8,
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  successText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  backButton: {
    marginTop: 16,
  },
});