import { Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { getProductImage } from "../lib/imageMap";
import { useAppContext } from "../context/AppContext";

const BASE = "http://localhost:8000";

type HistoryRecord = {
  id: string;
  product_id: string;
  quantity: number;
  purchased_at: string;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string;
};

function getDateLabel(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";
  if (diff <= 6) return `${diff} DAYS AGO`;
  if (diff <= 13) return "LAST WEEK";
  if (diff <= 30) return `${Math.ceil(diff / 7)} WEEKS AGO`;
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();
}

export function History() {
  const { token } = useAppContext();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/shopping-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load history");
      const raw: Array<{ id: string; product_id: string; quantity: number; purchased_at: string }> = await res.json();

      // Resolve product details â€” fetch only the unique IDs that appear in this user's history
      const productCache: Record<string, any> = {};
      const uniqueIds = Array.from(new Set(raw.map(r => r.product_id)));
      await Promise.all(uniqueIds.map(async (pid) => {
        try {
          const pr = await fetch(`${BASE}/api/products/${pid}`);
          if (pr.ok) productCache[pid] = await pr.json();
        } catch { /* product lookup failed â€” use placeholder */ }
      }));

      const resolved: HistoryRecord[] = raw.map(r => {
        const p = productCache[r.product_id];
        const salePrice = p?.sale_price;
        const price = p ? (salePrice && salePrice < p.price ? salePrice : p.price) : 0;
        return {
          id: r.id,
          product_id: r.product_id,
          quantity: r.quantity,
          purchased_at: r.purchased_at,
          name: p ? p.name : "Unknown product",
          category: p ? p.category : "Other",
          price,
          image: getProductImage(p ? p.name : "Unknown", p ? p.category : "Other", p?.image_url || null),
          size: p?.quantity_value ? `${p.quantity_value}${p.quantity_unit}` : ""
        };
      });

      // Newest first
      resolved.sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());
      setRecords(resolved);
    } catch (e: any) {
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filtered = records.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });

  const dateLabels = Array.from(new Set(filtered.map(r => getDateLabel(r.purchased_at))));

  return (
    <div className="flex h-full flex-col bg-[#fafafa] overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-black mb-2">Shopping History</h1>
          <p className="text-gray-500">
            {loading ? "Loading..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4 mb-12">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="block w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-black placeholder-gray-400 shadow-sm focus:border-gray-300 focus:outline-none"
              placeholder="Search history..."
            />
          </div>
          <div className="flex space-x-1 rounded-full border border-gray-200 bg-white p-1">
            <button className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", "bg-black text-white")}>
              All
            </button>
          </div>
        </div>

        {/* Content states */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading history...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 text-lg">No purchase history yet.</p>
            <p className="text-gray-400 text-sm mt-2">Items you purchase will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10 pb-20">
            {dateLabels.map(dateLabel => {
              const dayRecords = filtered.filter(r => getDateLabel(r.purchased_at) === dateLabel);
              if (dayRecords.length === 0) return null;
              return (
                <div key={dateLabel}>
                  <h3 className="mb-4 text-xs font-bold tracking-[0.1em] text-gray-500 uppercase">{dateLabel}</h3>
                  <div className="space-y-3">
                    {dayRecords.map(record => (
                      <div key={record.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 overflow-hidden shrink-0">
                            <img
                              src={record.image}
                              alt={record.name}
                              className="h-full w-full object-cover opacity-90 mix-blend-multiply"
                              onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=f3f4f6&color=374151&size=100`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-black">{record.name}</span>
                            <span className="text-xs text-gray-500 mt-1">
                              {record.category}{record.size ? ` \u00b7 ${record.size}` : ""} &middot; Qty {record.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className="text-base font-semibold text-black">
                            {record.price > 0 ? `\u20b9${Math.round(record.price * record.quantity)}` : "\u2014"}
                          </span>
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-green-50 text-green-600">
                            Purchased
                          </span>
                        </div>
                      </div>
                    ))}
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


