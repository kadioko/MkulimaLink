import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncQueue {
  pendingActions: OfflineAction[];
  lastSyncTime: number;
}

class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private async initialize() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came back online, start syncing
      if (!wasOnline && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Check initial network status
    const networkState = await NetInfo.fetch();
    this.isOnline = networkState.isConnected ?? false;
  }

  // Add action to offline queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getSyncQueue();
    queue.pendingActions.push(offlineAction);
    await this.saveSyncQueue(queue);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return offlineAction.id;
  }

  // Sync all pending actions
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await this.getSyncQueue();
      const actions = [...queue.pendingActions];

      for (const action of actions) {
        try {
          await this.executeAction(action);
          // Remove successfully executed action
          queue.pendingActions = queue.pendingActions.filter(a => a.id !== action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          action.retryCount++;

          // Remove action if it failed too many times
          if (action.retryCount >= 3) {
            queue.pendingActions = queue.pendingActions.filter(a => a.id !== action.id);
            console.warn('Removed failed action after 3 retries:', action.id);
          }
        }
      }

      queue.lastSyncTime = Date.now();
      await this.saveSyncQueue(queue);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeAction(action: OfflineAction) {
    const { type, endpoint, data } = action;

    switch (type) {
      case 'create':
        await apiService.post(endpoint, data);
        break;
      case 'update':
        await apiService.put(endpoint, data);
        break;
      case 'delete':
        await apiService.delete(endpoint);
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  // Cache data for offline access
  async cacheData(key: string, data: any): Promise<void> {
    try {
      const cacheKey = `cache_${key}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Get cached data
  async getCachedData<T = any>(key: string): Promise<T | null> {
    try {
      const cacheKey = `cache_${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() > cacheData.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Clear expired cache
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (Date.now() > cacheData.expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  // Get sync queue from storage
  private async getSyncQueue(): Promise<SyncQueue> {
    try {
      const stored = await AsyncStorage.getItem('sync_queue');
      return stored ? JSON.parse(stored) : { pendingActions: [], lastSyncTime: 0 };
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return { pendingActions: [], lastSyncTime: 0 };
    }
  }

  // Save sync queue to storage
  private async saveSyncQueue(queue: SyncQueue): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Get sync status
  async getSyncStatus() {
    const queue = await this.getSyncQueue();
    return {
      isOnline: this.isOnline,
      pendingActionsCount: queue.pendingActions.length,
      lastSyncTime: queue.lastSyncTime,
      syncInProgress: this.syncInProgress,
    };
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.syncPendingActions();
  }

  // Clear all pending actions (use with caution)
  async clearPendingActions(): Promise<void> {
    const queue: SyncQueue = { pendingActions: [], lastSyncTime: Date.now() };
    await this.saveSyncQueue(queue);
  }
}

// Create singleton instance
export const offlineSyncManager = OfflineSyncManager.getInstance();

// Helper hooks for React components
export const useOfflineSync = () => {
  const queueAction = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) =>
    offlineSyncManager.queueAction(action);

  const getSyncStatus = () => offlineSyncManager.getSyncStatus();

  const forceSync = () => offlineSyncManager.forceSync();

  const cacheData = (key: string, data: any) =>
    offlineSyncManager.cacheData(key, data);

  const getCachedData = <T = any>(key: string) =>
    offlineSyncManager.getCachedData<T>(key);

  return {
    queueAction,
    getSyncStatus,
    forceSync,
    cacheData,
    getCachedData,
  };
};

export default offlineSyncManager;
