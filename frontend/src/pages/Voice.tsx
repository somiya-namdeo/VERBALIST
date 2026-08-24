import { useState, useRef, useEffect } from "react";
import { Activity, Mic, MicOff, Keyboard, Circle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, formatCurrency } from "../lib/utils";
import { getProductImage } from "../lib/imageMap";
import { Waveform } from "../components/Waveform";
import { useAppContext } from "../context/AppContext"; import type { Product } from "../context/AppContext";

const SUGGESTIONS = [
  "Add potatoes to my cart",
  "Add 2 bottles of water",
  "Add toothpaste to my cart",
  "Show me seasonal products",
  "What should I buy?"
];

export function Voice() {

  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; foundProducts?: Product[] }[]>(() => {
    const saved = localStorage.getItem("verbalist_voice_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("verbalist_voice_messages", JSON.stringify(messages));
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const shouldProcessAudioRef = useRef<boolean>(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (shouldProcessAudioRef.current) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            await processAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setIsTyping(false);
    } catch (error) {
      console.error("Microphone permission denied:", error);
      alert("Microphone access is required to use voice commands.");
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListen = () => {
    if (isListening) {
      shouldProcessAudioRef.current = true;
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    submitQuery(suggestion);
  };

  const { cartItems, addToCart, token, syncShoppingList, isAuthLoading, isAuthenticated } = useAppContext();
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const isAuthLoadingRef = useRef(isAuthLoading);
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthLoadingRef.current = isAuthLoading;
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthLoading, isAuthenticated]);

  const submitQuery = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    
    // Wait for auth to initialize if it is currently loading
    if (isAuthLoadingRef.current) {
       // Wait up to 5 seconds
       for (let i = 0; i < 50; i++) {
           await new Promise(r => setTimeout(r, 100));
           if (!isAuthLoadingRef.current) break;
       }
    }

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setQuery("");
    setIsListening(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      shouldProcessAudioRef.current = false;
      mediaRecorderRef.current.stop();
    }

    if (isAuthenticatedRef.current && tokenRef.current) {
      try {
        const response = await fetch("http://localhost:8000/api/agent/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenRef.current}`
          },
          body: JSON.stringify({ message: text })
        });
        
        if (response.status === 429) {
          setMessages(prev => [...prev, { role: "assistant", content: "The service is currently overloaded. Please try again later." }]);
          return;
        }
        
        const data = await response.json();
        
        let newMsg: any = { role: "assistant", content: data.response };
        
        if (data.found_products && data.found_products.length > 0) {
          newMsg.foundProducts = data.found_products.map((p: any) => ({
            id: p.id,
            name: p.name,
            size: p.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : "",
            category: p.category,
            price: p.price,
            originalPrice: p.sale_price || null,
            discount: p.sale_price ? "SALE" : null,
            organic: p.is_organic,
            image: getProductImage(p.name, p.category, p.image_url)
          }));
        }

        setMessages(prev => [...prev, newMsg]);

        if (data.tools_used && data.tools_used.length > 0 && syncShoppingList) {
          syncShoppingList(tokenRef.current);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Authentication missing or failed. Please check the backend." }]);
        setIsProcessing(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch("http://localhost:8000/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          alert("The speech service is currently overloaded. Please type your request instead.");
        }
        throw new Error("STT API failed");
      }

      const data = await response.json();
      const transcribedText = data.text;
      
      if (transcribedText) {
        submitQuery(transcribedText);
      }
    } catch (error) {
      console.error("STT processing error:", error);
      alert("Failed to process audio. Please try again or type instead.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center px-6 py-6 border-b border-gray-900 bg-[#0a0a0a] shrink-0 sticky top-0 z-10">
        <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors mr-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <h1 className="text-xl font-medium tracking-wide">Assistant</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 pb-24">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <h2 className="mb-8 text-xl text-gray-300 font-medium">
              {isListening ? "Listening..." : "How can I help?"}
            </h2>
            {isTyping ? (
              <div className="w-full max-w-md">
                <div className="relative w-full">
                  <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitQuery(query)}
                    placeholder="Type a command, e.g. Add 2 bottles of water"
                    className="w-full rounded-2xl border border-gray-800 bg-[#111] px-6 py-4 pr-24 text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600"
                    disabled={isProcessing}
                  />
                  <button 
                    onClick={() => submitQuery(query)}
                    disabled={!query.trim() || isProcessing}
                    className="absolute right-2 top-2 bottom-2 rounded-xl bg-white px-4 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? "..." : "Send"}
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                   <button 
                    onClick={() => setIsTyping(false)}
                    className="text-sm text-gray-500 hover:text-gray-300"
                  >
                    Use voice instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleListen}
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-lg",
                    isListening 
                      ? "bg-white text-black shadow-white/10 scale-110" 
                      : "bg-[#1a1a1a] text-white hover:bg-[#222]"
                  )}
                >
                  {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </button>
                
                {isListening && (
                  <div className="mt-8 flex justify-center w-[200px] h-[50px]">
                    <Waveform isListening={isListening} color="stroke-white" />
                  </div>
                )}
                
                <button 
                  onClick={() => setIsTyping(true)}
                  className="mt-8 flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Keyboard className="h-4 w-4" />
                  <span>Type instead</span>
                </button>
              </div>
            )}
            <div className="mt-16 text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-600">Try an example</p>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    disabled={isProcessing}
                    onClick={() => handleSuggestionClick(s)}
                    className="rounded-full border border-gray-800 bg-transparent px-4 py-2 text-sm text-gray-400 hover:bg-gray-800/80 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8 pt-8">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}>
                {msg.role === "user" ? (
                  <div className="rounded-2xl bg-[#1a1a1a] px-6 py-4 border border-gray-800 max-w-[80%]">
                    <p className="text-gray-100">{msg.content}</p>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-2xl bg-[#1a1a1a] px-5 py-3 border border-gray-800">
                        <p className="text-gray-200">{msg.content}</p>
                      </div>
                    </div>
                    {msg.foundProducts && msg.foundProducts.length > 0 && (
                      <div className="pl-11 space-y-3 w-full">
                        {msg.foundProducts.map(product => {
                          const inCart = cartItems.some(i => i.id === product.id);
                          return (
                            <div 
                              key={product.id}
                              onClick={() => addToCart(product)}
                              className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-800 bg-[#111] p-4 transition-colors hover:border-gray-600 hover:bg-[#151515]"
                            >
                              <div className="flex items-center space-x-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a] overflow-hidden shrink-0 border border-gray-800">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="h-full w-full object-cover opacity-90 mix-blend-multiply"
                                  onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=374151&size=100`}
                                />
                              </div>
                                <div>
                                  <h4 className="font-medium text-gray-200">{product.name}</h4>
                                  <p className="text-sm text-gray-500">{product.size} &middot; {formatCurrency(product.price)}</p>
                                </div>
                              </div>
                              <div className="text-gray-600 group-hover:text-gray-400">
                                {inCart ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                  <Circle className="h-6 w-6" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-8 border-t border-gray-800/50 flex flex-col items-center">
              {isTyping ? (
                <div className="w-full max-w-2xl px-4 flex flex-col items-center">
                  <div className="relative w-full">
                    <input
                      type="text"
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitQuery(query)}
                      placeholder="Type a command, e.g. Add 2 bottles of water"
                      className="w-full rounded-2xl border border-gray-800 bg-[#111] px-6 py-4 pr-24 text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600"
                      disabled={isProcessing}
                    />
                    <button 
                      onClick={() => submitQuery(query)}
                      disabled={!query.trim() || isProcessing}
                      className="absolute right-2 top-2 bottom-2 rounded-xl bg-white px-4 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? "..." : "Send"}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsTyping(false)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-300"
                  >
                    Use voice instead
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={toggleListen}
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full transition-all shadow-md",
                      isListening 
                        ? "bg-white text-black scale-105" 
                        : "bg-[#1a1a1a] text-white hover:bg-[#222] border border-gray-800"
                    )}
                  >
                    {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                  <div className="mt-4 flex gap-4 text-sm text-gray-500">
                    {isListening ? (
                      <span className="text-gray-400">Listening...</span>
                    ) : (
                      <button onClick={() => setIsTyping(true)} className="hover:text-gray-300">Type instead</button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
