import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { PurchaseOrder } from '../src/entity/PurchaseOrder';
import { PurchaseOrderEntry } from '../src/entity/PurchaseOrderEntry';
import { getDataSource } from '../src/lib/db';

interface CsvRow {
  'Document Number ': string;
  'Company: Name ': string;
  'Date ': string;
  'Receive By ': string;
  'Terms: Name ': string;
  'Status ': string;
  'Supplier ': string;
  'Location ': string;
  'Amount (Gross) ': string;
  'Memo ': string;
  'Item: Internal ID ': string;
  'Item: Name ': string;
  'Item: Description (Purchase) ': string;
  'Item: UPC Code ': string;
  'Unit Price ': string;
  'Quantity ': string;
  'Currency: Current Exchange Rate ': string;
}

interface PurchaseOrderEntryData {
    itemInternalId: string;
    itemName: string;
    itemDescription: string | null;
    itemUpcCode: string | null;
    unitPrice: number;
    quantity: number;
    currency: string;
}

interface PurchaseOrderData {
    documentNumber: string;
    companyName: string;
    date: Date;
    receiveBy: Date;
    termsName: string;
    status: string;
    supplier: string;
    location: string;
    amountGross: number;
    memo: string | null;
    entries: PurchaseOrderEntryData[];
}


async function main() {
  const dataSource = await getDataSource(true);
  console.log('Starting CSV import...');
  const filePath = path.join(__dirname, '../../csv_files/CustomPurchaseOrderRegister2-563-2020-2021.csv');
  const file = fs.readFileSync(filePath, 'utf8');
  console.log('CSV file read successfully.');

  await new Promise<void>((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log(`Found ${results.data.length} rows in CSV.`);
          const purchaseOrders: { [key: string]: PurchaseOrderData } = {};

          for (const row of results.data) {
            const documentNumber = row['Document Number '];
            if (!documentNumber) continue;

            if (!purchaseOrders[documentNumber]) {
              purchaseOrders[documentNumber] = {
                documentNumber: documentNumber,
                companyName: row['Company: Name '],
                date: new Date(row['Date ']),
                receiveBy: new Date(row['Receive By ']),
                termsName: row['Terms: Name '],
                status: row['Status '],
                supplier: row['Supplier '],
                location: row['Location '],
                amountGross: parseFloat(row['Amount (Gross) '].replace(/PHP\s*/g, '').replace(/,/g, '')) || 0,
                memo: row['Memo '],
                entries: [],
              };
            }

            // Skip VAT - Goods entries as they are tax-related, not actual products
            const itemName = row['Item: Name '];
            if (itemName && itemName.trim() !== 'VAT - Goods') {
              purchaseOrders[documentNumber].entries.push({
                itemInternalId: row['Item: Internal ID '],
                itemName: itemName,
                itemDescription: row['Item: Description (Purchase) '],
                itemUpcCode: row['Item: UPC Code '],
                unitPrice: parseFloat(row['Unit Price '].replace(/PHP\s*/g, '').replace(/,/g, '')) || 0,
                quantity: parseInt(row['Quantity '].replace(/,/g, '')) || 0,
                currency: row['Currency: Current Exchange Rate '],
              });
            }
          }

          const purchaseOrderList = Object.values(purchaseOrders);
          console.log(`Processed into ${purchaseOrderList.length} purchase orders.`);

          const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
          const purchaseOrderEntryRepository = dataSource.getRepository(PurchaseOrderEntry);

          for (const poData of purchaseOrderList) {
            // Check if purchase order already exists
            let purchaseOrder = await purchaseOrderRepository.findOne({
              where: { documentNumber: poData.documentNumber }
            });

            if (purchaseOrder) {
              // Update existing purchase order
              purchaseOrder.vendor = poData.supplier;
              purchaseOrder.total = poData.amountGross;
              purchaseOrder.status = poData.status;
              purchaseOrder.memo = poData.memo || '';
              purchaseOrder.date = poData.date;
              purchaseOrder.receiveBy = poData.receiveBy;

              // Remove existing entries
              await purchaseOrderEntryRepository.delete({ purchaseOrderId: purchaseOrder.id });
            } else {
              // Create new purchase order
              purchaseOrder = new PurchaseOrder();
              purchaseOrder.internalId = poData.documentNumber;
              purchaseOrder.documentNumber = poData.documentNumber;
              purchaseOrder.vendor = poData.supplier;
              purchaseOrder.total = poData.amountGross;
              purchaseOrder.status = poData.status;
              purchaseOrder.memo = poData.memo || '';
              purchaseOrder.date = poData.date;
              purchaseOrder.receiveBy = poData.receiveBy;
            }

            // Save purchase order first
            await purchaseOrderRepository.save(purchaseOrder);

            // Create new entries
            for (const entryData of poData.entries) {
              const entry = new PurchaseOrderEntry();
              entry.item = entryData.itemName;
              entry.rate = entryData.unitPrice;
              entry.amount = entryData.unitPrice * entryData.quantity;
              entry.quantity = entryData.quantity;
              entry.purchaseOrderId = purchaseOrder.id;
              await purchaseOrderEntryRepository.save(entry);
            }
          }

          console.log('Data imported successfully');
          resolve();
        } catch (error) {
          console.error('Error during data processing or import:', error);
          reject(error);
        }
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      }
    });
  });
}

main()
  .catch((e) => {
    console.error('Error during script execution:', e);
    process.exit(1);
  });