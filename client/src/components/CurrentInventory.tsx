import { InventoryItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentInventoryProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
}

export default function CurrentInventory({ inventoryItems, isLoading }: CurrentInventoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-[#4F772D] border-b border-gray-200 pb-3 mb-4">
        <svg className="inline-block w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14M19 8H9a4 4 0 1 0 0 8h10" />
        </svg>
        Current Inventory Levels
      </h2>
      
      <div className="space-y-3">
        {isLoading ? (
          // Skeleton loading state
          Array(5).fill(0).map((_, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : (
          // Actual inventory data
          inventoryItems.map((item) => (
            <div 
              key={item.id}
              className={`flex justify-between items-center py-2 ${
                item.id !== inventoryItems[inventoryItems.length - 1].id
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <div className="font-medium text-sm capitalize">{item.name}</div>
              <div className="font-bold text-sm">
                {item.currentQuantity} {item.unit}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
