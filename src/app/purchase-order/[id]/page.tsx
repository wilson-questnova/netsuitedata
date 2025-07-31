import 'reflect-metadata';
import { PurchaseOrder } from '../../../entity/PurchaseOrder';
import { PurchaseOrderEntry } from '../../../entity/PurchaseOrderEntry';
import { getDataSource } from '../../../lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function getPurchaseOrderWithEntries(id: number) {
  const dataSource = await getDataSource();
  const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
  const purchaseOrderEntryRepository = dataSource.getRepository(PurchaseOrderEntry);

  const purchaseOrder = await purchaseOrderRepository.findOne({
    where: { id },
  });

  if (!purchaseOrder) {
    return null;
  }

  const entries = await purchaseOrderEntryRepository.find({
    where: { purchaseOrderId: id },
  });

  return { ...purchaseOrder, entries };
}

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchaseOrder = await getPurchaseOrderWithEntries(Number(id));

  if (!purchaseOrder) {
    return <div>Purchase order not found</div>;
  }

  // Helper function to format currency with commas
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Status color mapping
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

  return (
    <div className="container mx-auto p-4">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Purchase Orders
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Purchase Order: {purchaseOrder.documentNumber}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Detailed view of purchase order and its entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Purchase Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Vendor</p>
              <p className="text-base font-semibold text-gray-900">{purchaseOrder.vendor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(purchaseOrder.status)} font-medium w-fit`}
              >
                {purchaseOrder.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-base font-semibold text-gray-900">
                ₱{formatCurrency(purchaseOrder.total)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-base text-gray-900">{formatDate(purchaseOrder.date)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Receive By</p>
              <p className="text-base text-gray-900">{formatDate(purchaseOrder.receiveBy)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Memo</p>
              <p className="text-base text-gray-900">{purchaseOrder.memo || 'N/A'}</p>
            </div>
          </div>

          {/* Entries Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Order Entries</h3>
            </div>
            
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-700">
                <span className="font-semibold text-slate-900">
                  {purchaseOrder.entries.length} {purchaseOrder.entries.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <TableHead className="font-semibold text-slate-700 bg-slate-100">Item Name</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 bg-slate-100">Quantity</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 bg-slate-100">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 bg-slate-100">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.entries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100
                    `}
                  >
                    <TableCell className="font-medium text-slate-800">{entry.item}</TableCell>
                    <TableCell className="text-center text-slate-700">{entry.quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      ₱{formatCurrency(entry.rate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      ₱{formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {purchaseOrder.entries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No entries found for this purchase order.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}