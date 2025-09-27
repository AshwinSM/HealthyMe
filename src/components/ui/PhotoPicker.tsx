import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Text
} from 'react-native';
import { foodPhotoService, CameraOptions, GalleryOptions } from '../../services/photoService';

interface PhotoPickerProps {
  value?: string;       // Current photo URI
  onChange: (uri: string | undefined) => void;
  style?: ViewStyle;
  placeholder?: string;
  disabled?: boolean;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  value,
  onChange,
  style,
  placeholder = "Add photo",
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const showImagePicker = () => {
    Alert.alert(
      "Add Photo",
      "Choose how you want to add a photo",
      [
        {
          text: "Camera",
          onPress: handleCameraCapture,
          style: "default"
        },
        {
          text: "Photo Library",
          onPress: handleGallerySelection,
          style: "default"
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleCameraCapture = async () => {
    try {
      setIsUploading(true);
      const cameraOptions: CameraOptions = {
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for food photos
        maxWidth: 1200,
        maxHeight: 1200,
        mediaTypes: 'photo',
        includeBase64: false,
        exif: true
      };

      const result = await foodPhotoService.captureFromCamera(cameraOptions);
      onChange(result.uri);
    } catch (error: any) {
      Alert.alert("Camera Error", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGallerySelection = async () => {
    try {
      setIsUploading(true);
      const galleryOptions: GalleryOptions = {
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        maxWidth: 1200,
        maxHeight: 1200,
        mediaTypes: 'photo',
        includeBase64: false,
        exif: true,
        allowsMultipleSelection: false
      };

      const result = await foodPhotoService.selectFromGallery(galleryOptions);
      onChange(result.uri);
    } catch (error: any) {
      Alert.alert("Gallery Error", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onChange(undefined)
        }
      ]
    );
  };

  if (value) {
    return (
      <View style={[styles.photoContainer, style]}>
        <Image
          source={{ uri: value }}
          style={styles.photoPreview}
          resizeMode="cover"
        />

        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemovePhoto}
          disabled={disabled}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changeButton}
          onPress={showImagePicker}
          disabled={disabled}
        >
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.photoPlaceholder, style]}
      onPress={showImagePicker}
      disabled={disabled || isUploading}
    >
      {isUploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator color="#6B7280" size="large" />
          <Text style={styles.uploadingText}>Processing...</Text>
        </View>
      ) : (
        <View style={styles.placeholderContent}>
          <Text style={styles.cameraIcon}>📸</Text>
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <Text style={styles.placeholderSubtext}>Tap to add photo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6'
  },
  photoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB'
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  changeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  photoPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB'
  },
  placeholderContent: {
    alignItems: 'center'
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280'
  },
  uploadingContainer: {
    alignItems: 'center'
  },
  uploadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  }
});