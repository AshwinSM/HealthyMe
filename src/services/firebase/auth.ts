import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { UserProfile, ApiResponse } from '../../types';

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async register(email: string, password: string, displayName?: string): Promise<ApiResponse<UserProfile>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user profile in Firestore (only include defined fields)
      const userProfileData: any = {
        id: user.uid,
        email: user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        
        // Default health preferences
        weightUnit: 'kg',
        heightUnit: 'cm',
        dailyCalorieGoal: 2000,
        dailyWaterGoal: 2000, // 2L in ml
        dailyStepsGoal: 10000,
      };

      // Only add optional fields if they exist
      if (displayName) {
        userProfileData.displayName = displayName;
      }
      if (user.photoURL) {
        userProfileData.photoURL = user.photoURL;
      }

      await setDoc(doc(db, 'users', user.uid), userProfileData);

      // Create the properly typed UserProfile for return
      const userProfile: UserProfile = {
        ...userProfileData,
        displayName: displayName || undefined,
        photoURL: user.photoURL || undefined,
      };

      return {
        success: true,
        data: userProfile,
        message: 'User registered successfully'
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to register user'
      };
    }
  }

  /**
   * Sign in existing user with email and password
   */
  static async login(email: string, password: string): Promise<ApiResponse<UserProfile>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(user.uid);
      
      if (userProfile.success && userProfile.data) {
        return {
          success: true,
          data: userProfile.data,
          message: 'User signed in successfully'
        };
      } else {
        // If no profile found, create a basic one (only include defined fields)
        const basicProfileData: any = {
          id: user.uid,
          email: user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          weightUnit: 'kg',
          heightUnit: 'cm',
          dailyCalorieGoal: 2000,
          dailyWaterGoal: 2000,
          dailyStepsGoal: 10000,
        };

        // Only add optional fields if they exist
        if (user.displayName) {
          basicProfileData.displayName = user.displayName;
        }
        if (user.photoURL) {
          basicProfileData.photoURL = user.photoURL;
        }

        await setDoc(doc(db, 'users', user.uid), basicProfileData);

        // Create the properly typed UserProfile for return
        const basicProfile: UserProfile = {
          ...basicProfileData,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        };
        
        return {
          success: true,
          data: basicProfile,
          message: 'User signed in successfully'
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: 'Failed to sign in'
      };
    }
  }

  /**
   * Sign out current user with comprehensive cleanup
   */
  static async logout(): Promise<ApiResponse<null>> {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      return {
        success: true,
        message: 'User signed out successfully'
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to sign out';
      
      // Handle specific error codes
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later';
          break;
        default:
          errorMessage = 'An error occurred while signing out';
      }
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: errorMessage
      };
    }
  }

  /**
   * Clear local authentication data
   */
  static async clearLocalData(): Promise<ApiResponse<null>> {
    try {
      // Note: Firebase auth automatically clears its internal state on signOut()
      // This method is for any additional local data cleanup if needed
      
      return {
        success: true,
        message: 'Local authentication data cleared'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clear local data'
      };
    }
  }

  /**
   * Cancel pending operations (placeholder for future implementation)
   */
  static async cancelPendingOperations(): Promise<ApiResponse<null>> {
    try {
      // Future implementation: Cancel any pending Firebase operations
      // For now, just return success
      
      return {
        success: true,
        message: 'Pending operations cancelled'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to cancel pending operations'
      };
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        return {
          success: true,
          data: data,
          message: 'User profile retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: 'User profile not found',
          message: 'No user profile found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get user profile'
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const docRef = doc(db, 'users', userId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await setDoc(docRef, updateData, { merge: true });

      // Get updated profile
      const updatedProfile = await this.getUserProfile(userId);
      
      return {
        success: true,
        data: updatedProfile.data!,
        message: 'User profile updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update user profile'
      };
    }
  }

  /**
   * Get current Firebase user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<ApiResponse<null>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to send password reset email';
      
      // Handle specific error codes
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many password reset attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again';
          break;
        default:
          errorMessage = 'An error occurred while sending the password reset email';
      }
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: errorMessage
      };
    }
  }

  /**
   * Verify password reset code validity
   */
  static async verifyPasswordResetCode(code: string): Promise<ApiResponse<string>> {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return {
        success: true,
        data: email,
        message: 'Password reset code is valid'
      };
    } catch (error: any) {
      console.error('Password reset code verification error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Invalid password reset code';
      
      // Handle specific error codes
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'Password reset link has expired. Please request a new one';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid or already used password reset link';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found for this reset link';
          break;
        default:
          errorMessage = 'Password reset link is invalid or expired';
      }
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: errorMessage
      };
    }
  }

  /**
   * Confirm password reset with new password
   */
  static async confirmPasswordReset(code: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to reset password';
      
      // Handle specific error codes
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'Password reset link has expired. Please request a new one';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid or already used password reset link';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found for this reset link';
          break;
        default:
          errorMessage = 'An error occurred while resetting your password';
      }
      
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: errorMessage
      };
    }
  }

  /**
   * Validate password reset code without consuming it
   */
  static async isValidResetCode(code: string): Promise<boolean> {
    try {
      await verifyPasswordResetCode(auth, code);
      return true;
    } catch (error) {
      return false;
    }
  }
}