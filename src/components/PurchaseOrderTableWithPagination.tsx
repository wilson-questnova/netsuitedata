'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Badge } from "./ui/badge";

interface PurchaseOrder {
  id: number;
  documentNumber: string;
  vendor: string;
  memo: string;
  status: string;
  total: number;
  date: string;
  receiveBy: string;
}

interface PurchaseOrderTableProps {
  query: string;
  status: string;
  fromDate: string;
  toDate: string;
}

// Status color mapping based on common purchase order statuses
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending receipt':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'partially received':
    case 'pending billing/partially received':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'fully billed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'draft':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

export default function PurchaseOrderTableWithPagination({ query, status, fromDate, toDate }: PurchaseOrderTableProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 100;

  // Helper function to format currency with commas
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const fetchPurchaseOrders = async (currentOffset: number, reset: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        ...(query && { query }),
        ...(status && status !== 'all' && { status }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      });

      const response = await fetch(`/api/purchase-orders?${params}`);
      const data = await response.json();

      if (reset) {
        setPurchaseOrders(data.purchaseOrders);
      } else {
        setPurchaseOrders(prev => [...prev, ...data.purchaseOrders]);
      }

      setHasMore(data.hasMore);
      setTotalCount(data.total);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    setOffset(0);
    fetchPurchaseOrders(0, true);
  }, [query, status, fromDate, toDate]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchPurchaseOrders(newOffset, false);
  };

  return (
    <div className="space-y-4">
      {/* Total count display */}
      <div className="flex justify-between items-center mb-4">
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
          <div className="text-sm font-medium text-slate-700">
            {totalCount > 0 ? (
              <span>
                Showing <span className="font-semibold text-slate-900">{purchaseOrders.length}</span> of <span className="font-semibold text-slate-900">{totalCount.toLocaleString()}</span> purchase orders
                {(query || (status && status !== 'all')) && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {query && `matching "${query}"`}
                    {query && status && status !== 'all' && ' and '}
                    {status && status !== 'all' && `status: ${status}`}
                  </span>
                )}
              </span>
            ) : (
              <span>No purchase orders found</span>
            )}
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <TableHead className="font-semibold text-slate-700 bg-slate-100">Document Number</TableHead>
            <TableHead className="font-semibold text-slate-700 bg-slate-100">Supplier</TableHead>
            <TableHead className="font-semibold text-slate-700 bg-slate-100">Date</TableHead>
            {/* <TableHead>Memo</TableHead> */}
            <TableHead className="font-semibold text-slate-700 bg-slate-100">Status</TableHead>
            <TableHead className="text-right font-semibold text-slate-700 bg-slate-100">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders && purchaseOrders.map((po, index) => (
            <TableRow 
              key={po.id} 
              className={`
                ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100
              `}
            >
              <TableCell className="font-medium text-slate-800">
                <Link href={`/purchase-order/${po.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                  {po.documentNumber}
                </Link>
              </TableCell>
              <TableCell className="font-medium text-slate-700">{po.vendor}</TableCell>
              <TableCell className="text-slate-600">{formatDate(po.date)}</TableCell>
              {/* <TableCell className="text-gray-600">{po.memo}</TableCell> */}
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(po.status)} font-medium`}
                >
                  {po.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-900">
                ₱{formatCurrency(po.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {(!purchaseOrders || purchaseOrders.length === 0) && !loading && totalCount === 0 && (
        <div className="text-center py-8 text-gray-500">
          No purchase orders found.
        </div>
      )}
      
      {hasMore && purchaseOrders && (
        <div className="flex justify-center py-4">
          <Button 
            onClick={loadMore} 
            disabled={loading}
            variant="outline"
            className="px-8 py-2"
          >
            {loading ? 'Loading...' : `Load More (${purchaseOrders.length} of ${totalCount.toLocaleString()} loaded)`}
          </Button>
        </div>
      )}
      
      {!hasMore && purchaseOrders && purchaseOrders.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          All {totalCount.toLocaleString()} purchase orders loaded
        </div>
      )}
    </div>
  );
}