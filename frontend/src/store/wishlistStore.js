import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const exists = get().items.find(item => item._id === product._id);
        if (!exists) {
          set({ items: [...get().items, { ...product, addedAt: new Date().toISOString() }] });
          return { success: true, message: 'Added to wishlist' };
        }
        return { success: false, message: 'Already in wishlist' };
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item._id !== productId) });
        return { success: true, message: 'Removed from wishlist' };
      },
      
      toggleItem: (product) => {
        const exists = get().isInWishlist(product._id);
        if (exists) {
          get().removeItem(product._id);
          return { success: true, message: 'Removed from wishlist', added: false };
        } else {
          get().addItem(product);
          return { success: true, message: 'Added to wishlist', added: true };
        }
      },
      
      clearWishlist: () => set({ items: [] }),
      
      isInWishlist: (productId) => {
        return get().items.some(item => item._id === productId);
      },
      
      getWishlistCount: () => get().items.length,
      
      getWishlistItems: () => get().items,
    }),
    {
      name: 'wishlist-storage',
      version: 1,
    }
  )
);
