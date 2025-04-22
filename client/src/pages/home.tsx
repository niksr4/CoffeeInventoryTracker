import { useState } from "react";
import Footer from "@/components/Footer";
import InventoryForm from "@/components/InventoryForm";
import CurrentInventory from "@/components/CurrentInventory";
import TransactionHistory from "@/components/TransactionHistory";
import SuccessModal from "@/components/SuccessModal";
import { useInventoryItems, useTransactions } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [filterType, setFilterType] = useState<string>("all");
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  });

  // Get user information for role-based access
  const { isAdmin } = useAuth();
  
  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useInventoryItems();
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(filterType);
  
  const showSuccessModal = (title: string, message: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
  };
  
  const closeSuccessModal = () => {
    setSuccessModal(prev => ({
      ...prev,
      isOpen: false
    }));
  };
  
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-6">
        <div className="lg:flex lg:space-x-6">
          <div className="w-full lg:w-1/3 mb-6 lg:mb-0">
            <InventoryForm 
              inventoryItems={inventoryItems}
              onSuccess={() => showSuccessModal(
                "Transaction Recorded", 
                "Your inventory transaction has been successfully recorded."
              )}
              isLoading={isLoadingInventory}
            />
            
            <CurrentInventory 
              inventoryItems={inventoryItems}
              isLoading={isLoadingInventory}
            />
          </div>
          
          <div className="w-full lg:w-2/3">
            {isAdmin ? (
              <TransactionHistory 
                transactions={transactions}
                onFilterChange={setFilterType}
                filterType={filterType}
                isLoading={isLoadingTransactions}
              />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventory Overview</h2>
                <p className="text-gray-600">
                  Welcome to the Coffee Production Inventory Management System. You can track and manage inventory items from the panel on the left.
                </p>
                <p className="mt-4 text-gray-600">
                  Transaction history is available to administrators only. Please contact your administrator for detailed transaction reports.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <SuccessModal 
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        title={successModal.title}
        message={successModal.message}
      />
      
      <Footer />
    </div>
  );
}
