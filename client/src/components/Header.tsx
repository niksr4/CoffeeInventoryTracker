import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Refetch all data
      await queryClient.refetchQueries({
        queryKey: ['/api/inventory'],
      });
      await queryClient.refetchQueries({
        queryKey: ['/api/transactions'],
      });
    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      // Set a minimum duration for the animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };
  
  return (
    <header className="bg-[#4F772D] text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h1 className="text-xl font-bold">CoffeeTrak</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden md:inline-block">Inventory Management System</span>
          <button
            onClick={handleRefresh}
            className="p-2 rounded hover:bg-[#31572C] transition"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
