import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Timestamp } from 'firebase/firestore';
import { MealType, MeasurementUnit } from '../types/health';

// Photo capture interfaces
export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  timestamp: number;
}

export interface ProcessedImage {
  originalUri: string;
  compressedUri: string;
  thumbnailUri: string;
  processingTime: number;
  compressionRatio: number;
}

export interface PhotoMetadata {
  userId: string;
  foodEntryId?: string;
  date: string;
  mealType: MealType;
  foodName?: string;
  uploadTimestamp: Timestamp;
}

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  uploadTime?: number;
  error?: string;
  storageRef?: string;
}

export interface StorageUsage {
  totalSizeMB: number;
  photoCount: number;
  remainingQuotaMB: number;
}

// Camera and gallery options
export interface CameraOptions {
  quality: number;
  allowsEditing: boolean;
  aspect: [number, number];
  maxWidth?: number;
  maxHeight?: number;
  mediaTypes: 'photo';
  includeBase64: boolean;
  exif: boolean;
}

export interface GalleryOptions extends CameraOptions {
  allowsMultipleSelection: boolean;
  selectionLimit?: number;
}

export interface ProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  autoRotate: boolean;
  stripMetadata: boolean;
}

export type ThumbnailSize = 'small' | 'medium' | 'large';

const THUMBNAIL_SIZES: Record<ThumbnailSize, { width: number; height: number }> = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 600 }
};

// Photo service interface
export interface PhotoService {
  captureFromCamera(options?: CameraOptions): Promise<PhotoResult>;
  selectFromGallery(options?: GalleryOptions): Promise<PhotoResult>;
  processImage(imageUri: string, options: ProcessingOptions): Promise<ProcessedImage>;
  generateThumbnail(imageUri: string, size: ThumbnailSize): Promise<string>;
  uploadFoodPhoto(imageUri: string, metadata: PhotoMetadata): Promise<UploadResult>;
  downloadPhoto(photoUrl: string): Promise<string | null>;
  deletePhoto(photoUrl: string): Promise<boolean>;
  getStorageUsage(userId: string): Promise<StorageUsage>;
}

// Main photo service implementation
export class FoodPhotoService implements PhotoService {
  private storage = getStorage();

  async captureFromCamera(options: CameraOptions = this.getDefaultCameraOptions()): Promise<PhotoResult> {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Camera permission is required to take photos');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing,
        aspect: options.aspect,
        quality: options.quality,
        base64: options.includeBase64,
        exif: options.exif
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Photo capture was cancelled');
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        fileSize: await this.getFileSize(asset.uri),
        mimeType: asset.mimeType || 'image/jpeg',
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Camera capture error:', error);
      throw new Error(`Failed to capture photo: ${error.message}`);
    }
  }

  async selectFromGallery(options: GalleryOptions = this.getDefaultGalleryOptions()): Promise<PhotoResult> {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Photo library permission is required to select photos');
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing,
        aspect: options.aspect,
        quality: options.quality,
        base64: options.includeBase64,
        exif: options.exif,
        allowsMultipleSelection: options.allowsMultipleSelection,
        selectionLimit: options.selectionLimit || 1
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Photo selection was cancelled');
      }

      const asset = result.assets[0]; // Take first photo for single selection

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        fileSize: await this.getFileSize(asset.uri),
        mimeType: asset.mimeType || 'image/jpeg',
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Gallery selection error:', error);
      throw new Error(`Failed to select photo: ${error.message}`);
    }
  }

  async processImage(
    imageUri: string,
    options: ProcessingOptions = this.getDefaultProcessingOptions()
  ): Promise<ProcessedImage> {
    const startTime = Date.now();

    try {
      // Process main image
      const actions: ImageManipulator.Action[] = [];

      // Resize if needed
      if (options.maxWidth || options.maxHeight) {
        actions.push({
          resize: {
            width: options.maxWidth,
            height: options.maxHeight
          }
        });
      }

      const processedResult = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: options.quality,
          format: this.getImageManipulatorFormat(options.format),
          base64: false
        }
      );

      // Generate thumbnail
      const thumbnailUri = await this.generateThumbnail(imageUri, 'medium');

      const processingTime = Date.now() - startTime;
      const originalSize = await this.getFileSize(imageUri);
      const processedSize = await this.getFileSize(processedResult.uri);
      const compressionRatio = processedSize / originalSize;

      return {
        originalUri: imageUri,
        compressedUri: processedResult.uri,
        thumbnailUri,
        processingTime,
        compressionRatio
      };
    } catch (error: any) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async generateThumbnail(imageUri: string, size: ThumbnailSize): Promise<string> {
    try {
      const dimensions = THUMBNAIL_SIZES[size];

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: dimensions.width,
              height: dimensions.height
            }
          }
        ],
        {
          compress: 0.8, // Good balance of quality and size for thumbnails
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      return result.uri;
    } catch (error: any) {
      console.error('Thumbnail generation error:', error);
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  async uploadFoodPhoto(imageUri: string, metadata: PhotoMetadata): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      // Process image before upload
      const processed = await this.processImage(imageUri, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        format: 'jpeg',
        autoRotate: true,
        stripMetadata: true
      });

      // Create storage path
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const storagePath = this.createStoragePath(metadata, fileName);

      // Convert image to blob
      const response = await fetch(processed.compressedUri);
      const blob = await response.blob();

      // Create storage reference and upload
      const storageRef = ref(this.storage, storagePath);

      await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          userId: metadata.userId,
          date: metadata.date,
          mealType: metadata.mealType,
          foodName: metadata.foodName || '',
          uploadTimestamp: metadata.uploadTimestamp.toISOString(),
          originalSize: (await this.getFileSize(imageUri)).toString(),
          processedSize: blob.size.toString(),
          compressionRatio: processed.compressionRatio.toString()
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      const uploadTime = Date.now() - startTime;

      // Clean up local processed files
      await this.cleanupLocalFiles([processed.compressedUri, processed.thumbnailUri]);

      return {
        success: true,
        downloadURL,
        uploadTime,
        storageRef: storagePath
      };
    } catch (error: any) {
      console.error('Photo upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }
  }

  async downloadPhoto(photoUrl: string): Promise<string | null> {
    try {
      const fileName = photoUrl.substring(photoUrl.lastIndexOf('/') + 1);
      const localPath = `${FileSystem.cacheDirectory}photos/${fileName}`;

      // Check if already cached
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }

      // Ensure photos directory exists
      const photosDir = `${FileSystem.cacheDirectory}photos/`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      // Download and cache
      const downloadResult = await FileSystem.downloadAsync(photoUrl, localPath);

      if (downloadResult.status === 200) {
        return downloadResult.uri;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error: any) {
      console.error('Photo download error:', error);
      return null;
    }
  }

  async deletePhoto(photoUrl: string): Promise<boolean> {
    try {
      // Delete from Firebase Storage
      const storageRef = ref(this.storage, photoUrl);
      await deleteObject(storageRef);

      // Delete from local cache if exists
      const fileName = photoUrl.substring(photoUrl.lastIndexOf('/') + 1);
      const localPath = `${FileSystem.cacheDirectory}photos/${fileName}`;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localPath);
      }

      return true;
    } catch (error: any) {
      console.error('Photo deletion error:', error);
      return false;
    }
  }

  async getStorageUsage(userId: string): Promise<StorageUsage> {
    // This would require Firebase Functions to calculate storage usage
    // For Phase 3, return placeholder data
    return {
      totalSizeMB: 0,
      photoCount: 0,
      remainingQuotaMB: 1000 // 1GB default quota
    };
  }

  private createStoragePath(metadata: PhotoMetadata, fileName: string): string {
    return `users/${metadata.userId}/food-photos/${metadata.date}/${metadata.mealType}/${fileName}`;
  }

  private getDefaultCameraOptions(): CameraOptions {
    return {
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
      maxWidth: 1200,
      maxHeight: 1200,
      mediaTypes: 'photo',
      includeBase64: false,
      exif: true
    };
  }

  private getDefaultGalleryOptions(): GalleryOptions {
    return {
      ...this.getDefaultCameraOptions(),
      allowsMultipleSelection: false,
      selectionLimit: 1
    };
  }

  private getDefaultProcessingOptions(): ProcessingOptions {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      format: 'jpeg',
      autoRotate: true,
      stripMetadata: true
    };
  }

  private getImageManipulatorFormat(format: string): ImageManipulator.SaveFormat {
    switch (format) {
      case 'png': return ImageManipulator.SaveFormat.PNG;
      case 'webp': return ImageManipulator.SaveFormat.WEBP;
      default: return ImageManipulator.SaveFormat.JPEG;
    }
  }

  private async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch {
      return 0;
    }
  }

  private async cleanupLocalFiles(uris: string[]): Promise<void> {
    for (const uri of uris) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && uri.includes('ImageManipulator')) {
          await FileSystem.deleteAsync(uri);
        }
      } catch (error) {
        console.warn('Failed to cleanup local file:', uri, error);
      }
    }
  }
}

// Offline queue management
export interface QueuedPhotoUpload {
  id: string;
  imageUri: string;
  metadata: PhotoMetadata;
  retryCount: number;
  createdAt: Timestamp;
  lastAttempt?: Timestamp;
}

export class PhotoUploadQueue {
  private queue: QueuedPhotoUpload[] = [];
  private isProcessing = false;

  async addToQueue(imageUri: string, metadata: PhotoMetadata): Promise<string> {
    const queueId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queuedUpload: QueuedPhotoUpload = {
      id: queueId,
      imageUri,
      metadata,
      retryCount: 0,
      createdAt: Timestamp.now()
    };

    this.queue.push(queuedUpload);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueId;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const photoService = new FoodPhotoService();

    while (this.queue.length > 0) {
      const upload = this.queue[0];

      try {
        const result = await photoService.uploadFoodPhoto(upload.imageUri, upload.metadata);

        if (result.success) {
          // Upload successful - remove from queue
          this.queue.shift();

          // Notify UI of successful upload
          this.notifyUploadComplete(upload.id, result.downloadURL!);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        upload.retryCount++;
        upload.lastAttempt = Timestamp.now();

        if (upload.retryCount >= 3) {
          // Remove failed upload after 3 attempts
          this.queue.shift();
          this.notifyUploadFailed(upload.id, error as Error);
        } else {
          // Wait before retrying
          await this.delay(Math.pow(2, upload.retryCount) * 1000);
        }

        break; // Stop processing on error
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyUploadComplete(queueId: string, downloadURL: string): void {
    console.log(`Photo upload completed: ${queueId} -> ${downloadURL}`);
  }

  private notifyUploadFailed(queueId: string, error: Error): void {
    console.error(`Photo upload failed: ${queueId}`, error);
  }

  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.isProcessing
    };
  }
}

// Export service instances
export const foodPhotoService = new FoodPhotoService();
export const photoUploadQueue = new PhotoUploadQueue();