import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      isSyncing: false, // Track if currently syncing with server
      
      // Fetch wishlist from server
      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/wishlist');
          const items = response.data?.items?.map(item => ({
            ...item.product,
            addedAt: item.addedAt,
            notes: item.notes,
            priority: item.priority,
          })) || [];
          set({ items, isLoading: false });
          return items;
        } catch (error) {
          console.error('Failed to fetch wishlist:', error);
          set({ error: error.message, isLoading: false });
          // Keep local items if fetch fails
          return get().items;
        }
      },
      
      addItem: async (product) => {
        const exists = get().items.find(item => item._id === product._id);
        if (exists) {
          return { success: false, message: 'Already in wishlist' };
        }
        
        // Optimistically update UI
        set({ items: [...get().items, { ...product, addedAt: new Date().toISOString() }] });
        
        // Sync with server
        try {
          await api.post('/api/wishlist/items', {
            productId: product._id,
            notes: '',
            priority: 'medium'
          });
          return { success: true, message: 'Added to wishlist' };
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
          // Remove from local if server fails
          set({ items: get().items.filter(item => item._id !== product._id) });
          return { success: false, message: 'Failed to add to wishlist' };
        }
      },
      
      removeItem: async (productId) => {
        // Optimistically update UI
        const previousItems = get().items;
        set({ items: previousItems.filter(item => item._id !== productId) });
        
        // Sync with server
        try {
          await api.delete(`/api/wishlist/items/${productId}`);
          return { success: true, message: 'Removed from wishlist' };
        } catch (error) {
          console.error('Failed to remove from wishlist:', error);
          // Restore previous items if server fails
          set({ items: previousItems });
          return { success: false, message: 'Failed to remove from wishlist' };
        }
      },
      
      toggleItem: async (product) => {
        const exists = get().isInWishlist(product._id);
        if (exists) {
          return await get().removeItem(product._id);
        } else {
          return await get().addItem(product);
        }
      },
      
      clearWishlist: () => set({ items: [] }),
      
      isInWishlist: (productId) => {
        return get().items.some(item => item._id === productId);
      },
      
      getWishlistCount: () => get().items.length,
      
      getWishlistItems: () => get().items,
      
      // Check if product is in wishlist on server
      checkWishlistStatus: async (productId) => {
        try {
          const response = await api.get(`/api/wishlist/check/${productId}`);
          return response.data?.inWishlist || false;
        } catch (error) {
          return get().isInWishlist(productId);
        }
      },
      
      // Sync local wishlist with server (for initial load or recovery)
      syncWithServer: async () => {
        set({ isSyncing: true });
        try {
          await get().fetchWishlist();
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'wishlist-storage',
      version: 2,
    }
  )
);
