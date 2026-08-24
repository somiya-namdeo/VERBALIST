import { Sidebar } from "../components/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
