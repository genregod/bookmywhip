import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNavigation from "../shared/MobileNavigation";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
        <div className="flex items-center">
          <svg className="h-10 w-10 text-primary" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="currentColor" />
            <path d="M28 20H12M12 20L18 14M12 20L18 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="ml-2 text-xl font-heading font-bold text-primary">
            BookMyWhip {user?.role === 'admin' ? 'Admin' : user?.role === 'driver' ? 'Driver' : ''}
          </h1>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
