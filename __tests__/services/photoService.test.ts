import { FoodPhotoService, PhotoUploadQueue } from '../../src/services/photoService';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('expo-image-manipulator');
jest.mock('expo-file-system');
jest.mock('firebase/storage');

const mockImagePicker = require('expo-image-picker');
const mockImageManipulator = require('expo-image-manipulator');
const mockFileSystem = require('expo-file-system');

describe('FoodPhotoService', () => {
  let photoService: FoodPhotoService;

  beforeEach(() => {
    photoService = new FoodPhotoService();
    jest.clearAllMocks();
  });

  describe('captureFromCamera', () => {
    it('should successfully capture photo from camera', async () => {
      // Mock permission granted
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true
      });

      // Mock successful camera capture
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-photo.jpg',
          width: 1200,
          height: 900,
          mimeType: 'image/jpeg'
        }]
      });

      // Mock file size
      mockFileSystem.getInfoAsync.mockResolvedValue({
        size: 500000
      });

      const result = await photoService.captureFromCamera();

      expect(result).toEqual({
        uri: 'file://test-photo.jpg',
        width: 1200,
        height: 900,
        fileSize: 500000,
        mimeType: 'image/jpeg',
        timestamp: expect.any(Number)
      });

      expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledWith({
        mediaTypes: mockImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
        base64: false,
        exif: true
      });
    });

    it('should throw error when camera permission denied', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: false
      });

      await expect(photoService.captureFromCamera()).rejects.toThrow(
        'Failed to capture photo: Camera permission is required to take photos'
      );
    });

    it('should throw error when camera capture cancelled', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
        granted: true
      });

      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: true
      });

      await expect(photoService.captureFromCamera()).rejects.toThrow(
        'Failed to capture photo: Photo capture was cancelled'
      );
    });
  });

  describe('selectFromGallery', () => {
    it('should successfully select photo from gallery', async () => {
      // Mock permission granted
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: true
      });

      // Mock successful gallery selection
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://gallery-photo.jpg',
          width: 800,
          height: 600,
          mimeType: 'image/jpeg'
        }]
      });

      // Mock file size
      mockFileSystem.getInfoAsync.mockResolvedValue({
        size: 300000
      });

      const result = await photoService.selectFromGallery();

      expect(result).toEqual({
        uri: 'file://gallery-photo.jpg',
        width: 800,
        height: 600,
        fileSize: 300000,
        mimeType: 'image/jpeg',
        timestamp: expect.any(Number)
      });

      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    it('should throw error when gallery permission denied', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
        granted: false
      });

      await expect(photoService.selectFromGallery()).rejects.toThrow(
        'Failed to select photo: Photo library permission is required to select photos'
      );
    });
  });

  describe('processImage', () => {
    it('should successfully process and compress image', async () => {
      const originalUri = 'file://original.jpg';
      const compressedUri = 'file://compressed.jpg';
      const thumbnailUri = 'file://thumbnail.jpg';

      // Mock image manipulation
      mockImageManipulator.manipulateAsync
        .mockResolvedValueOnce({ uri: compressedUri })
        .mockResolvedValueOnce({ uri: thumbnailUri });

      // Mock file sizes
      mockFileSystem.getInfoAsync
        .mockResolvedValueOnce({ size: 1000000 }) // Original
        .mockResolvedValueOnce({ size: 400000 });  // Compressed

      const result = await photoService.processImage(originalUri);

      expect(result).toEqual({
        originalUri,
        compressedUri,
        thumbnailUri,
        processingTime: expect.any(Number),
        compressionRatio: 0.4
      });

      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);
    });

    it('should handle image processing errors', async () => {
      mockImageManipulator.manipulateAsync.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        photoService.processImage('file://test.jpg')
      ).rejects.toThrow('Failed to process image: Processing failed');
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with correct dimensions', async () => {
      const thumbnailUri = 'file://thumbnail.jpg';

      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: thumbnailUri
      });

      const result = await photoService.generateThumbnail('file://test.jpg', 'medium');

      expect(result).toBe(thumbnailUri);
      expect(mockImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file://test.jpg',
        [{ resize: { width: 300, height: 300 } }],
        {
          compress: 0.8,
          format: mockImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );
    });
  });

  describe('uploadFoodPhoto', () => {
    it('should upload photo with proper metadata', async () => {
      const imageUri = 'file://test.jpg';
      const metadata = {
        userId: 'user123',
        date: '2025-09-21',
        mealType: 'breakfast' as const,
        foodName: 'scrambled eggs',
        uploadTimestamp: Timestamp.now()
      };

      // Mock successful processing
      mockImageManipulator.manipulateAsync.mockResolvedValue({
        uri: 'file://compressed.jpg'
      });

      // Mock file operations
      mockFileSystem.getInfoAsync.mockResolvedValue({ size: 500000 });
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob())
      });

      // Mock Firebase upload (would need to mock the actual Firebase functions)
      const result = await photoService.uploadFoodPhoto(imageUri, metadata);

      expect(result.success).toBe(true);
      expect(result.downloadURL).toBeDefined();
    });
  });

  describe('downloadPhoto', () => {
    it('should return cached photo if exists', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const localPath = `${mockFileSystem.cacheDirectory}photos/photo.jpg`;

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true
      });

      const result = await photoService.downloadPhoto(photoUrl);

      expect(result).toBe(localPath);
      expect(mockFileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it('should download and cache photo if not exists', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const localPath = `${mockFileSystem.cacheDirectory}photos/photo.jpg`;

      mockFileSystem.getInfoAsync
        .mockResolvedValueOnce({ exists: false })  // Directory check
        .mockResolvedValueOnce({ exists: false }); // File check

      mockFileSystem.makeDirectoryAsync.mockResolvedValue(undefined);
      mockFileSystem.downloadAsync.mockResolvedValue({
        status: 200,
        uri: localPath
      });

      const result = await photoService.downloadPhoto(photoUrl);

      expect(result).toBe(localPath);
      expect(mockFileSystem.downloadAsync).toHaveBeenCalledWith(photoUrl, localPath);
    });
  });
});

describe('PhotoUploadQueue', () => {
  let uploadQueue: PhotoUploadQueue;

  beforeEach(() => {
    uploadQueue = new PhotoUploadQueue();
    jest.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add photo to upload queue', async () => {
      const imageUri = 'file://test.jpg';
      const metadata = {
        userId: 'user123',
        date: '2025-09-21',
        mealType: 'breakfast' as const,
        uploadTimestamp: Timestamp.now()
      };

      const queueId = await uploadQueue.addToQueue(imageUri, metadata);

      expect(queueId).toMatch(/^photo_\d+_[a-z0-9]+$/);

      const status = uploadQueue.getQueueStatus();
      expect(status.pending).toBe(1);
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status', () => {
      const status = uploadQueue.getQueueStatus();

      expect(status).toEqual({
        pending: 0,
        processing: false
      });
    });
  });
});