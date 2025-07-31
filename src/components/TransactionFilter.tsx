'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function TransactionFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  
  // Local state for filter values (not applied until refresh is clicked)
  const [localFilters, setLocalFilters] = useState({
    query: '',
    serialNumber: '',
    type: 'all',
    fromDate: getCurrentDate(),
    toDate: getCurrentDate(),
    // Checkbox states for enabling/disabling filters
    enableQuery: false,
    enableSerialNumber: false,
    enableType: false,
    enableDateRange: true, // Default to enabled
    serialOnly: false
  });

  // Initialize local filters from URL params on component mount
  useEffect(() => {
    setLocalFilters({
      query: searchParams.get('query') || '',
      serialNumber: searchParams.get('serialNumber') || '',
      type: searchParams.get('type') || 'all',
      fromDate: searchParams.get('fromDate') || getCurrentDate(),
      toDate: searchParams.get('toDate') || getCurrentDate(),
      enableQuery: !!searchParams.get('query'),
      enableSerialNumber: !!searchParams.get('serialNumber'),
      enableType: !!searchParams.get('type'),
      enableDateRange: !!(searchParams.get('fromDate') || searchParams.get('toDate')),
      serialOnly: searchParams.get('serialOnly') === 'true'
    });
  }, [searchParams]);

  // Fetch transaction types for the dropdown
  useEffect(() => {
    const fetchTransactionTypes = async () => {
      try {
        const response = await fetch('/api/transactions/types');
        if (response.ok) {
          const data = await response.json();
          setTransactionTypes(data.types || []);
        }
      } catch (error) {
        console.error('Error fetching transaction types:', error);
      }
    };

    fetchTransactionTypes();
  }, []);

  // Apply filters when refresh button is clicked
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Only add enabled filters to URL
    if (localFilters.enableQuery && localFilters.query) {
      params.set('query', localFilters.query);
    }
    
    // Handle serial number filtering
    if (localFilters.serialOnly && localFilters.serialNumber) {
      // When serialOnly is true, only filter by serial number
      params.set('serialOnly', 'true');
      params.set('serialNumber', localFilters.serialNumber);
    } else if (localFilters.enableSerialNumber && localFilters.serialNumber) {
      // Regular serial number filtering (combined with other filters)
      params.set('serialNumber', localFilters.serialNumber);
    }
    
    if (localFilters.enableType && localFilters.type && localFilters.type !== 'all') {
      params.set('type', localFilters.type);
    }
    
    if (localFilters.enableDateRange) {
      if (localFilters.fromDate) {
        params.set('fromDate', localFilters.fromDate);
      }
      if (localFilters.toDate) {
        params.set('toDate', localFilters.toDate);
      }
    }
    
    // Reset pagination when applying filters
    params.delete('offset');
    replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    // Reset all local filters
    const defaultFilters = {
      query: '',
      serialNumber: '',
      type: 'all',
      fromDate: getCurrentDate(),
      toDate: getCurrentDate(),
      enableQuery: false,
      enableSerialNumber: false,
      enableType: false,
      enableDateRange: true,
      serialOnly: false
    };
    setLocalFilters(defaultFilters);
    
    // Apply the cleared filters immediately
    const params = new URLSearchParams();
    params.set('fromDate', getCurrentDate());
    params.set('toDate', getCurrentDate());
    replace(`${pathname}?${params.toString()}`);
  };

  // Update local filter state
  const updateLocalFilter = (key: string, value: string | boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      {/* First row: Search and Serial Number */}
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableQuery"
              checked={localFilters.enableQuery}
              onCheckedChange={(checked) => updateLocalFilter('enableQuery', checked)}
            />
            <Label htmlFor="enableQuery" className="text-sm font-medium text-gray-700">
              Search
            </Label>
          </div>
          <Input
            type="text"
            placeholder="Search by document number, name, or memo..."
            className="w-80"
            value={localFilters.query}
            onChange={(e) => updateLocalFilter('query', e.target.value)}
            disabled={!localFilters.enableQuery}
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableSerialNumber"
              checked={localFilters.enableSerialNumber}
              onCheckedChange={(checked) => updateLocalFilter('enableSerialNumber', checked)}
            />
            <Label htmlFor="enableSerialNumber" className="text-sm font-medium text-gray-700">
              Serial Number
            </Label>
          </div>
          <Input
            type="text"
            placeholder="Serial Number..."
            className="w-48"
            value={localFilters.serialNumber}
            onChange={(e) => updateLocalFilter('serialNumber', e.target.value)}
            disabled={!localFilters.enableSerialNumber}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="serialOnly"
              checked={localFilters.serialOnly}
              onCheckedChange={(checked) => updateLocalFilter('serialOnly', checked)}
              disabled={!localFilters.serialNumber}
            />
            <Label htmlFor="serialOnly" className="text-xs text-gray-600">
              Serial # only
            </Label>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableType"
              checked={localFilters.enableType}
              onCheckedChange={(checked) => updateLocalFilter('enableType', checked)}
            />
            <Label htmlFor="enableType" className="text-sm font-medium text-gray-700">
              Transaction Type
            </Label>
          </div>
          <Select 
            value={localFilters.type} 
            onValueChange={(value) => updateLocalFilter('type', value)}
            disabled={!localFilters.enableType}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {transactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Second row: Date filters and action buttons */}
      <div className="flex space-x-4 items-end">
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="enableDateRange"
            checked={localFilters.enableDateRange}
            onCheckedChange={(checked) => updateLocalFilter('enableDateRange', checked)}
          />
          <Label htmlFor="enableDateRange" className="text-sm font-medium text-gray-700">
            Date Range
          </Label>
        </div>
        
        <div className="flex flex-col space-y-1">
          <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
            From Date
          </Label>
          <Input
            id="fromDate"
            type="date"
            className="w-40"
            value={localFilters.fromDate}
            onChange={(e) => updateLocalFilter('fromDate', e.target.value)}
            disabled={!localFilters.enableDateRange}
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
            value={localFilters.toDate}
            onChange={(e) => updateLocalFilter('toDate', e.target.value)}
            disabled={!localFilters.enableDateRange}
          />
        </div>
        
        <Button 
          variant="default" 
          onClick={applyFilters}
          className="h-10"
        >
          Apply Filters
        </Button>
        
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="h-10"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}