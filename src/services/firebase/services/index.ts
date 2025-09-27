// Service implementations
export { UserProfileService, userProfileService } from './UserProfileService';
export { FoodEntryService, foodEntryService } from './FoodEntryService';
export { WeightEntryService, weightEntryService } from './WeightEntryService';
export { WaterEntryService, waterEntryService } from './WaterEntryService';
export { ActivityEntryService, activityEntryService } from './ActivityEntryService';

// Base infrastructure
export { BaseFirebaseService } from '../base/BaseFirebaseService';
export { SubscriptionManager, globalSubscriptionManager, useSubscriptionManager } from '../base/SubscriptionManager';
export { OfflineQueueManager, globalOfflineQueue } from '../base/OfflineQueueManager';
export { QueryOptimizer, globalQueryOptimizer } from '../base/QueryOptimizer';

// Types
export type { QueryFilter, BatchOperation } from '../base/BaseFirebaseService';
export type { OfflineOperation, QueueStatus } from '../base/OfflineQueueManager';