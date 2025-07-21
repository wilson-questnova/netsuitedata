import 'reflect-metadata';
import { DataSource, Like } from 'typeorm';
import { PurchaseOrder } from '../entity/PurchaseOrder';
import { getDataSource } from '../lib/db';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getPurchaseOrders(query: string, status: string) {
  const dataSource = await getDataSource();
  const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);

  const where: any = {};
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
        <TableRow>
          <TableHead>Document Number</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Memo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchaseOrders.map((po) => (
          <TableRow key={po.id}>
            <TableCell>
              <Link href={`/purchase-order/${po.id}`} className="text-blue-500 hover:underline">
                {po.documentNumber}
              </Link>
            </TableCell>
            <TableCell>{po.vendor}</TableCell>
            <TableCell>{po.memo}</TableCell>
            <TableCell>{po.status}</TableCell>
            <TableCell className="text-right">₱{formatCurrency(po.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}