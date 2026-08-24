import { Mic, Plus, Minus, CheckCircle2, Circle, Trash2, List, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency } from "../lib/utils";
import { useAppContext } from "../context/AppContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function ShoppingList() {
  const { cartItems, updateCartQuantity, toggleCartChecked, token, clearCart, syncShoppingList } = useAppContext();
  const navigate = useNavigate();

  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpdateQuantity = async (id: string, delta: number) => {
    setErrorMsg(null);
    setLoadingItems(prev => new Set(prev).add(id));
    try {
      await updateCartQuantity(id, delta);
    } catch (e) {
      setErrorMsg("Failed to update item");
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleChecked = async (id: string) => {
    setErrorMsg(null);
    setLoadingItems(prev => new Set(prev).add(id));
    try {
      await toggleCartChecked(id);
    } catch (e) {
      setErrorMsg("Failed to update status");
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /**
   * Calls POST /api/shopping-list/checkout.
   * The backend:
   *   1. Reads this user's active shopping-list items (filtered by user_id).
   *   2. Bulk-inserts them into shopping_history (each row stamped with user_id).
   *   3. Only after history INSERT succeeds, bulk-deletes those cart rows.
   * If the backend returns an error, we do NOT clear the cart and we do NOT navigate.
   */
  const handleConfirmPurchase = async () => {
    if (!token) return;
    setIsCheckingOut(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/shopping-list/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        // Backend failed — keep the cart intact, show the error
        throw new Error(data.detail || "Purchase failed. Your shopping list has not been changed.");
      }
      // Success — clear local cart state and sync then navigate to history
      clearCart();
      if (syncShoppingList) syncShoppingList();
      setShowReviewModal(false);
      navigate("/history");
    } catch (e: any) {
      setErrorMsg(e.message || "Purchase failed. Please try again.");
      setShowReviewModal(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Group by category
  const categories = Array.from(new Set(cartItems.map(i => i.category)));
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  const discount = cartItems.reduce((sum, item) => sum + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0), 0);
  const total = subtotal - discount;

  const checkedCount = cartItems.filter(i => i.checked).length;

  return (
    <div className="flex h-full flex-col bg-[#fafafa] overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-black mb-2">Shopping List</h1>
            <p className="text-gray-500">{cartItems.length} items · {checkedCount} checked</p>
          </div>
          <div className="flex space-x-3">
            <button type="button" className="flex items-center space-x-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm hover:bg-gray-50">
              <Mic className="h-4 w-4" />
              <span>Ask Verbalist</span>
            </button>
            <button type="button" className="flex items-center space-x-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800">
              <Plus className="h-4 w-4" />
              <span>Add item</span>
            </button>
          </div>
        </div>

        {cartItems.length === 0 ? (
           <div className="text-center py-20">
             <p className="text-gray-500 text-lg">Your shopping list is empty.</p>
           </div>
        ) : (
          <div className="space-y-10">
            {categories.map(category => {
              const categoryItems = cartItems.filter(i => i.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="mb-4 text-xs font-bold tracking-[0.1em] text-gray-500 uppercase">{category}</h3>
                  <div className="space-y-3">
                    {categoryItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center space-x-4">
                          <button onClick={() => handleToggleChecked(item.id)} disabled={loadingItems.has(item.id)} style={{ opacity: loadingItems.has(item.id) ? 0.5 : 1 }} className="text-gray-400 hover:text-black focus:outline-none">
                            {item.checked ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6" />}
                          </button>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 overflow-hidden shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="h-full w-full object-cover opacity-90 mix-blend-multiply"
                              onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=100&q=80"}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className={cn("text-sm font-medium", item.checked ? "text-gray-400 line-through" : "text-black")}>
                                {item.name}
                              </span>
                            </div>
                            <span className={cn("text-xs", item.checked ? "text-gray-300" : "text-gray-500")}>
                              {item.size}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <span className={cn("text-base font-semibold", item.checked ? "text-gray-400" : "text-black")}>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center rounded-full border border-gray-200 p-1">
                              <button onClick={() => handleUpdateQuantity(item.id, -1)} disabled={loadingItems.has(item.id)} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium text-black">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.id, 1)} disabled={loadingItems.has(item.id)} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button onClick={() => handleUpdateQuantity(item.id, -item.quantity)} disabled={loadingItems.has(item.id)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Card */}
        {cartItems.length > 0 && (
          <div className="mt-12 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-black">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-green-500">-{formatCurrency(discount)}</span>
              </div>
              <div className="my-4 border-t border-gray-100"></div>
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-black">Estimated total</span>
                <span className="text-2xl font-bold text-black">{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              disabled={cartItems.length === 0}
              className="mt-8 w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white hover:bg-gray-800 flex justify-center items-center disabled:opacity-60 transition-colors"
            >
              <List className="mr-2 h-4 w-4" /> Review List
            </button>
          </div>
        )}
        
      </div>

      {/* Review / Confirm Purchase Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute right-5 top-5 rounded-full p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon + Title */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-black">Confirm Purchase</h2>
              <p className="mt-1 text-sm text-gray-500">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} will be marked as purchased.
              </p>
            </div>

            {/* Item summary */}
            <div className="mb-6 max-h-52 overflow-y-auto space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-black truncate max-w-[60%]">{item.name}</span>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 shrink-0">
                    <span>×{item.quantity}</span>
                    <span className="font-semibold text-black">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mb-6 flex justify-between rounded-2xl bg-gray-50 px-5 py-4">
              <span className="font-semibold text-black">Total</span>
              <span className="text-xl font-bold text-black">{formatCurrency(total)}</span>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isCheckingOut}
                className="flex-1 rounded-2xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {isCheckingOut ? "Processing…" : "Confirm Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-xl">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
