import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Mic, Search, List, ArrowRight } from "lucide-react";
import { Waveform } from "../components/Waveform";

export function Landing() {
  const navigate = useNavigate();
  const [isVisualListening, setIsVisualListening] = useState(false);

  const handleVisualMicClick = () => {
    if (isVisualListening) return;
    setIsVisualListening(true);
    setTimeout(() => {
      setIsVisualListening(false);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm mb-6">
                <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                Voice-first grocery assistant
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-black sm:text-7xl">
                Your grocery list, <br />
                spoken into <br />
                existence.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-500">
                Tell Verbalist what you need. Search products, build your shopping list, and manage groceries with a simple voice-first experience.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <button onClick={() => navigate("/products")} className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 flex items-center">
                  Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button 
                  onClick={() => navigate("/voice")}
                  className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center"
                >
                  <Mic className="mr-2 h-4 w-4" /> Try Voice
                </button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div 
                onClick={handleVisualMicClick}
                className="relative flex h-[400px] w-[400px] flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 cursor-pointer hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
                role="button"
                aria-label="Play Visual Voice Animation"
              >
                <div className="absolute inset-0 rounded-3xl border border-gray-100/50 m-12 pointer-events-none group-hover:border-gray-200/50 transition-colors"></div>
                <div className="absolute inset-0 rounded-3xl border border-gray-100/30 m-24 pointer-events-none group-hover:border-gray-200/50 transition-colors"></div>
                
                <div className="z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-300 bg-white text-black border border-gray-200 group-hover:scale-105 group-hover:border-gray-300 group-hover:shadow-xl">
                  <Mic className="h-8 w-8" />
                </div>
                
                <div className="mt-10 flex justify-center w-[280px] h-[70px]">
                  <Waveform simulate={true} isListening={isVisualListening} color="stroke-gray-300" />
                </div>
                
                <p className="mt-8 text-xs font-semibold tracking-widest text-gray-400 uppercase group-hover:text-gray-500 transition-colors">
                  Tap to speak
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="bg-white py-24 border-y border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div 
                onClick={() => navigate("/voice")}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                role="button"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <Mic className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-black group-hover:text-gray-700 transition-colors">Voice Input</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  Simply speak what you need. Verbalist translates your speech into precise product searches.
                </p>
              </div>
              <div 
                onClick={() => navigate("/products")}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                role="button"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <Search className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-black group-hover:text-gray-700 transition-colors">Smart Search</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  Search across thousands of available groceries quickly and easily.
                </p>
              </div>
              <div 
                onClick={() => navigate("/list")}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                role="button"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <List className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-black group-hover:text-gray-700 transition-colors">Shopping List</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  Manage your groceries seamlessly. View and organize everything you need before you buy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">Shop your essentials.</h2>
              <p className="mt-4 text-lg text-gray-500">Browse available groceries and add what you need to your list.</p>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-gray-900 hover:text-black sm:flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Amul Taaza Milk", qty: "1L", price: "₹68", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80" },
              { name: "Fortune Sunflower Oil", qty: "1L", price: "₹165", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80" },
              { name: "Aashirvaad Atta", qty: "5kg", price: "₹230", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80" },
              { name: "Britannia Brown Bread", qty: "400g", price: "₹55", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80" }
            ].map((product, i) => (
              <div key={i} className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square w-full rounded-xl bg-gray-50 mb-6 flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100 mix-blend-multiply"
                    onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=200&q=80'}
                  />
                </div>
                <h3 className="text-base font-medium text-black">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{product.qty}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-semibold text-black">{product.price}</p>
                  <button onClick={() => navigate("/products")} className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-black hover:bg-gray-100">
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center sm:hidden">
            <Link to="/products" className="text-sm font-semibold text-gray-900 hover:text-black flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Voice CTA Section */}
        <section className="bg-white py-24 text-center border-t border-gray-100">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">Start with your voice.</h2>
            <p className="mt-4 text-lg text-gray-500">No typing. Just speak.</p>
            <div className="mt-8 flex justify-center">
              <button onClick={() => navigate("/voice")} className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 flex items-center">
                Try Voice <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
