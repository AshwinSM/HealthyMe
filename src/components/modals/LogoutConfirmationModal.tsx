import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StyleSheet 
} from 'react-native';
import { useAuthStore } from '../../stores';

interface LogoutConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel
}) => {
  const { isLoggingOut, logoutError } = useAuthStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>
              Sign Out
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              Are you sure you want to sign out? Your data is safely stored in the cloud and will be available when you sign back in.
            </Text>
            
            {logoutError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {logoutError}
                </Text>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isLoggingOut}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoggingOut}
              style={[
                styles.confirmButton,
                isLoggingOut && styles.confirmButtonLoading
              ]}
            >
              {isLoggingOut ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>
                    Signing Out...
                  </Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>
                  Sign Out
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FEE2E2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    color: '#DC2626',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#DC2626',
    borderRadius: 12,
  },
  confirmButtonLoading: {
    backgroundColor: '#F87171',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 16,
  },
});