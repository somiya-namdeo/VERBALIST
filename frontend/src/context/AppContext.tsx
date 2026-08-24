import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export type Product = {
  id: string;
  name: string;
  size: string;
  category: string;
  price: number;
  originalPrice: number | null;
  discount: string | null;
  organic?: boolean;
  image: string;
};

export type CartItem = {
  id: string;
  name: string;
  size: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  quantity: number;
  checked: boolean;
  image: string;
  cartItemId?: string;
};

type AppContextType = {
  products: Product[];
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (id: string, delta: number) => Promise<void>;
  toggleCartChecked: (id: string) => Promise<void>;
  clearCart: () => void;
  token?: string | null;
  syncShoppingList?: (customToken?: string) => void;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
};

const initialProducts: Product[] = [];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("verbalist_token");
    if (savedToken) {
      setToken(savedToken);
      fetch(`${API_BASE}/api/products?size=50`)
        .then(r => r.json())
        .then(prodData => {
          const realProducts = (prodData.items || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            size: p.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : "",
            category: p.category,
            price: p.price,
            originalPrice: p.sale_price || null,
            discount: p.sale_price ? "SALE" : null,
            organic: p.is_organic,
            image: p.image_url || "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=200&q=80"
          }));
          if (realProducts.length > 0) {
            setProducts(realProducts);
          }
          syncShoppingList(savedToken);
        })
        .finally(() => setIsAuthLoading(false));
      return;
    }

    fetch(`${API_BASE}/api/dev/login`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem("verbalist_token", data.access_token);
          setToken(data.access_token);
          fetch(`${API_BASE}/api/products?size=50`)
            .then(r => r.json())
            .then(prodData => {
              const realProducts = (prodData.items || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                size: p.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : "",
                category: p.category,
                price: p.price,
                originalPrice: p.sale_price || null,
                discount: p.sale_price ? "SALE" : null,
                organic: p.is_organic,
                image: p.image_url || "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=200&q=80"
              }));
              if (realProducts.length > 0) {
                setProducts(realProducts);
              }
              syncShoppingList(data.access_token);
            })
            .finally(() => setIsAuthLoading(false));
        } else {
          setIsAuthLoading(false);
          console.error("Auth failed:", data);
        }
      })
      .catch((err) => {
          setIsAuthLoading(false);
          console.error("Auth request failed:", err);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncShoppingList = async (customToken?: string) => {
    const activeToken = customToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/shopping-list`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      const listData = await res.json();
      
      if (Array.isArray(listData)) {
        setProducts(prevProducts => {
          const processMissing = async () => {
            let updatedProducts = [...prevProducts];
            const missingIds = listData
              .map((item: any) => item.product_id)
              .filter((id: string) => !updatedProducts.find(p => p.id === id));
              
            const uniqueMissingIds = Array.from(new Set(missingIds));
            
            if (uniqueMissingIds.length > 0) {
              const fetchPromises = uniqueMissingIds.map(id => 
                fetch(`${API_BASE}/api/products/${id}`).then(r => r.ok ? r.json() : null)
              );
              
              const fetchedProducts = await Promise.all(fetchPromises);
              const validNewProducts = fetchedProducts.filter(p => p !== null).map((p: any) => ({
                id: p.id,
                name: p.name,
                size: p.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : "",
                category: p.category,
                price: p.price,
                originalPrice: p.sale_price || null,
                discount: p.sale_price ? "SALE" : null,
                organic: p.is_organic,
                image: p.image_url || "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=200&q=80"
              }));
              
              if (validNewProducts.length > 0) {
                updatedProducts = [...updatedProducts, ...validNewProducts];
                setProducts(updatedProducts);
              }
            }
            
            const realCart = listData.map((item: any) => {
              const prod = updatedProducts.find((rp: any) => rp.id === item.product_id);
              if (!prod) return null;
              return {
                id: prod.id,
                name: prod.name,
                size: prod.size,
                category: prod.category,
                price: prod.price,
                originalPrice: prod.originalPrice,
                quantity: item.quantity,
                checked: item.status === "completed",
                image: prod.image,
                cartItemId: item.id
              };
            }).filter((item: any) => item !== null) as CartItem[];
            
            setCartItems(realCart);
          };
          processMissing();
          return prevProducts;
        });
      }
    } catch (err) {
      console.error("Failed to sync shopping list", err);
    }
  };

  const addToCart = (product: Product) => {
    // Add product to local cache so syncShoppingList can immediately find it without fetching
    setProducts(prev => {
      if (!prev.find(p => p.id === product.id)) {
        return [...prev, product];
      }
      return prev;
    });

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, checked: false }];
    });
    
    if (token) {
      fetch(`${API_BASE}/api/shopping-list`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      }).then(() => syncShoppingList());
    }
  };

  const updateCartQuantity = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || !item.cartItemId || !token) return;
    
    const newQuantity = item.quantity + delta;
    
    try {
      if (newQuantity <= 0) {
        const res = await fetch(`${API_BASE}/api/shopping-list/${item.cartItemId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Delete failed");
        await syncShoppingList();
      } else {
        const res = await fetch(`${API_BASE}/api/shopping-list/${item.cartItemId}`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity })
        });
        if (!res.ok) throw new Error("Patch failed");
        await syncShoppingList();
      }
    } catch (e) {
      console.error("Failed to update cart quantity", e);
      throw e;
    }
  };

  const toggleCartChecked = async (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (!item || !item.cartItemId || !token) return;
    
    const newStatus = item.checked ? "active" : "completed";
    try {
      const res = await fetch(`${API_BASE}/api/shopping-list/${item.cartItemId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Status update failed");
      await syncShoppingList();
    } catch (e) {
      console.error("Failed to toggle cart checked", e);
      throw e;
    }
  };

  const clearCart = () => setCartItems([]);

  return (
    <AppContext.Provider value={{
      products,
      cartItems,
      addToCart,
      updateCartQuantity,
      toggleCartChecked,
      clearCart,
      token,
      syncShoppingList,
      isAuthLoading,
      isAuthenticated: !!token
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
