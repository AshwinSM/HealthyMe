import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { SafeAreaContainer } from '../components/layout';
import { LoginForm, ForgotPasswordForm, ResetPasswordForm } from '../components/forms';
import { DeepLinkHandler } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type AuthMode = 'login' | 'forgotPassword' | 'resetPassword';

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [resetCode, setResetCode] = useState<string>('');

  useEffect(() => {
    // Check for reset parameters from deep link
    if (route.params?.resetCode && route.params?.mode === 'resetPassword') {
      setResetCode(route.params.resetCode);
      setAuthMode('resetPassword');
    }
  }, [route.params]);

  const handleLogin = (email: string, password: string) => {
    // Log the credentials for debugging
    console.log('Login attempted:', { email, password });
  };

  const handleForgotPassword = () => {
    setAuthMode('forgotPassword');
  };

  const handleBackToLogin = () => {
    setAuthMode('login');
    setResetCode('');
  };

  const handleResetSuccess = () => {
    setAuthMode('login');
    setResetCode('');
  };

  const renderAuthForm = () => {
    switch (authMode) {
      case 'forgotPassword':
        return (
          <ForgotPasswordForm 
            onBack={handleBackToLogin}
            testID="forgot-password-form"
          />
        );
        
      case 'resetPassword':
        return (
          <ResetPasswordForm 
            resetCode={resetCode}
            onSuccess={handleResetSuccess}
            onCancel={handleBackToLogin}
            testID="reset-password-form"
          />
        );
        
      default:
        return (
          <LoginForm 
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
            testID="login-form"
          />
        );
    }
  };

  const getHeaderText = () => {
    switch (authMode) {
      case 'forgotPassword':
        return {
          welcome: 'Forgot Password?',
          subtitle: 'Enter your email to reset your password',
        };
      case 'resetPassword':
        return {
          welcome: 'Reset Password',
          subtitle: 'Create a new secure password',
        };
      default:
        return {
          welcome: 'Welcome back',
          subtitle: 'Sign in to your account',
        };
    }
  };

  const headerText = getHeaderText();

  return (
    <SafeAreaContainer testID="login-screen">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header/Branding Section */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Text style={styles.appName}>Health Dashboard</Text>
              <Text style={styles.welcomeText}>{headerText.welcome}</Text>
              <Text style={styles.subtitle}>{headerText.subtitle}</Text>
            </View>
          </View>

          {/* Auth Form Section */}
          <View style={styles.formSection}>
            {renderAuthForm()}
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure login • Your health data is protected
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 32,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});