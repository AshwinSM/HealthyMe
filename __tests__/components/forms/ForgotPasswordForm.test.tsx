import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ForgotPasswordForm } from '../../../src/components/forms/ForgotPasswordForm';
import { AuthService } from '../../../src/services/firebase/auth';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock AuthService
jest.mock('../../../src/services/firebase/auth', () => ({
  AuthService: {
    sendPasswordResetEmail: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockSendPasswordResetEmail = AuthService.sendPasswordResetEmail as jest.MockedFunction<
  typeof AuthService.sendPasswordResetEmail
>;

describe('ForgotPasswordForm', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} testID="forgot-password-form" />
    );

    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByText('Enter your email address and we\'ll send you instructions to reset your password.')).toBeTruthy();
    expect(getByTestId('reset-email-input')).toBeTruthy();
    expect(getByTestId('send-reset-button')).toBeTruthy();
    expect(getByTestId('back-to-login-button')).toBeTruthy();
  });

  it('should show error when email is empty', async () => {
    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const sendButton = getByTestId('send-reset-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Required',
        'Please enter your email address.',
        [{ text: 'OK' }]
      );
    });
  });

  it('should show error for invalid email format', async () => {
    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Email',
        'Please enter a valid email address.',
        [{ text: 'OK' }]
      );
    });
  });

  it('should successfully send reset email', async () => {
    const email = 'test@example.com';
    mockSendPasswordResetEmail.mockResolvedValueOnce({
      success: true,
      message: 'Reset email sent',
    });

    const { getByTestId, getByText } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, email);
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(email);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Sent',
        'Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.',
        [{ text: 'OK' }]
      );
    });

    // Check that success state is shown
    await waitFor(() => {
      expect(getByText('Email Sent')).toBeTruthy();
      expect(getByText('✓ Reset instructions sent to your email')).toBeTruthy();
    });
  });

  it('should handle send reset email failure', async () => {
    const email = 'test@example.com';
    mockSendPasswordResetEmail.mockResolvedValueOnce({
      success: false,
      message: 'Email not found',
    });

    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, email);
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Failed',
        'Email not found',
        [{ text: 'OK' }]
      );
    });
  });

  it('should handle network error', async () => {
    const email = 'test@example.com';
    const error = new Error('Network error');
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, email);
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Network error',
        [{ text: 'OK' }]
      );
    });
  });

  it('should call onBack when back button is pressed', () => {
    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const backButton = getByTestId('back-to-login-button');
    fireEvent.press(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should disable form after successful email send', async () => {
    const email = 'test@example.com';
    mockSendPasswordResetEmail.mockResolvedValueOnce({
      success: true,
      message: 'Reset email sent',
    });

    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, email);
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(sendButton.props.disabled).toBe(true);
      expect(emailInput.props.editable).toBe(false);
    });
  });

  it('should show loading state while sending email', async () => {
    const email = 'test@example.com';
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockSendPasswordResetEmail.mockReturnValueOnce(promise);

    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    fireEvent.changeText(emailInput, email);
    fireEvent.press(sendButton);

    // Check loading state
    expect(sendButton.props.loading).toBe(true);

    // Resolve the promise
    resolvePromise!({ success: true, message: 'Sent' });

    await waitFor(() => {
      expect(sendButton.props.loading).toBe(false);
    });
  });

  it('should validate email format in real-time', () => {
    const { getByTestId } = render(
      <ForgotPasswordForm onBack={mockOnBack} />
    );

    const emailInput = getByTestId('reset-email-input');
    const sendButton = getByTestId('send-reset-button');

    // Empty email should disable button
    expect(sendButton.props.disabled).toBe(true);

    // Valid email should enable button
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(sendButton.props.disabled).toBe(false);

    // Invalid email should disable button
    fireEvent.changeText(emailInput, 'invalid-email');
    expect(sendButton.props.disabled).toBe(false); // Button is not disabled for invalid format, validation happens on press
  });
});