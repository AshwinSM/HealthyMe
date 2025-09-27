import { OfflineQueueManager, OfflineOperation } from '../base/OfflineQueueManager';
import { BaseFirebaseService } from '../base/BaseFirebaseService';

// Mock BaseFirebaseService
class MockService extends BaseFirebaseService<any> {
  constructor() {
    super('mockCollection');
  }

  async create(data: any) {
    return { success: true, data: { ...data, id: 'mock-id' } };
  }

  async update(id: string, data: any) {
    return { success: true, data: { id, ...data } };
  }

  async delete(id: string) {
    return { success: true, data: true };
  }
}

// Mock window and navigator
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('OfflineQueueManager', () => {
  let queueManager: OfflineQueueManager;
  let mockService: MockService;

  beforeEach(() => {
    queueManager = new OfflineQueueManager();
    mockService = new MockService();
    queueManager.registerService('mockCollection', mockService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    queueManager.destroy();
  });

  describe('registerService', () => {
    it('should register a service for a collection', () => {
      const newService = new MockService();
      queueManager.registerService('newCollection', newService);
      
      // Service registration is internal, so we test it indirectly
      expect(() => queueManager.registerService('newCollection', newService)).not.toThrow();
    });
  });

  describe('addOperation', () => {
    it('should add operation to queue when offline', async () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Test Item', value: 42 }
      };

      await queueManager.addOperation(operation);
      
      const status = queueManager.getQueueStatus();
      expect(status.pending).toBe(1);
      expect(status.processing).toBe(false);
    });

    it('should process operation immediately when online', async () => {
      // Mock online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const operation = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Test Item', value: 42 }
      };

      // Spy on the service create method
      const createSpy = jest.spyOn(mockService, 'create');
      createSpy.mockResolvedValueOnce({
        success: true,
        data: { id: 'created-id', ...operation.data },
        timestamp: new Date()
      });

      await queueManager.addOperation(operation);
      
      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = queueManager.getQueueStatus();
      expect(status.pending).toBe(0); // Should be processed
      expect(createSpy).toHaveBeenCalledWith(operation.data);
    });
  });

  describe('processQueue', () => {
    it('should process CREATE operations', async () => {
      // Mock offline initially
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Test Item', value: 42 }
      };

      await queueManager.addOperation(operation);
      
      // Mock coming back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const createSpy = jest.spyOn(mockService, 'create');
      createSpy.mockResolvedValueOnce({
        success: true,
        data: { id: 'created-id', ...operation.data },
        timestamp: new Date()
      });

      await queueManager.processQueue();
      
      const status = queueManager.getQueueStatus();
      expect(status.pending).toBe(0);
      expect(createSpy).toHaveBeenCalledWith(operation.data);
    });

    it('should process UPDATE operations', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'UPDATE' as const,
        collection: 'mockCollection',
        documentId: 'existing-id',
        data: { name: 'Updated Item' }
      };

      await queueManager.addOperation(operation);
      
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const updateSpy = jest.spyOn(mockService, 'update');
      updateSpy.mockResolvedValueOnce({
        success: true,
        data: { id: 'existing-id', ...operation.data },
        timestamp: new Date()
      });

      await queueManager.processQueue();
      
      expect(updateSpy).toHaveBeenCalledWith('existing-id', operation.data);
    });

    it('should process DELETE operations', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'DELETE' as const,
        collection: 'mockCollection',
        documentId: 'delete-id',
        data: {}
      };

      await queueManager.addOperation(operation);
      
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const deleteSpy = jest.spyOn(mockService, 'delete');
      deleteSpy.mockResolvedValueOnce({
        success: true,
        data: true,
        timestamp: new Date()
      });

      await queueManager.processQueue();
      
      expect(deleteSpy).toHaveBeenCalledWith('delete-id');
    });

    it('should retry failed operations up to 3 times', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Failing Item' }
      };

      await queueManager.addOperation(operation);
      
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      
      const createSpy = jest.spyOn(mockService, 'create');
      // Mock failure
      createSpy.mockResolvedValue({
        success: false,
        error: 'Network error',
        timestamp: new Date()
      });

      await queueManager.processQueue();
      
      // Wait for retries (this is simplified, actual implementation uses exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Operation should still be in queue after first failure
      let status = queueManager.getQueueStatus();
      expect(status.pending).toBe(1);
      
      // Process again to trigger retry
      await queueManager.processQueue();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      status = queueManager.getQueueStatus();
      expect(status.pending).toBe(1); // Still pending after 2nd failure
    });

    it('should not process when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Offline Item' }
      };

      await queueManager.addOperation(operation);
      
      const createSpy = jest.spyOn(mockService, 'create');
      
      await queueManager.processQueue();
      
      expect(createSpy).not.toHaveBeenCalled();
      
      const status = queueManager.getQueueStatus();
      expect(status.pending).toBe(1);
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status', async () => {
      const initialStatus = queueManager.getQueueStatus();
      expect(initialStatus.pending).toBe(0);
      expect(initialStatus.processing).toBe(false);
      
      // Add operation while offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      await queueManager.addOperation({
        type: 'CREATE',
        collection: 'mockCollection',
        data: { name: 'Test' }
      });
      
      const statusWithPending = queueManager.getQueueStatus();
      expect(statusWithPending.pending).toBe(1);
      expect(statusWithPending.processing).toBe(false);
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued operations', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      await queueManager.addOperation({
        type: 'CREATE',
        collection: 'mockCollection',
        data: { name: 'Item 1' }
      });
      
      await queueManager.addOperation({
        type: 'UPDATE',
        collection: 'mockCollection',
        documentId: 'update-id',
        data: { name: 'Item 2' }
      });
      
      expect(queueManager.getQueueStatus().pending).toBe(2);
      
      queueManager.clearQueue();
      
      expect(queueManager.getQueueStatus().pending).toBe(0);
    });
  });

  describe('getPendingOperations', () => {
    it('should return all pending operations', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const operation1 = {
        type: 'CREATE' as const,
        collection: 'mockCollection',
        data: { name: 'Item 1' }
      };
      
      const operation2 = {
        type: 'UPDATE' as const,
        collection: 'mockCollection',
        documentId: 'update-id',
        data: { name: 'Item 2' }
      };
      
      await queueManager.addOperation(operation1);
      await queueManager.addOperation(operation2);
      
      const pending = queueManager.getPendingOperations();
      expect(pending).toHaveLength(2);
      expect(pending[0].data).toEqual(operation1.data);
      expect(pending[1].data).toEqual(operation2.data);
    });
  });

  describe('removeOperation', () => {
    it('should remove specific operation from queue', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      await queueManager.addOperation({
        type: 'CREATE',
        collection: 'mockCollection',
        data: { name: 'Item 1' }
      });
      
      const pending = queueManager.getPendingOperations();
      const operationId = pending[0].id;
      
      const removed = queueManager.removeOperation(operationId);
      
      expect(removed).toBe(true);
      expect(queueManager.getQueueStatus().pending).toBe(0);
    });
    
    it('should return false for non-existent operation', () => {
      const removed = queueManager.removeOperation('non-existent-id');
      expect(removed).toBe(false);
    });
  });
});