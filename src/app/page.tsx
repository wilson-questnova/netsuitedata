import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Receipt, Upload, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">NetSuite Data Dashboard</h1>
        <p className="text-lg text-gray-600">Manage your business data with comprehensive tools and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Purchase Orders Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Purchase Orders</CardTitle>
                <CardDescription>Manage and track purchase orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              View, filter, and manage your purchase orders with advanced search capabilities and detailed tracking.
            </p>
            <Link href="/purchase-orders">
              <Button className="w-full">
                View Purchase Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Transactions</CardTitle>
                <CardDescription>Browse financial transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Explore your financial transactions with powerful filtering by type, date range, and search queries.
            </p>
            <Link href="/transactions">
              <Button className="w-full">
                View Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Import Data Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Import Data</CardTitle>
                <CardDescription>Upload CSV files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Import new data from CSV files to keep your database up-to-date with the latest information.
            </p>
            <Link href="/import">
              <Button className="w-full" variant="outline">
                Import CSV Files
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Quick Overview</CardTitle>
              <CardDescription>Your data at a glance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-600">Purchase Orders</h3>
              <p className="text-gray-600">Manage procurement data</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-2xl font-bold text-green-600">84,456</h3>
              <p className="text-gray-600">Transactions imported</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="text-2xl font-bold text-purple-600">CSV Import</h3>
              <p className="text-gray-600">Data management tools</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
