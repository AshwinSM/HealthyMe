import { Unsubscribe } from 'firebase/firestore';

/**
 * Manages real-time subscriptions to prevent memory leaks
 * Provides centralized subscription lifecycle management
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, Unsubscribe>();

  /**
   * Add a subscription with a unique key
   * Automatically cleans up existing subscription if key already exists
   */
  subscribe(key: string, unsubscribe: Unsubscribe): void {
    // Clean up existing subscription if exists
    this.unsubscribe(key);
    this.subscriptions.set(key, unsubscribe);
  }

  /**
   * Remove and clean up a specific subscription
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Remove and clean up all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Get list of active subscription keys
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a subscription key is active
   */
  hasSubscription(key: string): boolean {
    return this.subscriptions.has(key);
  }

  /**
   * Get total number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Create a scoped subscription manager for specific components
   */
  createScope(): SubscriptionManager {
    return new SubscriptionManager();
  }
}

// Global subscription manager instance
export const globalSubscriptionManager = new SubscriptionManager();

/**
 * Hook for React components to create a scoped subscription manager
 * Automatically cleans up on unmount
 */
export const useSubscriptionManager = () => {
  const manager = new SubscriptionManager();

  // Return cleanup function for use in useEffect
  const cleanup = () => {
    manager.unsubscribeAll();
  };

  return { manager, cleanup };
};