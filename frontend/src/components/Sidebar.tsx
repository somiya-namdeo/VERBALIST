import { Home, Mic, Package, List, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Voice", href: "/voice", icon: Mic },
  { name: "Products", href: "/products", icon: Package },
  { name: "Shopping List", href: "/list", icon: List },
  { name: "History", href: "/history", icon: Clock },
];

export function Sidebar() {
  const location = useLocation();

  const renderNav = (items: typeof navigation) => (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-black"
            )}
          >
            <item.icon
              className={cn(
                "mr-4 h-5 w-5 flex-shrink-0",
                isActive ? "text-white" : "text-gray-400 group-hover:text-black"
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-gray-100 bg-white">
      <div className="flex h-20 items-center px-8">
        <img src="/logo.png" alt="VERBALIST logo" className="h-12 w-auto" />
        <span className="ml-3 text-sm font-bold tracking-[0.2em] text-black uppercase">VERBALIST</span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-between">
        <div>
          {renderNav(navigation)}
        </div>
      </div>

    </div>
  );
}

