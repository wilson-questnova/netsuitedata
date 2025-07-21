'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';

interface PurchaseOrderData {
  documentNumber: string;
  internalId: string;
  vendor: string;
  total: number;
  status: string;
  memo: string;
  date: string;
  receiveBy: string;
  location: string;
  entries: PurchaseOrderEntryData[];
}

interface PurchaseOrderEntryData {
  itemInternalId: string;
  itemName: string;
  itemDescription: string;
  itemUpcCode: string;
  unitPrice: number;
  quantity: number;
  currency: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<PurchaseOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setParsedData([]);
      setSuccess(null);
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const parseCSV = () => {
    if (!file) return;

    // Check file size (limit to 50MB)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      setError('File is too large. Please use a file smaller than 50MB.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData([]);

    // Use FileReader to read the file content first
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        
        // Check if text content is too large
        if (csvText.length > 100 * 1024 * 1024) { // 100MB text limit
          setError('File content is too large to process. Please use a smaller file.');
          setIsLoading(false);
          return;
        }
        
        // Parse the CSV text using Papa Parse
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          worker: true, // Use web worker for large files
          chunkSize: 1024 * 1024, // Process in 1MB chunks
          complete: (results) => {
            try {
              const purchaseOrders: { [key: string]: PurchaseOrderData } = {};

              results.data.forEach((row: any) => {
                 const documentNumber = row['Document Number '];
                 if (!documentNumber) return;

                 // Initialize purchase order if not exists
                 if (!purchaseOrders[documentNumber]) {
                   purchaseOrders[documentNumber] = {
                     documentNumber,
                     internalId: '', // Not available in this CSV format
                     vendor: row['Supplier '],
                     total: parseFloat(row['Amount (Gross) '].replace(/PHP\s*/g, '').replace(/,/g, '')) || 0,
                     status: row['Status '],
                     memo: row['Memo '],
                     date: row['Date '],
                     receiveBy: row['Receive By '],
                     location: row['Location '] || '',
                     entries: []
                   };
                 }

                 // Add entry if it's not a VAT item
                 const itemName = row['Item: Name '];
                 if (itemName && itemName.trim() !== 'VAT - Goods') {
                   purchaseOrders[documentNumber].entries.push({
                     itemInternalId: row['Item: Internal ID '],
                     itemName: itemName,
                     itemDescription: row['Item: Description (Purchase) '],
                     itemUpcCode: row['Item: UPC Code '],
                     unitPrice: parseFloat(row['Unit Price '].replace(/PHP\s*/g, '').replace(/,/g, '').replace(/"/g, '')) || 0,
                     quantity: parseInt(row['Quantity '].replace(/,/g, '')) || 0,
                     currency: row['Currency: Current Exchange Rate '],
                   });
                 }
               });

              const parsedArray = Object.values(purchaseOrders);
              setParsedData(parsedArray);
              setIsLoading(false);
            } catch (err) {
              setError('Error parsing CSV data. Please check the file format.');
              setIsLoading(false);
            }
          },
          error: (error: any) => {
             setError(`Error parsing CSV: ${error.message}`);
             setIsLoading(false);
           }
        });
      } catch (err) {
        setError('Error reading file content. Please try again.');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please check file permissions and try again.');
      setIsLoading(false);
    };

    // Read the file as text
    reader.readAsText(file);
  };

  const saveToDatabase = async () => {
    if (parsedData.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Successfully imported ${result.count} purchase orders!`);
        setParsedData([]);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        setError(`Error saving to database: ${errorData.error}`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSaving(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Import CSV Data</h1>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload CSV File</span>
          </CardTitle>
          <CardDescription>
            Select a CSV file with purchase order data to import. The file should follow the same format as the existing data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          {file && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          <Button 
            onClick={parseCSV} 
            disabled={!file || isLoading}
            className="w-full"
          >
            {isLoading ? 'Parsing...' : 'Parse CSV Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Data Preview Section */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Data Preview ({parsedData.length} Purchase Orders)</span>
              <Button 
                onClick={saveToDatabase} 
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save to Database'}</span>
              </Button>
            </CardTitle>
            <CardDescription>
              Review the parsed data before saving to the database. This will update existing purchase orders or create new ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((po, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{po.documentNumber}</TableCell>
                      <TableCell>{po.vendor}</TableCell>
                      <TableCell>{formatCurrency(po.total)}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'Pending Receipt' ? 'secondary' : 'default'}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(po.date)}</TableCell>
                      <TableCell>{po.entries.length} items</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 of {parsedData.length} purchase orders...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}