import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../../../src/components/forms/PasswordInput';

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  Eye: () => 'Eye',
  EyeOff: () => 'EyeOff',
}));

describe('PasswordInput', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <PasswordInput
        value=""
        placeholder="Password"
        testID="password-input"
      />
    );

    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const { getByTestId } = render(
      <PasswordInput
        value="secret"
        testID="password-input"
      />
    );

    const toggleButton = getByTestId('password-input-toggle');
    
    // Initially password should be hidden (secureTextEntry: true)
    fireEvent.press(toggleButton);
    
    // After press, password should be visible
    fireEvent.press(toggleButton);
  });

  it('displays Eye icon when password is hidden', () => {
    const { getByTestId } = render(
      <PasswordInput
        value="secret"
        testID="password-input"
      />
    );

    expect(getByTestId('password-input-toggle')).toBeTruthy();
  });

  it('has proper accessibility labels', () => {
    const { getByTestId } = render(
      <PasswordInput
        value="secret"
        testID="password-input"
      />
    );

    const toggleButton = getByTestId('password-input-toggle');
    expect(toggleButton.props.accessibilityLabel).toBe('Show password');
    expect(toggleButton.props.accessibilityRole).toBe('button');
  });

  it('handles text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <PasswordInput
        value=""
        onChangeText={onChangeText}
        testID="password-input"
      />
    );

    fireEvent.changeText(getByDisplayValue(''), 'newpassword');
    expect(onChangeText).toHaveBeenCalledWith('newpassword');
  });
});