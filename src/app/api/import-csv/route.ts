import { NextRequest, NextResponse } from 'next/server';
import { PurchaseOrder } from '../../../entity/PurchaseOrder';
import { PurchaseOrderEntry } from '../../../entity/PurchaseOrderEntry';
import { getDataSource } from '../../../lib/db';

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

export async function POST(request: NextRequest) {
  try {
    console.log('Starting CSV import process...');
    
    const { data }: { data: PurchaseOrderData[] } = await request.json();
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data format received');
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    console.log(`Processing ${data.length} purchase orders...`);
    
    let dataSource;
    try {
      dataSource = await getDataSource();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
    const purchaseOrderEntryRepository = dataSource.getRepository(PurchaseOrderEntry);

    let importedCount = 0;

    // Process each purchase order
    for (const poData of data) {
      try {
        // Check if purchase order already exists
        const existingPO = await purchaseOrderRepository.findOne({
          where: { documentNumber: poData.documentNumber }
        });

        let purchaseOrder: PurchaseOrder;

        if (existingPO) {
          // Update existing purchase order
          existingPO.internalId = poData.internalId;
          existingPO.vendor = poData.vendor;
          existingPO.total = poData.total;
          existingPO.status = poData.status;
          existingPO.memo = poData.memo;
          existingPO.date = poData.date ? new Date(poData.date) : new Date();
          existingPO.receiveBy = poData.receiveBy ? new Date(poData.receiveBy) : new Date();

          // Remove existing entries
          await purchaseOrderEntryRepository.delete({ purchaseOrderId: existingPO.id });

          purchaseOrder = await purchaseOrderRepository.save(existingPO);
        } else {
          // Create new purchase order
          purchaseOrder = new PurchaseOrder();
          purchaseOrder.documentNumber = poData.documentNumber;
          purchaseOrder.internalId = poData.internalId;
          purchaseOrder.vendor = poData.vendor;
          purchaseOrder.total = poData.total;
          purchaseOrder.status = poData.status;
          purchaseOrder.memo = poData.memo;
          purchaseOrder.date = poData.date ? new Date(poData.date) : new Date();
          purchaseOrder.receiveBy = poData.receiveBy ? new Date(poData.receiveBy) : new Date();

          purchaseOrder = await purchaseOrderRepository.save(purchaseOrder);
        }

        // Create new entries
        for (const entryData of poData.entries) {
          const entry = new PurchaseOrderEntry();
          entry.item = entryData.itemName || entryData.itemInternalId;
          entry.rate = entryData.unitPrice;
          entry.amount = entryData.unitPrice * entryData.quantity;
          entry.quantity = entryData.quantity;
          entry.purchaseOrderId = purchaseOrder.id;

          await purchaseOrderEntryRepository.save(entry);
        }

        importedCount++;
      } catch (error) {
        console.error(`Error processing purchase order ${poData.documentNumber}:`, error);
        // Continue with next purchase order instead of failing completely
      }
    }

    return NextResponse.json(
      { 
        message: 'Import completed successfully',
        count: importedCount,
        total: data.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Import error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error during import';
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection refused. Please check database server.';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Database connection timed out. Please try again.';
      } else if (error.message.includes('ER_ACCESS_DENIED')) {
        errorMessage = 'Database access denied. Please check credentials.';
      } else {
        errorMessage = `Import failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}