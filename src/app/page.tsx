'use client';

import { useSearchParams } from 'next/navigation';
import PurchaseOrderFilter from '../components/PurchaseOrderFilter';
import PurchaseOrderTableWithPagination from '../components/PurchaseOrderTableWithPagination';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import Link from 'next/link';

function PurchaseOrderContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const status = searchParams.get('status') || '';
  const fromDate = searchParams.get('fromDate') || '';
  const toDate = searchParams.get('toDate') || '';

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Purchase Orders</CardTitle>
              <CardDescription className="text-gray-600">
                Manage and track your purchase orders with advanced filtering and pagination.
              </CardDescription>
            </div>
            <Link href="/import">
              <Button className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Import CSV</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <PurchaseOrderFilter />
          <div className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading purchase orders...</span>
              </div>
            }>
              <PurchaseOrderTableWithPagination query={query} status={status} fromDate={fromDate} toDate={toDate} />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PurchaseOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    }>
      <PurchaseOrderContent />
    </Suspense>
  );
}
