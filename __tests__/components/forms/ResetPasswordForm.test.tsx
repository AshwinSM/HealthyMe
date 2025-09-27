import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ResetPasswordForm } from '../../../src/components/forms/ResetPasswordForm';
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
    verifyPasswordResetCode: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockVerifyPasswordResetCode = AuthService.verifyPasswordResetCode as jest.MockedFunction<
  typeof AuthService.verifyPasswordResetCode
>;
const mockConfirmPasswordReset = AuthService.confirmPasswordReset as jest.MockedFunction<
  typeof AuthService.confirmPasswordReset
>;

describe('ResetPasswordForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const validResetCode = 'valid-reset-code';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockVerifyPasswordResetCode.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByText } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    expect(getByText('Validating Reset Link...')).toBeTruthy();
    expect(getByText('Please wait while we validate your password reset link.')).toBeTruthy();
  });

  it('should render form after successful code verification', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByText, getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByText('Reset Your Password')).toBeTruthy();
      expect(getByText(`Enter your new password for ${email}`)).toBeTruthy();
      expect(getByTestId('new-password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
      expect(getByTestId('reset-password-button')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
  });

  it('should render error state for invalid code', async () => {
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: false,
      message: 'Invalid code',
    });

    const { getByText, getByTestId } = render(
      <ResetPasswordForm 
        resetCode="invalid-code"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByText('Invalid Reset Link')).toBeTruthy();
      expect(getByText('This password reset link is invalid or has expired. Please request a new password reset.')).toBeTruthy();
      expect(getByTestId('back-to-login-button')).toBeTruthy();
    });
  });

  it('should validate password requirements', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByTestId, getByText, queryByText } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    
    // Test weak password
    fireEvent.changeText(passwordInput, 'weak');
    
    await waitFor(() => {
      expect(queryByText('Password must be at least 8 characters long')).toBeTruthy();
    });

    // Test strong password
    fireEvent.changeText(passwordInput, 'StrongPass123!');
    
    // All requirements should be met (green checkmarks)
    expect(getByText('• At least 8 characters')).toBeTruthy();
    expect(getByText('• One lowercase letter')).toBeTruthy();
    expect(getByText('• One uppercase letter')).toBeTruthy();
    expect(getByText('• One number')).toBeTruthy();
  });

  it('should validate password confirmation match', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByTestId, getByText } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    
    fireEvent.changeText(passwordInput, 'StrongPass123!');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');
    
    await waitFor(() => {
      expect(getByText("Passwords don't match")).toBeTruthy();
    });

    fireEvent.changeText(confirmPasswordInput, 'StrongPass123!');
    
    await waitFor(() => {
      expect(() => getByText("Passwords don't match")).toThrow();
    });
  });

  it('should successfully reset password', async () => {
    const email = 'test@example.com';
    const newPassword = 'NewStrongPass123!';
    
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });
    
    mockConfirmPasswordReset.mockResolvedValueOnce({
      success: true,
      message: 'Password reset successfully',
    });

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const resetButton = getByTestId('reset-password-button');

    fireEvent.changeText(passwordInput, newPassword);
    fireEvent.changeText(confirmPasswordInput, newPassword);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(validResetCode, newPassword);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Password Reset Successfully',
        'Your password has been reset. You can now login with your new password.',
        expect.any(Array)
      );
    });
  });

  it('should handle password reset failure', async () => {
    const email = 'test@example.com';
    const newPassword = 'NewStrongPass123!';
    
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });
    
    mockConfirmPasswordReset.mockResolvedValueOnce({
      success: false,
      message: 'Reset failed',
    });

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const resetButton = getByTestId('reset-password-button');

    fireEvent.changeText(passwordInput, newPassword);
    fireEvent.changeText(confirmPasswordInput, newPassword);
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Failed',
        'Reset failed',
        [{ text: 'OK' }]
      );
    });
  });

  it('should prevent reset with invalid password', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const resetButton = getByTestId('reset-password-button');

    fireEvent.changeText(passwordInput, 'weak');
    fireEvent.changeText(confirmPasswordInput, 'weak');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Password',
        'Password must be at least 8 characters long',
        [{ text: 'OK' }]
      );
    });

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
  });

  it('should prevent reset with mismatched passwords', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const resetButton = getByTestId('reset-password-button');

    fireEvent.changeText(passwordInput, 'StrongPass123!');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Passwords Don\'t Match',
        'Please ensure both password fields match.',
        [{ text: 'OK' }]
      );
    });

    expect(mockConfirmPasswordReset).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is pressed', async () => {
    const email = 'test@example.com';
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('cancel-button')).toBeTruthy();
    });

    const cancelButton = getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state during password reset', async () => {
    const email = 'test@example.com';
    const newPassword = 'NewStrongPass123!';
    
    mockVerifyPasswordResetCode.mockResolvedValueOnce({
      success: true,
      data: email,
      message: 'Valid code',
    });

    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockConfirmPasswordReset.mockReturnValueOnce(promise);

    const { getByTestId } = render(
      <ResetPasswordForm 
        resetCode={validResetCode}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        testID="reset-password-form"
      />
    );

    await waitFor(() => {
      expect(getByTestId('new-password-input')).toBeTruthy();
    });

    const passwordInput = getByTestId('new-password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const resetButton = getByTestId('reset-password-button');

    fireEvent.changeText(passwordInput, newPassword);
    fireEvent.changeText(confirmPasswordInput, newPassword);
    fireEvent.press(resetButton);

    // Check loading state
    expect(resetButton.props.loading).toBe(true);

    // Resolve the promise
    resolvePromise!({ success: true, message: 'Reset successful' });

    await waitFor(() => {
      expect(resetButton.props.loading).toBe(false);
    });
  });
});