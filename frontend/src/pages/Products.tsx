import { Search, Mic, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn, formatCurrency } from "../lib/utils";
import { getProductImage } from "../lib/imageMap";
import { useAppContext } from "../context/AppContext";

export function Products() {
  const { addToCart, cartItems } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [backendProducts, setBackendProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = "http://localhost:8000/api/products?page=1&size=50";
        if (searchQuery.trim().length > 0) {
          url = `http://localhost:8000/api/products/search?q=${encodeURIComponent(searchQuery)}&page=1&size=50`;
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        if (active) {
          const realProducts = (data.items || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            size: p.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : "",
            category: p.category === "fruits_vegetables" ? "Fruits & Vegetables" : 
                      p.category === "personal_care" ? "Personal Care" : 
                      (p.category.charAt(0).toUpperCase() + p.category.slice(1)),
            price: p.price,
            originalPrice: p.sale_price || null,
            discount: p.sale_price ? "SALE" : null,
            organic: p.is_organic,
            image: getProductImage(p.name, p.category, p.image_url)
          }));
          setBackendProducts(realProducts);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load products");
      } finally {
        if (active) setLoading(false);
      }
    };
    
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const filteredProducts = backendProducts;
return (
    <div className="flex h-full flex-col bg-[#fafafa] overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-black mb-2">Browse products</h1>
          <p className="text-gray-500">{filteredProducts.length} items available</p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-12 text-sm text-black placeholder-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-0"
              placeholder="Search groceries, drinks, personal care..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <Mic className="h-5 w-5 text-gray-400 cursor-pointer hover:text-black" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading products...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pb-20">
          {filteredProducts.map((product) => {
            const inCart = cartItems.some(item => item.id === product.id);
            return (
              <div key={product.id} className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="relative mb-4 flex aspect-square w-full items-center justify-center rounded-2xl bg-[#f8f9fa] overflow-hidden">
                  <div className="absolute left-3 top-3 flex flex-col space-y-2 z-10">
                    {product.discount && (
                      <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-sm">
                        {product.discount}
                      </span>
                    )}
                    {product.organic && (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-green-700 uppercase shadow-sm">
                        Organic
                      </span>
                    )}
                  </div>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-cover mix-blend-multiply opacity-90 transition-opacity group-hover:opacity-100"
                    onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=400&q=80"}
                  />
                </div>
                
                <div className="flex flex-1 flex-col">
                  <h3 className="text-sm font-medium text-black line-clamp-1">{product.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{product.size} &middot; {product.category}</p>
                  
                  <div className="mt-4 flex items-end justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-black">{formatCurrency(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105",
                        inCart ? "bg-green-500 text-white" : "bg-black text-white"
                      )}
                    >
                      {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
