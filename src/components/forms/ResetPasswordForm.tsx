import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { Button } from '../ui';
import { PasswordInput } from './PasswordInput';
import { AuthService } from '../../services/firebase/auth';

type ResetPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export interface ResetPasswordFormProps {
  resetCode: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  testID?: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ 
  resetCode,
  onSuccess,
  onCancel,
  testID 
}) => {
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [email, setEmail] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);

  useEffect(() => {
    validateResetCode();
  }, [resetCode]);

  const validateResetCode = async () => {
    setIsValidating(true);
    try {
      const result = await AuthService.verifyPasswordResetCode(resetCode);
      if (result.success && result.data) {
        setEmail(result.data);
        setIsCodeValid(true);
      } else {
        setIsCodeValid(false);
        Alert.alert(
          'Invalid Reset Link',
          result.message || 'This password reset link is invalid or has expired.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    } catch (error: any) {
      setIsCodeValid(false);
      Alert.alert(
        'Error',
        'Unable to validate reset link. Please try again.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    } finally {
      setIsValidating(false);
    }
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true, message: '' };
  };

  const handleResetPassword = async () => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Invalid Password',
        passwordValidation.message,
        [{ text: 'OK' }]
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords Don\'t Match',
        'Please ensure both password fields match.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.confirmPasswordReset(resetCode, password);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successfully',
          'Your password has been reset. You can now login with your new password.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  navigation.navigate('Login');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Reset Failed',
          result.message || 'Failed to reset password. Please try again.',
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.navigate('Login');
    }
  };

  if (isValidating) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.form}>
          <Text style={styles.title}>Validating Reset Link...</Text>
          <Text style={styles.description}>
            Please wait while we validate your password reset link.
          </Text>
        </View>
      </View>
    );
  }

  if (!isCodeValid) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.form}>
          <Text style={styles.title}>Invalid Reset Link</Text>
          <Text style={styles.description}>
            This password reset link is invalid or has expired. Please request a new password reset.
          </Text>
          <Button
            title="Back to Login"
            onPress={handleCancel}
            variant="primary"
            size="large"
            style={styles.actionButton}
            testID="back-to-login-button"
          />
        </View>
      </View>
    );
  }

  const passwordValidation = validatePassword(password);
  const isPasswordValid = passwordValidation.isValid;
  const passwordsMatch = password === confirmPassword;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.form}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.description}>
          Enter your new password for {email}
        </Text>
        
        <PasswordInput
          label="New Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your new password"
          testID="new-password-input"
          accessibilityLabel="New password input field"
          accessibilityHint="Enter your new password"
        />

        {password && !isPasswordValid && (
          <Text style={styles.errorText}>
            {passwordValidation.message}
          </Text>
        )}

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your new password"
          testID="confirm-password-input"
          accessibilityLabel="Confirm password input field"
          accessibilityHint="Re-enter your new password to confirm"
        />

        {confirmPassword && !passwordsMatch && (
          <Text style={styles.errorText}>
            Passwords don't match
          </Text>
        )}

        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={[styles.requirement, password.length >= 8 && styles.requirementMet]}>
            • At least 8 characters
          </Text>
          <Text style={[styles.requirement, /(?=.*[a-z])/.test(password) && styles.requirementMet]}>
            • One lowercase letter
          </Text>
          <Text style={[styles.requirement, /(?=.*[A-Z])/.test(password) && styles.requirementMet]}>
            • One uppercase letter
          </Text>
          <Text style={[styles.requirement, /(?=.*\d)/.test(password) && styles.requirementMet]}>
            • One number
          </Text>
        </View>
        
        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          loading={isLoading}
          disabled={!password || !confirmPassword || !isPasswordValid || !passwordsMatch || isLoading}
          variant="primary"
          size="large"
          style={styles.actionButton}
          testID="reset-password-button"
          accessibilityLabel="Reset password"
          accessibilityHint="Tap to reset your password with the new password"
        />
        
        <Button
          title="Cancel"
          onPress={handleCancel}
          loading={false}
          disabled={isLoading}
          variant="secondary"
          size="large"
          style={styles.cancelButton}
          testID="cancel-button"
          accessibilityLabel="Cancel password reset"
          accessibilityHint="Tap to cancel password reset and return to login"
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginBottom: 8,
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  requirement: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  requirementMet: {
    color: '#10B981',
  },
  actionButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 16,
  },
});