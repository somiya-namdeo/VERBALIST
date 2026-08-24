import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="VERBALIST logo" className="h-12 w-auto" />
          <span className="text-xl font-semibold tracking-tight">VERBALIST</span>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-black">Home</Link>
          <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-black">Products</Link>
          <Link to="/voice" className="text-sm font-medium text-gray-700 hover:text-black">Voice</Link>
          <Link to="/list" className="text-sm font-medium text-gray-700 hover:text-black">Shopping List</Link>
        </nav>
      </div>
    </header>
  );
}
