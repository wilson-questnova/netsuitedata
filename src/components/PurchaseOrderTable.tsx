import 'reflect-metadata';
import { Like, FindOptionsWhere } from 'typeorm';
import { PurchaseOrder } from '../entity/PurchaseOrder';
import { getDataSource } from '../lib/db';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getPurchaseOrders(query: string, status: string) {
  const dataSource = await getDataSource();
  const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);

  const where: FindOptionsWhere<PurchaseOrder> = {};
  if (query) {
    where.documentNumber = Like(`%${query}%`);
  }
  if (status) {
    where.status = status;
  }

  const purchaseOrders = await purchaseOrderRepository.find({
    where,
    order: {
      id: 'DESC',
    },
  });

  return purchaseOrders;
}

export default async function PurchaseOrderTable({ query, status }: { query: string; status: string; }) {
  const purchaseOrders = await getPurchaseOrders(query, status);

  // Helper function to format currency with commas
  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <TableHead className="font-semibold text-slate-700 bg-slate-100">Document Number</TableHead>
          <TableHead className="font-semibold text-slate-700 bg-slate-100">Supplier</TableHead>
          <TableHead className="font-semibold text-slate-700 bg-slate-100">Memo</TableHead>
          <TableHead className="font-semibold text-slate-700 bg-slate-100">Status</TableHead>
          <TableHead className="text-right font-semibold text-slate-700 bg-slate-100">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchaseOrders.map((po, index) => (
          <TableRow 
            key={po.id}
            className={`
              ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
              hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100
            `}
          >
            <TableCell>
              <Link href={`/purchase-order/${po.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                {po.documentNumber}
              </Link>
            </TableCell>
            <TableCell className="text-slate-700">{po.vendor}</TableCell>
            <TableCell className="text-slate-600">{po.memo}</TableCell>
            <TableCell className="text-slate-700">{po.status}</TableCell>
            <TableCell className="text-right font-semibold text-slate-900">₱{formatCurrency(po.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}