'use client';

import { Suspense } from 'react';
import TransactionFilter from '../../components/TransactionFilter';
import TransactionTable from '../../components/TransactionTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Transactions</CardTitle>
                <CardDescription className="text-gray-600">
                  View and analyze transaction data with advanced filtering and search capabilities.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/purchase-orders">
                <Button variant="outline" className="flex items-center space-x-2">
                  <span>View Purchase Orders</span>
                </Button>
              </Link>
              <Link href="/import">
                <Button className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Import CSV</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading filters...</span>
            </div>
          }>
            <TransactionFilter />
          </Suspense>
          <div className="mt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            }>
              <TransactionTable />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}