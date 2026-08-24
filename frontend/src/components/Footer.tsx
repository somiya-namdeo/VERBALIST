import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-black" />
          <span className="text-lg font-semibold tracking-tight">VERBALIST</span>
        </div>
        <p className="mt-4 text-sm text-gray-500 md:mt-0">
          Voice-first grocery assistant.
        </p>
      </div>
    </footer>
  );
}
