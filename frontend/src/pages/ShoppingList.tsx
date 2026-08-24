import { Mic, Plus, Minus, CheckCircle2, Circle, Trash2, List } from "lucide-react";
import { useState } from "react";
import { cn, formatCurrency } from "../lib/utils";
import { useAppContext } from "../context/AppContext";

export function ShoppingList() {
  const { cartItems, updateCartQuantity, toggleCartChecked } = useAppContext();

  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


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
            <p className="text-gray-500">{cartItems.length} items • {checkedCount} checked</p>
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
              onClick={(e) => {
                e.preventDefault();
                alert("Your list is ready for review. This action safely keeps you on the Shopping List page without deleting items or navigating to History.");
                // Safely stay on the page for review. 
                // Do not clear the list or navigate to history.
              }}
              disabled={cartItems.length === 0}
              className="mt-8 w-full rounded-2xl bg-black py-4 text-sm font-semibold text-white hover:bg-gray-800 flex justify-center items-center disabled:opacity-60 transition-colors"
            >
              <List className="mr-2 h-4 w-4" /> Review List
            </button>
          </div>
        )}
        
      </div>

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-xl">
          {errorMsg}
        </div>
      )}
    </div>
  );
}


