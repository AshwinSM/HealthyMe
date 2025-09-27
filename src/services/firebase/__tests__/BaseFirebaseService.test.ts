import { BaseFirebaseService, QueryFilter } from '../base/BaseFirebaseService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  writeBatch: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    }))
  }
}));

// Mock the config
jest.mock('../../../config', () => ({
  db: {}
}));

interface TestEntity {
  id: string;
  name: string;
  value: number;
  createdAt?: any;
  updatedAt?: any;
}

class TestService extends BaseFirebaseService<TestEntity> {
  constructor() {
    super('testCollection');
  }

  protected generateDocumentId(data: any): string {
    return `test_${data.name}_${Date.now()}`;
  }

  protected validateData(data: TestEntity): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Name is required');
    }
    
    if (data.value < 0) {
      errors.push('Value must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

describe('BaseFirebaseService', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document successfully', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValueOnce(undefined);

      const testData = {
        name: 'Test Item',
        value: 42
      };

      const result = await service.create(testData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Test Item',
        value: 42
      });
      expect(result.data?.id).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
      expect(result.data?.updatedAt).toBeDefined();
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should fail validation and return error', async () => {
      const testData = {
        name: '', // Invalid: empty name
        value: -5 // Invalid: negative value
      };

      const result = await service.create(testData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('Name is required');
      expect(result.message).toContain('Value must be non-negative');
    });

    it('should handle Firebase errors', async () => {
      const mockSetDoc = require('firebase/firestore').setDoc;
      const firebaseError = new Error('Permission denied');
      (firebaseError as any).code = 'permission-denied';
      mockSetDoc.mockRejectedValueOnce(firebaseError);

      const testData = {
        name: 'Test Item',
        value: 42
      };

      const result = await service.create(testData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission-denied');
    });
  });

  describe('getById', () => {
    it('should retrieve a document successfully', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          id: 'test_id',
          name: 'Test Item',
          value: 42,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      };
      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await service.getById('test_id');

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'test_id',
        name: 'Test Item',
        value: 42
      });
    });

    it('should return not found when document does not exist', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDocSnap = {
        exists: () => false
      };
      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await service.getById('nonexistent_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should update a document successfully', async () => {
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      const mockGetDoc = require('firebase/firestore').getDoc;
      
      // Mock the getById call after update
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          id: 'test_id',
          name: 'Updated Item',
          value: 100,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      };
      
      mockUpdateDoc.mockResolvedValueOnce(undefined);
      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const updateData = {
        name: 'Updated Item',
        value: 100
      };

      const result = await service.update('test_id', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Item');
      expect(result.data?.value).toBe(100);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a document successfully', async () => {
      const mockDeleteDoc = require('firebase/firestore').deleteDoc;
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      const result = await service.delete('test_id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      const mockQuery = require('firebase/firestore').query;
      const mockWhere = require('firebase/firestore').where;
      const mockOrderBy = require('firebase/firestore').orderBy;
      
      const mockQuerySnapshot = {
        docs: [
          {
            data: () => ({
              id: 'test_1',
              name: 'Test Item 1',
              value: 10
            })
          },
          {
            data: () => ({
              id: 'test_2',
              name: 'Test Item 2',
              value: 20
            })
          }
        ]
      };

      mockGetDocs.mockResolvedValueOnce(mockQuerySnapshot);
      mockQuery.mockReturnValueOnce('mock-query');
      mockWhere.mockReturnValue('mock-where');
      mockOrderBy.mockReturnValue('mock-order-by');

      const filters: QueryFilter[] = [
        { field: 'value', operator: '>', value: 5 }
      ];

      const result = await service.query(filters, 'name', 'asc');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Test Item 1');
      expect(result.data?.[1].name).toBe('Test Item 2');
    });
  });

  describe('createBatch', () => {
    beforeEach(() => {
      const mockWriteBatch = require('firebase/firestore').writeBatch;
      const mockBatch = {
        set: jest.fn(),
        commit: jest.fn().mockResolvedValueOnce(undefined)
      };
      mockWriteBatch.mockReturnValue(mockBatch);
    });

    it('should create multiple documents in batch', async () => {
      const testItems = [
        { name: 'Item 1', value: 10 },
        { name: 'Item 2', value: 20 },
        { name: 'Item 3', value: 30 }
      ];

      const result = await service.createBatch(testItems);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      
      const mockBatch = require('firebase/firestore').writeBatch();
      expect(mockBatch.set).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should fail batch creation on validation error', async () => {
      const testItems = [
        { name: 'Valid Item', value: 10 },
        { name: '', value: -5 } // Invalid item
      ];

      const result = await service.createBatch(testItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe('BATCH_VALIDATION_ERROR');
    });
  });

  describe('subscribe', () => {
    it('should set up subscription correctly', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValueOnce(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = service.subscribe('test_id', callback);

      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('subscribeToQuery', () => {
    it('should set up query subscription correctly', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const mockQuery = require('firebase/firestore').query;
      const mockWhere = require('firebase/firestore').where;
      const mockUnsubscribe = jest.fn();
      
      mockOnSnapshot.mockReturnValueOnce(mockUnsubscribe);
      mockQuery.mockReturnValueOnce('mock-query');
      mockWhere.mockReturnValue('mock-where');

      const filters: QueryFilter[] = [
        { field: 'value', operator: '>', value: 5 }
      ];
      const callback = jest.fn();
      
      const unsubscribe = service.subscribeToQuery(filters, callback);

      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});