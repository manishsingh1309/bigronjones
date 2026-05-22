
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/data/products";

export type CartItem = Product & { quantity: number };

type CartStore = {
  items: CartItem[];
  hydrated: boolean;
  cartCount: number;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  setHydrated: (v: boolean) => void;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      cartCount: 0,
      addItem: (product) => {
        const existing = get().items.find((i) => i.id === product.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            cartCount: state.cartCount + 1,
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...product, quantity: 1 }],
            cartCount: state.cartCount + 1,
          }));
        }
      },
      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          cartCount: Math.max(0, state.cartCount - item.quantity),
        }));
      },
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const diff = quantity - item.quantity;
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
          cartCount: Math.max(0, state.cartCount + diff),
        }));
      },
      clearCart: () => set({ items: [], cartCount: 0 }),
      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "bigronjones-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartCount: state.cartCount }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
