import React, { useState } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PhotoViewerProps {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
  onDelete?: () => void;
  title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  imageUri,
  onClose,
  onDelete,
  title
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
        backgroundColor="rgba(0, 0, 0, 0.9)"
        translucent={true}
      />

      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}

            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Image Container */}
          <View style={styles.imageContainer}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}

            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>Failed to load image</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setHasError(false);
                    setIsLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Pinch to zoom • Tap background to close
            </Text>
          </View>
        </SafeAreaView>

        {/* Background overlay - tap to close */}
        <TouchableOpacity
          style={styles.backgroundOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)'
  },
  safeArea: {
    flex: 1,
    zIndex: 2
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 3
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginHorizontal: 16
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButtonText: {
    fontSize: 20
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  image: {
    width: screenWidth - 32,
    height: screenHeight - 200, // Account for header and footer
    maxWidth: '100%',
    maxHeight: '100%'
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 3
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center'
  }
});