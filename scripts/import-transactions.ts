import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { getDataSource } from '../src/lib/db';
import { Transaction } from '../src/entity/Transaction';

/**
 * Script to import transactions from CSV file into the database
 * Usage: npm run import-transactions
 */
async function importTransactions() {
  try {
    console.log('Starting transaction import...');
    
    // Initialize database connection
    const dataSource = await getDataSource();
    
    // Ensure table exists by running synchronize
    await dataSource.synchronize();
    
    // Enable autocommit mode
    await dataSource.query('SET autocommit = 1');
    console.log('Autocommit enabled');
    
    const transactionRepository = dataSource.getRepository(Transaction);
    
    // Get list of CSV files to import
    const csvFiles = ['TransactionsJune.csv', 'TransactionsJuly.csv'];
    let totalProcessedCount = 0;
    
    for (const csvFile of csvFiles) {
      console.log(`\n📁 Processing ${csvFile}...`);
      
      const csvPath = path.join(process.cwd(), '..', 'csv_files', 'transactions', csvFile);
      
      if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  CSV file not found at: ${csvPath}, skipping...`);
        continue;
      }
      
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      
      // Parse CSV
      const parseResult = Papa.parse(csvContent, {
        header: false,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
      });
      
      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        console.warn(`⚠️  Skipping ${csvFile} due to parsing errors`);
        continue;
      }
      
      const allRows = parseResult.data as string[][];
      // Skip header row
      const rows = allRows.slice(1);
    
      // Process rows in smaller batches with immediate commits
      const batchSize = 50; // Smaller batch size for better reliability
      let processedCount = 0;
    
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const transactions: Transaction[] = [];
      
        for (const row of batch) {
          try {
            // Skip empty rows or rows with insufficient data
            if (!row || row.length < 8) continue;
            
            const transaction = new Transaction();
          
            // Parse date (format: 7/1/25)
            const dateStr = row[0]?.trim();
            if (dateStr && dateStr !== 'Date') {
              const [month, day, year] = dateStr.split('/');
              if (!isNaN(parseInt(month)) && !isNaN(parseInt(day)) && !isNaN(parseInt(year))) {
                const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
                transaction.date = new Date(fullYear, parseInt(month) - 1, parseInt(day)).toISOString();
              }
            }
            
            // Skip if no valid date
            if (!transaction.date) {
              continue;
            }
            
            transaction.dateFormatted = row[1]?.trim() || '';
            transaction.type = row[2]?.trim() || '';
            transaction.documentNumber = row[3]?.trim() || null;
            transaction.name = row[4]?.trim() || null;
            transaction.account = row[5]?.trim() || '';
            transaction.memo = row[6]?.trim() || null;
            
            // Parse amount
            const amountStr = row[7]?.trim();
            if (amountStr && amountStr !== '') {
              transaction.amount = parseFloat(amountStr.replace(/,/g, '')) || 0;
            } else {
              transaction.amount = 0;
            }
          
            transaction.employee = row[8]?.trim() || null; // Cashier
            transaction.employeeName = row[9]?.trim() || null; // Encoded by
            transaction.item = row[10]?.trim() || null; // Expense Amount
            transaction.serialNumber = row[11]?.trim() || null; // Transaction Serial/Lot Number
            transaction.location = row[12]?.trim() || null; // Location
            transaction.subsidiary = row[13]?.trim() || null; // Company
            
            transactions.push(transaction);
          } catch (error) {
            console.warn(`Error processing row ${i + batch.indexOf(row) + 1}:`, error);
            continue;
          }
        }
      
        // Save batch and immediately commit
        if (transactions.length > 0) {
          await transactionRepository.save(transactions);
          processedCount += transactions.length;
          console.log(`✅ Saved batch: ${processedCount} transactions processed from ${csvFile}...`);
          
          // Force a small delay to ensure database writes are committed
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`✅ Completed ${csvFile}: ${processedCount} transactions imported`);
      totalProcessedCount += processedCount;
    }
    
    console.log(`\n✅ Successfully imported ${totalProcessedCount} transactions from all files!`);
    
    // Display summary statistics
    const totalCount = await transactionRepository.count();
    const uniqueTypes = await transactionRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.type', 'type')
      .getRawMany();
    
    console.log(`\n📊 Import Summary:`);
    console.log(`- Total transactions: ${totalCount}`);
    console.log(`- Unique transaction types: ${uniqueTypes.length}`);
    console.log(`- Transaction types: ${uniqueTypes.map(t => t.type).join(', ')}`);
    
    // Close database connection to ensure all transactions are committed
    await dataSource.destroy();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importTransactions()
  .then(() => {
    console.log('Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });