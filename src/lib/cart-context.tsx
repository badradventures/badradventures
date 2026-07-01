import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type CartItem = {
  uid: string;
  kind: "hike" | "equipment";
  itemId: string;
  title: string;
  pricePence: number;
  quantity: number;
  /** For hikes */
  spotsLeft?: number;
  /** For equipment */
  startDate?: string;
  endDate?: string;
  nights?: number;
  unitLabel?: string;
  image?: string;
  /** Equipment-specific */
  guests?: number;
  notes?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "uid">) => void;
  removeItem: (uid: string) => void;
  updateQuantity: (uid: string, quantity: number) => void;
  updateItem: (uid: string, patch: Partial<CartItem>) => void;
  clearCart: () => void;
  totalPence: number;
  itemCount: number;
};

const STORAGE_KEY = "badr.cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
  }, []);

  // Persist whenever items change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "uid">) => {
    const uid = `${item.kind}_${item.itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { ...item, uid }]);
  }, []);

  const removeItem = useCallback((uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }, []);

  const updateQuantity = useCallback((uid: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, quantity } : i)));
  }, []);

  const updateItem = useCallback((uid: string, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, ...patch } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalPence = items.reduce((sum, i) => sum + i.pricePence * i.quantity, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateItem, clearCart, totalPence, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    if (typeof window === "undefined") {
      // SSR stub — never used in the rendered HTML, but some pages
      // call useCart() at the top of the component tree.
      return {
        items: [],
        addItem: () => {},
        removeItem: () => {},
        updateQuantity: () => {},
        updateItem: () => {},
        clearCart: () => {},
        totalPence: 0,
        itemCount: 0,
      } satisfies CartContextType;
    }
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
