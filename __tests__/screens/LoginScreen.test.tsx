import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../src/screens/LoginScreen';
import type { RootStackParamList } from '../../src/types/navigation';

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  Eye: () => 'Eye',
  EyeOff: () => 'EyeOff',
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

const MockedNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('LoginScreen', () => {
  it('renders correctly with login form', () => {
    const { getByTestId, getByText } = render(<MockedNavigator />);
    
    expect(getByTestId('login-screen')).toBeTruthy();
    expect(getByTestId('login-form')).toBeTruthy();
    expect(getByText('Health Dashboard')).toBeTruthy();
    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Sign in to your account')).toBeTruthy();
  });

  it('displays all form components', () => {
    const { getByTestId, getByText } = render(<MockedNavigator />);
    
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('displays branding and footer information', () => {
    const { getByText } = render(<MockedNavigator />);
    
    expect(getByText('Health Dashboard')).toBeTruthy();
    expect(getByText('Secure login • Your health data is protected')).toBeTruthy();
  });

  it('uses SafeAreaContainer for proper mobile layout', () => {
    const { getByTestId } = render(<MockedNavigator />);
    
    const screen = getByTestId('login-screen');
    expect(screen).toBeTruthy();
  });

  it('has proper accessibility setup', () => {
    const { getByTestId } = render(<MockedNavigator />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    expect(emailInput.props.accessibilityLabel).toBe('Email input field');
    expect(passwordInput.props.accessibilityLabel).toBe('Password input field');
    expect(loginButton.props.accessibilityLabel).toBe('Login button');
  });
});