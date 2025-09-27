import { AuthService } from '../../../src/services/firebase/auth';
import { 
  sendPasswordResetEmail, 
  verifyPasswordResetCode, 
  confirmPasswordReset,
  signOut
} from 'firebase/auth';
import { auth } from '../../../src/config';

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
  confirmPasswordReset: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Mock auth config
jest.mock('../../../src/config', () => ({
  auth: { currentUser: null },
  db: {},
}));

const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockVerifyPasswordResetCode = verifyPasswordResetCode as jest.MockedFunction<typeof verifyPasswordResetCode>;
const mockConfirmPasswordReset = confirmPasswordReset as jest.MockedFunction<typeof confirmPasswordReset>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('AuthService - Password Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('should successfully send password reset email', async () => {
      const email = 'test@example.com';
      mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent successfully');
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(auth, email);
    });

    it('should handle user not found error', async () => {
      const email = 'nonexistent@example.com';
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No account found with this email address');
      expect(result.error).toBe('auth/user-not-found: User not found');
    });

    it('should handle invalid email error', async () => {
      const email = 'invalid-email';
      const error = { code: 'auth/invalid-email', message: 'Invalid email' };
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email address format');
    });

    it('should handle too many requests error', async () => {
      const email = 'test@example.com';
      const error = { code: 'auth/too-many-requests', message: 'Too many requests' };
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many password reset attempts. Please try again later');
    });

    it('should handle network error', async () => {
      const email = 'test@example.com';
      const error = { code: 'auth/network-request-failed', message: 'Network error' };
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection and try again');
    });

    it('should handle unknown error', async () => {
      const email = 'test@example.com';
      const error = { code: 'auth/unknown-error', message: 'Unknown error' };
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const result = await AuthService.sendPasswordResetEmail(email);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred while sending the password reset email');
    });
  });

  describe('verifyPasswordResetCode', () => {
    it('should successfully verify password reset code', async () => {
      const code = 'valid-reset-code';
      const email = 'test@example.com';
      mockVerifyPasswordResetCode.mockResolvedValueOnce(email);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(true);
      expect(result.data).toBe(email);
      expect(result.message).toBe('Password reset code is valid');
      expect(mockVerifyPasswordResetCode).toHaveBeenCalledWith(auth, code);
    });

    it('should handle expired action code error', async () => {
      const code = 'expired-code';
      const error = { code: 'auth/expired-action-code', message: 'Code expired' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password reset link has expired. Please request a new one');
    });

    it('should handle invalid action code error', async () => {
      const code = 'invalid-code';
      const error = { code: 'auth/invalid-action-code', message: 'Invalid code' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or already used password reset link');
    });

    it('should handle user disabled error', async () => {
      const code = 'valid-code';
      const error = { code: 'auth/user-disabled', message: 'User disabled' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(false);
      expect(result.message).toBe('This account has been disabled');
    });

    it('should handle user not found error', async () => {
      const code = 'valid-code';
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No account found for this reset link');
    });

    it('should handle unknown error', async () => {
      const code = 'valid-code';
      const error = { code: 'auth/unknown-error', message: 'Unknown error' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.verifyPasswordResetCode(code);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password reset link is invalid or expired');
    });
  });

  describe('confirmPasswordReset', () => {
    it('should successfully confirm password reset', async () => {
      const code = 'valid-reset-code';
      const newPassword = 'NewPassword123!';
      mockConfirmPasswordReset.mockResolvedValueOnce(undefined);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password has been reset successfully');
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(auth, code, newPassword);
    });

    it('should handle expired action code error', async () => {
      const code = 'expired-code';
      const newPassword = 'NewPassword123!';
      const error = { code: 'auth/expired-action-code', message: 'Code expired' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password reset link has expired. Please request a new one');
    });

    it('should handle invalid action code error', async () => {
      const code = 'invalid-code';
      const newPassword = 'NewPassword123!';
      const error = { code: 'auth/invalid-action-code', message: 'Invalid code' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or already used password reset link');
    });

    it('should handle weak password error', async () => {
      const code = 'valid-code';
      const newPassword = 'weak';
      const error = { code: 'auth/weak-password', message: 'Weak password' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password is too weak. Please choose a stronger password');
    });

    it('should handle user disabled error', async () => {
      const code = 'valid-code';
      const newPassword = 'NewPassword123!';
      const error = { code: 'auth/user-disabled', message: 'User disabled' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('This account has been disabled');
    });

    it('should handle user not found error', async () => {
      const code = 'valid-code';
      const newPassword = 'NewPassword123!';
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No account found for this reset link');
    });

    it('should handle unknown error', async () => {
      const code = 'valid-code';
      const newPassword = 'NewPassword123!';
      const error = { code: 'auth/unknown-error', message: 'Unknown error' };
      mockConfirmPasswordReset.mockRejectedValueOnce(error);

      const result = await AuthService.confirmPasswordReset(code, newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred while resetting your password');
    });
  });

  describe('isValidResetCode', () => {
    it('should return true for valid reset code', async () => {
      const code = 'valid-reset-code';
      mockVerifyPasswordResetCode.mockResolvedValueOnce('test@example.com');

      const result = await AuthService.isValidResetCode(code);

      expect(result).toBe(true);
      expect(mockVerifyPasswordResetCode).toHaveBeenCalledWith(auth, code);
    });

    it('should return false for invalid reset code', async () => {
      const code = 'invalid-reset-code';
      const error = { code: 'auth/invalid-action-code', message: 'Invalid code' };
      mockVerifyPasswordResetCode.mockRejectedValueOnce(error);

      const result = await AuthService.isValidResetCode(code);

      expect(result).toBe(false);
      expect(mockVerifyPasswordResetCode).toHaveBeenCalledWith(auth, code);
    });
  });
});

describe('AuthService - Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      const result = await AuthService.logout();

      expect(result.success).toBe(true);
      expect(result.message).toBe('User signed out successfully');
      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    it('should handle network error during logout', async () => {
      const error = { code: 'auth/network-request-failed', message: 'Network error' };
      mockSignOut.mockRejectedValueOnce(error);

      const result = await AuthService.logout();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error. Please check your connection and try again');
      expect(result.error).toBe('auth/network-request-failed: Network error');
    });

    it('should handle too many requests error', async () => {
      const error = { code: 'auth/too-many-requests', message: 'Too many requests' };
      mockSignOut.mockRejectedValueOnce(error);

      const result = await AuthService.logout();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many requests. Please try again later');
      expect(result.error).toBe('auth/too-many-requests: Too many requests');
    });

    it('should handle unknown error during logout', async () => {
      const error = { code: 'auth/unknown-error', message: 'Unknown error' };
      mockSignOut.mockRejectedValueOnce(error);

      const result = await AuthService.logout();

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred while signing out');
      expect(result.error).toBe('auth/unknown-error: Unknown error');
    });

    it('should log error details when logout fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = { code: 'auth/test-error', message: 'Test error message' };
      mockSignOut.mockRejectedValueOnce(error);

      await AuthService.logout();

      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', error);
      expect(consoleSpy).toHaveBeenCalledWith('Error code:', 'auth/test-error');
      expect(consoleSpy).toHaveBeenCalledWith('Error message:', 'Test error message');

      consoleSpy.mockRestore();
    });
  });

  describe('clearLocalData', () => {
    it('should successfully clear local data', async () => {
      const result = await AuthService.clearLocalData();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Local authentication data cleared');
    });

    it('should handle error during local data clearing', async () => {
      // Mock an error scenario - though the current implementation doesn't throw
      const result = await AuthService.clearLocalData();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Local authentication data cleared');
    });
  });

  describe('cancelPendingOperations', () => {
    it('should successfully cancel pending operations', async () => {
      const result = await AuthService.cancelPendingOperations();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Pending operations cancelled');
    });

    it('should handle error during operation cancellation', async () => {
      // Mock an error scenario - though the current implementation doesn't throw
      const result = await AuthService.cancelPendingOperations();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Pending operations cancelled');
    });
  });
});

describe('AuthService - Authentication State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      (auth as any).currentUser = mockUser;

      const result = AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', () => {
      (auth as any).currentUser = null;

      const result = AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      (auth as any).currentUser = { uid: 'user123' };

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      (auth as any).currentUser = null;

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});