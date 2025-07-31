import { getDataSource } from '../src/lib/db';
import { Transaction } from '../src/entity/Transaction';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

interface TransactionData {
  date: string;
  dateFormatted: string;
  type: string;
  documentNumber: string | null;
  name: string | null;
  account: string;
  memo: string | null;
  amount: number;
  employee: string | null;
  employeeName: string | null;
  item: string | null;
  serialNumber: string | null;
  location: string | null;
  subsidiary: string | null;
}

function parseTransactionRow(row: string[]): TransactionData | null {
  try {
    // Skip empty rows or rows with insufficient data
    if (!row || row.length < 8) return null;
    
    // Parse date (format: 7/1/25)
    const dateStr = row[0]?.trim();
    let parsedDate: string | null = null;
    
    if (dateStr && dateStr !== 'Date') {
      const [month, day, year] = dateStr.split('/');
      if (!isNaN(parseInt(month)) && !isNaN(parseInt(day)) && !isNaN(parseInt(year))) {
        // Fix year interpretation: 25 should be 2025, but for dates it should be reasonable
        // Assuming years 00-30 are 2000-2030, 31-99 are 1931-1999
        const fullYear = parseInt(year) <= 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        // Format as YYYY-MM-DD for MySQL date column
        parsedDate = date.toISOString().split('T')[0];
      }
    }
    
    // Skip if no valid date
    if (!parsedDate) return null;
    
    // Parse amount
    const amountStr = row[7]?.trim();
    const amount = amountStr && amountStr !== '' ? parseFloat(amountStr.replace(/,/g, '')) || 0 : 0;
    
    return {
      date: parsedDate,
      dateFormatted: row[1]?.trim() || '',
      type: row[2]?.trim() || '',
      documentNumber: row[3]?.trim() || null,
      name: row[4]?.trim() || null,
      account: row[5]?.trim() || '',
      memo: row[6]?.trim() || null,
      amount,
      employee: row[8]?.trim() || null,
      employeeName: row[9]?.trim() || null,
      item: row[10]?.trim() || null,
      serialNumber: row[11]?.trim() || null,
      location: row[12]?.trim() || null,
      subsidiary: row[13]?.trim() || null
    };
  } catch (error: any) {
    console.warn(`Error parsing row:`, error);
    return null;
  }
}

async function testImportWithDetailedLogging() {
  console.log('🚀 Starting test import with detailed logging...');
  
  const dataSource = await getDataSource();
  await dataSource.synchronize();
  
  const transactionRepository = dataSource.getRepository(Transaction);
  
  // Count existing transactions
  const existingCount = await transactionRepository.count();
  console.log(`📊 Existing transactions in database: ${existingCount}`);
  
  // Test with just the first file
  const csvFile = 'TransactionsJuly.csv';
  const csvPath = path.join(process.cwd(), '..', 'csv_files', 'transactions', csvFile);
  
  console.log(`📁 Processing ${csvFile}...`);
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parseResult = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  const allRows = parseResult.data as string[][];
  const rows = allRows.slice(1); // Skip header row
  
  console.log(`📊 Total rows to process: ${rows.length}`);
  
  let validCount = 0;
  let invalidCount = 0;
  let successfulInserts = 0;
  let failedInserts = 0;
  
  const batchSize = 100; // Smaller batch for testing
  let batch: TransactionData[] = [];
  
  for (let i = 0; i < Math.min(1000, rows.length); i++) { // Test with first 1000 rows
    const transactionData = parseTransactionRow(rows[i]);
    
    if (transactionData) {
      validCount++;
      batch.push(transactionData);
    } else {
      invalidCount++;
    }

    // Process batch when it reaches the batch size or at the end
    if (batch.length >= batchSize || i === Math.min(999, rows.length - 1)) {
      if (batch.length > 0) {
        console.log(`\n🔄 Processing batch of ${batch.length} transactions...`);
        
        try {
          // Try individual saves to see detailed errors
          for (const transactionData of batch) {
            try {
              const transaction = new Transaction();
              Object.assign(transaction, transactionData);
              await transactionRepository.save(transaction);
              successfulInserts++;
            } catch (error: any) {
              failedInserts++;
              console.error(`❌ Failed to insert transaction:`, {
                error: error.message,
                code: error.code,
                transaction: {
                  date: transactionData.date,
                  type: transactionData.type,
                  documentNumber: transactionData.documentNumber,
                  amount: transactionData.amount
                }
              });
              
              // Stop after first few errors to avoid spam
              if (failedInserts >= 5) {
                console.log('⚠️  Stopping after 5 errors to avoid spam...');
                break;
              }
            }
          }
          
          console.log(`✅ Batch completed: ${successfulInserts} successful, ${failedInserts} failed`);
          
        } catch (error: any) {
          console.error('❌ Batch processing failed:', error.message);
        }
        
        batch = [];
        
        if (failedInserts >= 5) break;
      }
    }
  }
  
  const finalCount = await transactionRepository.count();
  
  console.log('\n📊 Import Summary:');
  console.log(`- Valid parsed transactions: ${validCount}`);
  console.log(`- Invalid transactions: ${invalidCount}`);
  console.log(`- Successful inserts: ${successfulInserts}`);
  console.log(`- Failed inserts: ${failedInserts}`);
  console.log(`- Database count before: ${existingCount}`);
  console.log(`- Database count after: ${finalCount}`);
  console.log(`- Net increase: ${finalCount - existingCount}`);
}

testImportWithDetailedLogging().catch(console.error);