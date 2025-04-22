import { useQuery, useMutation } from "@tanstack/react-query";
import { InventoryItem, Transaction, TransactionFormData } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useInventoryItems() {
  return useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });
}

export function useTransactions(itemType: string = 'all') {
  const queryKey = itemType === 'all' 
    ? ['/api/transactions'] 
    : ['/api/transactions', { itemType }];
    
  return useQuery<Transaction[]>({
    queryKey,
  });
}

export function useCreateTransaction() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both inventory and transactions queries
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: "Transaction recorded",
        description: "Your inventory transaction has been successfully recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording transaction",
        description: error.message || "Failed to record transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useExportTransactions() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      // Using window.open for direct download instead of fetch
      window.open('/api/export', '_blank');
      return true;
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export transactions. Please try again.",
        variant: "destructive",
      });
    },
  });
}
