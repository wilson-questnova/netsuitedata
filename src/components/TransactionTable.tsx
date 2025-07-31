'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  dateFormatted: string;
  type: string;
  documentNumber: string | null;
  serialNumber: string | null;
  name: string | null;
  account: string;
  memo: string | null;
  amount: number;
  employee: string | null;
  employeeName: string | null;
  item: string | null;
  location: string | null;
  subsidiary: string | null;
}

interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function TransactionTable() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const limit = 50; // Items per page

  // Helper function to format currency with commas
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort transactions by date
  const sortTransactionsByDate = (transactionsToSort: Transaction[], order: 'asc' | 'desc') => {
    return [...transactionsToSort].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Handle date column sort
  const handleDateSort = () => {
    let newOrder: 'asc' | 'desc' | null;
    if (sortOrder === null) {
      newOrder = 'desc'; // Default to newest first
    } else if (sortOrder === 'desc') {
      newOrder = 'asc';
    } else {
      newOrder = null; // Reset to original order
    }
    setSortOrder(newOrder);
    
    if (newOrder) {
      const sortedTransactions = sortTransactionsByDate(transactions, newOrder);
      setTransactions(sortedTransactions);
    } else {
      // Reset to original order by refetching
      fetchTransactions();
    }
  };

  // Handle individual transaction selection
  const handleTransactionSelect = (transactionId: number, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  // Handle select all transactions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(transactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Export selected transactions to CSV
  const exportSelectedToCSV = () => {
    const selectedTransactionData = transactions.filter(t => selectedTransactions.has(t.id));
    
    if (selectedTransactionData.length === 0) {
      alert('Please select transactions to export.');
      return;
    }

    // CSV headers
    const headers = [
      'Date',
      'Type',
      'Document Number',
      'Serial Number',
      'Name',
      'Account',
      'Memo',
      'Amount',
      'Cashier',
      'Encoded By',
      'Location',
      'Company'
    ];

    // Convert transactions to CSV format
    const csvContent = [
      headers.join(','),
      ...selectedTransactionData.map(transaction => [
        `"${formatDate(transaction.date)}"`,
        `"${transaction.type}"`,
        `"${transaction.documentNumber || ''}"`,
        `"${transaction.serialNumber || ''}"`,
        `"${transaction.name || ''}"`,
        `"${transaction.account}"`,
        `"${(transaction.memo || '').replace(/"/g, '""')}"`,
        transaction.amount,
        `"${transaction.employee || ''}"`,
        `"${transaction.employeeName || ''}"`,
        `"${transaction.location || ''}"`,
        `"${transaction.subsidiary || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get sort icon for date column
  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Fetch transactions
  const fetchTransactions = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      // Add search parameters
      const query = searchParams.get('query');
      const serialNumber = searchParams.get('serialNumber');
      const serialOnly = searchParams.get('serialOnly');
      const type = searchParams.get('type');
      const fromDate = searchParams.get('fromDate');
      const toDate = searchParams.get('toDate');

      if (query) params.set('query', query);
      if (serialNumber) params.set('serialNumber', serialNumber);
      if (serialOnly) params.set('serialOnly', serialOnly);
      if (type && type !== 'all') params.set('type', type);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const response = await fetch(`/api/transactions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data: TransactionResponse = await response.json();
      
      if (append) {
        const newTransactions = [...transactions, ...data.transactions];
        setTransactions(sortOrder ? sortTransactionsByDate(newTransactions, sortOrder) : newTransactions);
      } else {
        setTransactions(sortOrder ? sortTransactionsByDate(data.transactions, sortOrder) : data.transactions);
        // Clear selections when fetching new data
        setSelectedTransactions(new Set());
      }
      
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more transactions
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(transactions.length, true);
    }
  };

  // Fetch transactions when search params change
  useEffect(() => {
    fetchTransactions();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={() => fetchTransactions()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary and Export Controls */}
      <div className="mb-6 flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
        <div className="text-sm font-medium text-slate-700">
          Showing <span className="font-semibold text-slate-900">{transactions.length}</span> of {totalCount} transactions
          {selectedTransactions.size > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {selectedTransactions.size} selected
            </span>
          )}
        </div>
        {selectedTransactions.size > 0 && (
          <Button
            onClick={exportSelectedToCSV}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Selected ({selectedTransactions.size})</span>
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <TableHead className="w-12 bg-slate-100">
                <Checkbox
                  checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all transactions"
                />
              </TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">
                <Button
                  variant="ghost"
                  onClick={handleDateSort}
                  className="flex items-center space-x-1 p-0 h-auto font-medium hover:bg-slate-200 transition-colors"
                >
                  <span>Date</span>
                  {getSortIcon()}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Type</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Document #</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Serial #</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Name</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Account</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Memo</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 bg-slate-100">Amount</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Cashier</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Encoded By</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Location</TableHead>
              <TableHead className="font-semibold text-slate-700 bg-slate-100">Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow 
                key={transaction.id} 
                className={`
                  ${selectedTransactions.has(transaction.id) ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100
                `}
              >
                <TableCell className="border-r border-slate-100">
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={(checked) => handleTransactionSelect(transaction.id, checked as boolean)}
                    aria-label={`Select transaction ${transaction.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {transaction.type}
                  </span>
                </TableCell>
                <TableCell className="text-slate-700">{transaction.documentNumber || '-'}</TableCell>
                <TableCell className="text-slate-700">{transaction.serialNumber || '-'}</TableCell>
                <TableCell className="text-slate-700">{transaction.name || '-'}</TableCell>
                <TableCell className="max-w-xs truncate text-slate-700" title={transaction.account}>
                  {transaction.account}
                </TableCell>
                <TableCell className="max-w-xs truncate text-slate-600" title={transaction.memo || ''}>
                  {transaction.memo || '-'}
                </TableCell>
                <TableCell className={`text-right font-semibold ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₱{formatCurrency(Math.abs(transaction.amount))}
                  {transaction.amount < 0 && ' (CR)'}
                </TableCell>
                <TableCell className="text-slate-700">{transaction.employee || '-'}</TableCell>
                <TableCell className="text-slate-700">{transaction.employeeName || '-'}</TableCell>
                <TableCell className="text-slate-700">{transaction.location || '-'}</TableCell>
                <TableCell className="text-slate-700">{transaction.subsidiary || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button 
            onClick={loadMore} 
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}