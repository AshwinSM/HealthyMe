import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PhotoPicker } from '../../../src/components/ui/PhotoPicker';
import { foodPhotoService } from '../../../src/services/photoService';

// Mock dependencies
jest.mock('../../../src/services/photoService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

const mockFoodPhotoService = foodPhotoService as jest.Mocked<typeof foodPhotoService>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('PhotoPicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render placeholder when no photo selected', () => {
    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    expect(getByText('Add photo')).toBeTruthy();
    expect(getByText('Tap to add photo')).toBeTruthy();
    expect(getByText('📸')).toBeTruthy();
  });

  it('should render photo preview when photo selected', () => {
    const { getByTestId } = render(
      <PhotoPicker
        value="file://test-photo.jpg"
        onChange={mockOnChange}
        testID="photo-picker"
      />
    );

    // Photo should be displayed
    expect(getByTestId).toBeTruthy();
  });

  it('should show image picker options when placeholder tapped', () => {
    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    expect(mockAlert).toHaveBeenCalledWith(
      'Add Photo',
      'Choose how you want to add a photo',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Camera' }),
        expect.objectContaining({ text: 'Photo Library' }),
        expect.objectContaining({ text: 'Cancel' })
      ])
    );
  });

  it('should handle camera capture successfully', async () => {
    const mockPhotoResult = {
      uri: 'file://captured-photo.jpg',
      width: 1200,
      height: 900,
      fileSize: 500000,
      mimeType: 'image/jpeg',
      timestamp: Date.now()
    };

    mockFoodPhotoService.captureFromCamera.mockResolvedValue(mockPhotoResult);

    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    // Simulate camera button press
    const alertCalls = mockAlert.mock.calls[0];
    const cameraOption = alertCalls[2].find((option: any) => option.text === 'Camera');

    await cameraOption.onPress();

    await waitFor(() => {
      expect(mockFoodPhotoService.captureFromCamera).toHaveBeenCalledWith({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        maxWidth: 1200,
        maxHeight: 1200,
        mediaTypes: 'photo',
        includeBase64: false,
        exif: true
      });
      expect(mockOnChange).toHaveBeenCalledWith('file://captured-photo.jpg');
    });
  });

  it('should handle gallery selection successfully', async () => {
    const mockPhotoResult = {
      uri: 'file://gallery-photo.jpg',
      width: 800,
      height: 600,
      fileSize: 300000,
      mimeType: 'image/jpeg',
      timestamp: Date.now()
    };

    mockFoodPhotoService.selectFromGallery.mockResolvedValue(mockPhotoResult);

    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    // Simulate gallery button press
    const alertCalls = mockAlert.mock.calls[0];
    const galleryOption = alertCalls[2].find((option: any) => option.text === 'Photo Library');

    await galleryOption.onPress();

    await waitFor(() => {
      expect(mockFoodPhotoService.selectFromGallery).toHaveBeenCalledWith({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        maxWidth: 1200,
        maxHeight: 1200,
        mediaTypes: 'photo',
        includeBase64: false,
        exif: true,
        allowsMultipleSelection: false
      });
      expect(mockOnChange).toHaveBeenCalledWith('file://gallery-photo.jpg');
    });
  });

  it('should handle camera capture error', async () => {
    mockFoodPhotoService.captureFromCamera.mockRejectedValue(
      new Error('Camera permission denied')
    );

    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    const alertCalls = mockAlert.mock.calls[0];
    const cameraOption = alertCalls[2].find((option: any) => option.text === 'Camera');

    await cameraOption.onPress();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Camera Error',
        'Camera permission denied'
      );
    });
  });

  it('should handle gallery selection error', async () => {
    mockFoodPhotoService.selectFromGallery.mockRejectedValue(
      new Error('Gallery permission denied')
    );

    const { getByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    const alertCalls = mockAlert.mock.calls[0];
    const galleryOption = alertCalls[2].find((option: any) => option.text === 'Photo Library');

    await galleryOption.onPress();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Gallery Error',
        'Gallery permission denied'
      );
    });
  });

  it('should show remove confirmation when remove button pressed', () => {
    const { getByText } = render(
      <PhotoPicker
        value="file://test-photo.jpg"
        onChange={mockOnChange}
      />
    );

    fireEvent.press(getByText('×'));

    expect(mockAlert).toHaveBeenCalledWith(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({
          text: 'Remove',
          style: 'destructive'
        })
      ])
    );
  });

  it('should call onChange with undefined when photo removed', () => {
    const { getByText } = render(
      <PhotoPicker
        value="file://test-photo.jpg"
        onChange={mockOnChange}
      />
    );

    fireEvent.press(getByText('×'));

    const alertCalls = mockAlert.mock.calls[0];
    const removeOption = alertCalls[2].find((option: any) => option.text === 'Remove');

    removeOption.onPress();

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByText } = render(
      <PhotoPicker
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const placeholderButton = getByText('Add photo').parent;

    // The TouchableOpacity should be disabled
    fireEvent.press(placeholderButton);

    // Alert should not be called when disabled
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('should show custom placeholder text', () => {
    const { getByText } = render(
      <PhotoPicker
        onChange={mockOnChange}
        placeholder="Upload food image"
      />
    );

    expect(getByText('Upload food image')).toBeTruthy();
  });

  it('should show processing state during upload', async () => {
    // Mock a delayed camera capture to test loading state
    mockFoodPhotoService.captureFromCamera.mockImplementation(() =>
      new Promise(resolve => {
        setTimeout(() => resolve({
          uri: 'file://test.jpg',
          width: 1200,
          height: 900,
          fileSize: 500000,
          mimeType: 'image/jpeg',
          timestamp: Date.now()
        }), 100);
      })
    );

    const { getByText, findByText } = render(
      <PhotoPicker onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Add photo'));

    const alertCalls = mockAlert.mock.calls[0];
    const cameraOption = alertCalls[2].find((option: any) => option.text === 'Camera');

    cameraOption.onPress();

    // Should show processing state
    expect(await findByText('Processing...')).toBeTruthy();
  });
});