import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  Timestamp,
  FirestoreDataConverter,
  Unsubscribe,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../../config';
import { ApiResponse } from '../../../types';

export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains';
  value: any;
}

export interface BatchOperation<T> {
  id: string;
  data: Partial<T>;
}

/**
 * Abstract base class for Firebase service operations
 * Provides common CRUD operations, real-time subscriptions, and batch operations
 */
export abstract class BaseFirebaseService<T extends { id: string; createdAt?: Timestamp; updatedAt?: Timestamp }> {
  protected collectionName: string;
  protected converter?: FirestoreDataConverter<T>;

  constructor(collectionName: string, converter?: FirestoreDataConverter<T>) {
    this.collectionName = collectionName;
    this.converter = converter;
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<T>> {
    try {
      const now = Timestamp.now();
      const id = this.generateDocumentId(data);
      
      const document: T = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now
      } as T;

      // Validate data before creation
      const validation = this.validateData(document);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.errors.join(', '),
          timestamp: now
        };
      }

      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, document, { converter: this.converter });

      return {
        success: true,
        data: document,
        message: 'Document created successfully',
        timestamp: now
      };
    } catch (error: any) {
      console.error(`${this.collectionName} creation error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to create ${this.collectionName} document`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Get document by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as T;
        return {
          success: true,
          data: data,
          message: 'Document retrieved successfully',
          timestamp: Timestamp.now()
        };
      } else {
        return {
          success: false,
          error: 'DOCUMENT_NOT_FOUND',
          message: `${this.collectionName} document not found`,
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      console.error(`${this.collectionName} get error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to get ${this.collectionName} document`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const now = Timestamp.now();
      const updateData = {
        ...data,
        updatedAt: now
      };

      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedDoc = await this.getById(id);
      
      if (updatedDoc.success) {
        return {
          success: true,
          data: updatedDoc.data!,
          message: 'Document updated successfully',
          timestamp: now
        };
      } else {
        return updatedDoc;
      }
    } catch (error: any) {
      console.error(`${this.collectionName} update error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to update ${this.collectionName} document`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        data: true,
        message: 'Document deleted successfully',
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error(`${this.collectionName} delete error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to delete ${this.collectionName} document`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Query documents with filters
   */
  async query(filters: QueryFilter[], orderByField?: string, orderDirection: 'asc' | 'desc' = 'asc'): Promise<ApiResponse<T[]>> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });

      // Add order by clause
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => doc.data() as T);

      return {
        success: true,
        data: documents,
        message: `Retrieved ${documents.length} documents`,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error(`${this.collectionName} query error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to query ${this.collectionName} documents`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Subscribe to document changes
   */
  subscribe(id: string, callback: (data: T | null) => void): Unsubscribe {
    const docRef = doc(db, this.collectionName, id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as T);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`${this.collectionName} subscription error:`, error);
      callback(null);
    });
  }

  /**
   * Subscribe to query results
   */
  subscribeToQuery(filters: QueryFilter[], callback: (data: T[]) => void, orderByField?: string): Unsubscribe {
    const collectionRef = collection(db, this.collectionName);
    const constraints: QueryConstraint[] = [];

    // Add where clauses
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });

    // Add order by clause
    if (orderByField) {
      constraints.push(orderBy(orderByField, 'asc'));
    }

    const q = query(collectionRef, ...constraints);

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => doc.data() as T);
      callback(documents);
    }, (error) => {
      console.error(`${this.collectionName} query subscription error:`, error);
      callback([]);
    });
  }

  /**
   * Create multiple documents in batch
   */
  async createBatch(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<T[]>> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      const documents: T[] = [];

      for (const item of items) {
        const id = this.generateDocumentId(item);
        const document: T = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now
        } as T;

        // Validate each document
        const validation = this.validateData(document);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'BATCH_VALIDATION_ERROR',
            message: `Validation failed for document: ${validation.errors.join(', ')}`,
            timestamp: now
          };
        }

        const docRef = doc(db, this.collectionName, id);
        batch.set(docRef, document, { converter: this.converter });
        documents.push(document);
      }

      await batch.commit();

      return {
        success: true,
        data: documents,
        message: `Successfully created ${documents.length} documents`,
        timestamp: now
      };
    } catch (error: any) {
      console.error(`${this.collectionName} batch creation error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to create batch of ${this.collectionName} documents`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Update multiple documents in batch
   */
  async updateBatch(updates: BatchOperation<T>[]): Promise<ApiResponse<boolean>> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (const update of updates) {
        const docRef = doc(db, this.collectionName, update.id);
        const updateData = {
          ...update.data,
          updatedAt: now
        };
        
        batch.update(docRef, updateData);
      }

      await batch.commit();

      return {
        success: true,
        data: true,
        message: `Successfully updated ${updates.length} documents`,
        timestamp: now
      };
    } catch (error: any) {
      console.error(`${this.collectionName} batch update error:`, error);
      return {
        success: false,
        error: `${error.code}: ${error.message}`,
        message: `Failed to update batch of ${this.collectionName} documents`,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Generate document ID - can be overridden by subclasses
   */
  protected generateDocumentId(data: any): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate document data - can be overridden by subclasses
   */
  protected validateData(data: T): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation - ensure required fields exist
    if (!data.id) {
      errors.push('ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get collection reference
   */
  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }
}