import { BaseFirebaseService } from './BaseFirebaseService';

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface QueueStatus {
  pending: number;
  processing: boolean;
  lastSync?: number;
}

/**
 * Manages offline operations queue for when network is unavailable
 * Automatically syncs when network connection is restored
 */
export class OfflineQueueManager {
  private queue: OfflineOperation[] = [];
  private isProcessing = false;
  private services = new Map<string, BaseFirebaseService<any>>();

  constructor() {
    // Listen for network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('offline', () => this.onNetworkOffline());
    }
  }

  /**
   * Register a service for offline operations
   */
  registerService<T>(collectionName: string, service: BaseFirebaseService<T>): void {
    this.services.set(collectionName, service);
  }

  /**
   * Add operation to queue
   */
  async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOperation: OfflineOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(queuedOperation);
    console.log('Operation added to offline queue:', queuedOperation);

    // Attempt immediate processing if online
    if (this.isOnline()) {
      await this.processQueue();
    }
  }

  /**
   * Process all queued operations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline()) {
      return;
    }

    console.log('Processing offline queue with', this.queue.length, 'operations');
    this.isProcessing = true;

    const processedOperations: string[] = [];

    for (let i = 0; i < this.queue.length; i++) {
      const operation = this.queue[i];
      
      try {
        await this.executeOperation(operation);
        processedOperations.push(operation.id);
        console.log('Successfully processed offline operation:', operation.id);
      } catch (error) {
        operation.retryCount++;
        console.error(`Operation ${operation.id} failed (attempt ${operation.retryCount}):`, error);
        
        if (operation.retryCount >= 3) {
          console.error('Operation failed after 3 retries, removing from queue:', operation);
          processedOperations.push(operation.id);
        } else {
          // Wait before retry using exponential backoff
          await this.delay(Math.pow(2, operation.retryCount) * 1000);
        }
        
        // Stop processing on error to avoid cascade failures
        break;
      }
    }

    // Remove processed operations from queue
    this.queue = this.queue.filter(op => !processedOperations.includes(op.id));

    this.isProcessing = false;
    
    if (this.queue.length > 0 && this.isOnline()) {
      // Retry remaining operations after a delay
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  /**
   * Execute a single offline operation
   */
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const service = this.services.get(operation.collection);
    
    if (!service) {
      throw new Error(`No service registered for collection: ${operation.collection}`);
    }

    switch (operation.type) {
      case 'CREATE':
        const createResult = await service.create(operation.data);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Create operation failed');
        }
        break;

      case 'UPDATE':
        if (!operation.documentId) {
          throw new Error('Document ID required for UPDATE operation');
        }
        const updateResult = await service.update(operation.documentId, operation.data);
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Update operation failed');
        }
        break;

      case 'DELETE':
        if (!operation.documentId) {
          throw new Error('Document ID required for DELETE operation');
        }
        const deleteResult = await service.delete(operation.documentId);
        if (!deleteResult.success) {
          throw new Error(deleteResult.error || 'Delete operation failed');
        }
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      lastSync: this.queue.length === 0 ? Date.now() : undefined
    };
  }

  /**
   * Clear all queued operations
   */
  clearQueue(): void {
    this.queue = [];
    console.log('Offline queue cleared');
  }

  /**
   * Get all pending operations
   */
  getPendingOperations(): OfflineOperation[] {
    return [...this.queue];
  }

  /**
   * Remove specific operation from queue
   */
  removeOperation(operationId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(op => op.id !== operationId);
    return this.queue.length < initialLength;
  }

  /**
   * Check if device is online
   */
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online in non-browser environments
  }

  /**
   * Handle network going offline
   */
  private onNetworkOffline(): void {
    console.log('Network went offline, operations will be queued');
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy the offline queue manager
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.processQueue());
      window.removeEventListener('offline', () => this.onNetworkOffline());
    }
    this.clearQueue();
    this.services.clear();
  }
}

// Global offline queue manager instance
export const globalOfflineQueue = new OfflineQueueManager();