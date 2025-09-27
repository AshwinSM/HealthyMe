import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginForm } from '../../../src/components/forms/LoginForm';

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  Eye: () => 'Eye',
  EyeOff: () => 'EyeOff',
}));

describe('LoginForm', () => {
  it('renders all form elements correctly', () => {
    const { getByTestId, getByText } = render(
      <LoginForm testID="login-form" />
    );

    expect(getByTestId('login-form')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('handles form input changes', () => {
    const { getByTestId } = render(
      <LoginForm testID="login-form" />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('calls onLogin when form is submitted with valid data', () => {
    const onLogin = jest.fn();
    const { getByTestId } = render(
      <LoginForm onLogin={onLogin} testID="login-form" />
    );

    // Fill in the form
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    // Submit the form
    fireEvent.press(getByTestId('login-button'));

    expect(onLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('disables login button when fields are empty', () => {
    const onLogin = jest.fn();
    const { getByTestId } = render(
      <LoginForm onLogin={onLogin} testID="login-form" />
    );

    const loginButton = getByTestId('login-button');
    
    // Button should be disabled when fields are empty
    fireEvent.press(loginButton);
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('disables login button when email is empty', () => {
    const onLogin = jest.fn();
    const { getByTestId } = render(
      <LoginForm onLogin={onLogin} testID="login-form" />
    );

    // Fill only password
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);
    
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('disables login button when password is empty', () => {
    const onLogin = jest.fn();
    const { getByTestId } = render(
      <LoginForm onLogin={onLogin} testID="login-form" />
    );

    // Fill only email
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);
    
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    const { getByText } = render(
      <LoginForm loading={true} testID="login-form" />
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByTestId } = render(
      <LoginForm testID="login-form" />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    expect(emailInput.props.accessibilityLabel).toBe('Email input field');
    expect(passwordInput.props.accessibilityLabel).toBe('Password input field');
    expect(loginButton.props.accessibilityLabel).toBe('Login button');
  });
});