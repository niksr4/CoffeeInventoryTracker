export type InventoryItem = {
  id: number;
  name: string;
  currentQuantity: number;
  unit: string;
};

export type Transaction = {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  transactionType: 'depleting' | 'restocking';
  notes?: string;
  userName: string;
  timestamp: string; // ISO string format
};

export type TransactionFormData = {
  quantity: number;
  itemId: number;
  transactionType: 'depleting' | 'restocking';
  notes?: string;
  userName: string;
};

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}
