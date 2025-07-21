'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export default function PurchaseOrderFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status && status !== 'all') {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleDateChange = (dateType: 'fromDate' | 'toDate', date: string) => {
    const params = new URLSearchParams(searchParams);
    if (date) {
      params.set(dateType, date);
    } else {
      params.delete(dateType);
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4 mb-6">
      {/* First row: Search and Status */}
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search by document number..."
          className="w-64"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
        <Select onValueChange={handleStatusChange} defaultValue={searchParams.get('status')?.toString() || 'all'}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Receipt">Pending Receipt</SelectItem>
            <SelectItem value="Pending Billing/Partially Received">Partially Received</SelectItem>
            <SelectItem value="Fully Billed">Fully Billed</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Second row: Date filters */}
      <div className="flex space-x-4 items-end">
        <div className="flex flex-col space-y-1">
          <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
            From Date
          </Label>
          <Input
            id="fromDate"
            type="date"
            className="w-40"
            onChange={(e) => handleDateChange('fromDate', e.target.value)}
            defaultValue={searchParams.get('fromDate')?.toString() || getCurrentDate()}
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">
            To Date
          </Label>
          <Input
            id="toDate"
            type="date"
            className="w-40"
            onChange={(e) => handleDateChange('toDate', e.target.value)}
            defaultValue={searchParams.get('toDate')?.toString() || getCurrentDate()}
          />
        </div>
      </div>
    </div>
  );
}