
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Mic, Package } from "lucide-react";

export function Home() {
  const { cartItems } = useAppContext();
  const checkedCount = cartItems.filter(i => i.checked).length;
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-[#fafafa] overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-black mb-2">Welcome to Verbalist</h1>
          <p className="text-gray-500">Your intelligent voice-activated shopping assistant.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Shopping List Summary */}
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Shopping List</h2>
              <p className="text-sm text-gray-500 mb-6">Current cart status</p>
              
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex-1 rounded-2xl bg-gray-50 p-4 text-center">
                  <div className="text-3xl font-bold text-black">{cartItems.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Items</div>
                </div>
                <div className="flex-1 rounded-2xl bg-gray-50 p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{checkedCount}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Checked</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate("/list")}
              className="w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Open Shopping List
            </button>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Quick Actions</h2>
              <p className="text-sm text-gray-500 mb-6">What would you like to do?</p>
              
              <div className="space-y-3 mb-8">
                <button 
                  onClick={() => navigate("/voice")}
                  className="w-full flex items-center p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mr-4">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-black">Ask Verbalist</div>
                    <div className="text-xs text-gray-500">Use voice commands to add items</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate("/products")}
                  className="w-full flex items-center p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-black mr-4">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-black">Browse Products</div>
                    <div className="text-xs text-gray-500">Explore the complete catalog</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

