'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
        setTransactions(prev => [...prev, ...data.transactions]);
      } else {
        setTransactions(data.transactions);
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
      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {transactions.length} of {totalCount} transactions
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Document #</TableHead>
              <TableHead>Serial #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Encoded By</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {transaction.type}
                  </span>
                </TableCell>
                <TableCell>{transaction.documentNumber || '-'}</TableCell>
                <TableCell>{transaction.serialNumber || '-'}</TableCell>
                <TableCell>{transaction.name || '-'}</TableCell>
                <TableCell className="max-w-xs truncate" title={transaction.account}>
                  {transaction.account}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={transaction.memo || ''}>
                  {transaction.memo || '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₱{formatCurrency(Math.abs(transaction.amount))}
                  {transaction.amount < 0 && ' (CR)'}
                </TableCell>
                <TableCell>{transaction.employee || '-'}</TableCell>
                <TableCell>{transaction.employeeName || '-'}</TableCell>
                <TableCell>{transaction.location || '-'}</TableCell>
                <TableCell>{transaction.subsidiary || '-'}</TableCell>
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