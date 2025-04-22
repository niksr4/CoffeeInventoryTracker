import { useState } from "react";
import { Transaction } from "@/lib/types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExportTransactions } from "@/hooks/useInventory";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onFilterChange: (value: string) => void;
  filterType: string;
  isLoading: boolean;
}

export default function TransactionHistory({ 
  transactions, 
  onFilterChange,
  filterType,
  isLoading
}: TransactionHistoryProps) {
  const exportTransactions = useExportTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'timestamp' | 'itemName' | 'quantity'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 6;

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDirection === 'asc' 
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortField === 'quantity') {
      return sortDirection === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
    }
    return sortDirection === 'asc'
      ? a[sortField].localeCompare(b[sortField])
      : b[sortField].localeCompare(a[sortField]);
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  
  const handleExport = () => {
    exportTransactions.mutate();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-3 mb-4 gap-4">
        <h2 className="text-lg font-semibold text-[#4F772D]">
          <svg className="inline-block w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Transaction History
        </h2>
        
        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <Select
            onValueChange={onFilterChange}
            value={filterType}
          >
            <SelectTrigger className="text-sm h-8 w-36 sm:w-auto">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="urea">Urea</SelectItem>
              <SelectItem value="MOP">MOP</SelectItem>
              <SelectItem value="DAP">DAP</SelectItem>
              <SelectItem value="Glycil">Glycil</SelectItem>
              <SelectItem value="Tricel">Tricel</SelectItem>
              <SelectItem value="Contaf">Contaf</SelectItem>
              <SelectItem value="MgSO4">MgSO4</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            size="sm" 
            className="text-sm bg-[#90A955] hover:bg-[#31572C] text-white"
            onClick={handleExport}
            disabled={isLoading || exportTransactions.isPending}
          >
            <svg className="inline-block w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
        </div>
      </div>
      
      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSortDirection(prev => sortField === 'timestamp' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                  setSortField('timestamp');
                }}
              >
                Date {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSortDirection(prev => sortField === 'itemName' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                  setSortField('itemName');
                }}
              >
                Item Type {sortField === 'itemName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSortDirection(prev => sortField === 'quantity' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                  setSortField('quantity');
                }}
              >
                Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // Skeleton loading state
              Array(6).fill(0).map((_, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                </tr>
              ))
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => {
                // Format the date
                const date = new Date(transaction.timestamp);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formattedDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 capitalize">{transaction.itemName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {transaction.quantity} {transaction.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.transactionType === "depleting" 
                          ? "bg-red-100 text-red-600" 
                          : "bg-green-100 text-green-600"
                      }`}>
                        {transaction.transactionType === "depleting" ? "Depleting" : "Restocking"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{transaction.notes || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.userName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {!isLoading && totalPages > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, transactions.length)}
                </span>{" "}
                of <span className="font-medium">{transactions.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNumber;
                  
                  // Logic to show correct pagination numbers
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                    if (i === 4) pageNumber = totalPages;
                    if (i === 3 && totalPages > 5) pageNumber = -1; // -1 means "..."
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                    if (i === 0) pageNumber = 1;
                    if (i === 1 && totalPages > 5) pageNumber = -1; // -1 means "..."
                  } else {
                    if (i === 0) pageNumber = 1;
                    else if (i === 1) pageNumber = -1; // -1 means "..."
                    else if (i === 3) pageNumber = -1; // -1 means "..."
                    else if (i === 4) pageNumber = totalPages;
                    else pageNumber = currentPage;
                  }
                  
                  if (pageNumber === -1) {
                    return (
                      <span key={`ellipsis-${i}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    );
                  }
                  
                  return (
                    <Button
                      key={`page-${pageNumber}`}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="icon"
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? "z-10 bg-[#4F772D] border-[#4F772D] text-white"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="icon"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
