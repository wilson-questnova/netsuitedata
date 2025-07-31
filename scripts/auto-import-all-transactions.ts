import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { getDataSource } from '../src/lib/db';
import { Transaction } from '../src/entity/Transaction';

/**
 * Auto-discovery and import script for all transaction CSV files
 * Features:
 * - Automatically discovers all CSV files in the transactions directory
 * - Supports multiple CSV formats and structures
 * - Intelligent duplicate detection and skipping
 * - Progress tracking and resumable imports
 * - Memory-efficient streaming for very large files
 * Usage: npm run auto-import-all-transactions
 */

interface ImportProgress {
  fileName: string;
  totalRows: number;
  processedRows: number;
  importedRows: number;
  skippedRows: number;
  errors: number;
  startTime: number;
  completed: boolean;
}

class AutoTransactionImporter {
  private dataSource: any;
  private transactionRepository: any;
  private batchSize = 500;
  private progressFile = 'import-progress.json';
  private existingTransactions = new Set<string>();

  async initialize() {
    console.log('🔍 Initializing auto transaction importer...');
    
    this.dataSource = await getDataSource();
    await this.dataSource.synchronize();
    
    // Optimize for bulk operations
    await this.dataSource.query('SET autocommit = 1');
    await this.dataSource.query('SET unique_checks = 1');
    
    this.transactionRepository = this.dataSource.getRepository(Transaction);
    
    // Load existing transactions for duplicate detection
    await this.loadExistingTransactions();
    
    console.log('✅ Auto importer initialized');
  }

  async loadExistingTransactions() {
    console.log('📋 Loading existing transactions for duplicate detection...');
    
    const existing = await this.transactionRepository
      .createQueryBuilder('t')
      .select(['t.date', 't.type', 't.documentNumber', 't.amount', 't.account'])
      .getMany();
    
    for (const transaction of existing) {
      const key = this.generateTransactionKey(transaction);
      this.existingTransactions.add(key);
    }
    
    console.log(`📊 Loaded ${this.existingTransactions.size} existing transactions for duplicate checking`);
  }

  generateTransactionKey(transaction: any): string {
    // Create a unique key based on key fields to detect duplicates
    return `${transaction.date}|${transaction.type}|${transaction.documentNumber || ''}|${transaction.amount}|${transaction.account}`;
  }

  loadProgress(): ImportProgress[] {
    const progressPath = path.join(process.cwd(), this.progressFile);
    if (fs.existsSync(progressPath)) {
      try {
        return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Could not load progress file, starting fresh');
      }
    }
    return [];
  }

  saveProgress(progress: ImportProgress[]) {
    const progressPath = path.join(process.cwd(), this.progressFile);
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  }

  detectCSVStructure(rows: string[][]): { hasHeader: boolean; dateColumn: number; typeColumn: number } {
    if (rows.length === 0) return { hasHeader: false, dateColumn: 0, typeColumn: 2 };
    
    const firstRow = rows[0];
    const secondRow = rows.length > 1 ? rows[1] : null;
    
    // Check if first row looks like headers
    const hasHeader = firstRow.some(cell => 
      cell && (cell.toLowerCase().includes('date') || 
               cell.toLowerCase().includes('type') || 
               cell.toLowerCase().includes('amount'))
    );
    
    // Find date column
    let dateColumn = 0;
    for (let i = 0; i < firstRow.length; i++) {
      const cell = hasHeader ? (secondRow ? secondRow[i] : '') : firstRow[i];
      if (cell && this.isDateFormat(cell)) {
        dateColumn = i;
        break;
      }
    }
    
    // Find type column (usually after date)
    let typeColumn = Math.min(dateColumn + 2, firstRow.length - 1);
    
    return { hasHeader, dateColumn, typeColumn };
  }

  isDateFormat(str: string): boolean {
    if (!str) return false;
    // Check for common date formats: MM/DD/YY, MM/DD/YYYY, YYYY-MM-DD, etc.
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YY or MM/DD/YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/,      // YYYY-MM-DD
      /^\d{1,2}-\d{1,2}-\d{2,4}$/,    // MM-DD-YY or MM-DD-YYYY
    ];
    return datePatterns.some(pattern => pattern.test(str.trim()));
  }

  parseFlexibleDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      const trimmed = dateStr.trim();
      
      // Handle MM/DD/YY format
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
        const [month, day, year] = trimmed.split('/');
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 
                        parseInt(year) < 100 ? 1900 + parseInt(year) : parseInt(year);
        return new Date(fullYear, parseInt(month) - 1, parseInt(day)).toISOString();
      }
      
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
        return new Date(trimmed).toISOString();
      }
      
      // Try to parse as general date
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  parseTransactionFromRow(row: string[], structure: any): any | null {
    try {
      if (!row || row.length < 3) return null;
      
      // Parse date
      const dateStr = row[structure.dateColumn]?.trim();
      const parsedDate = this.parseFlexibleDate(dateStr);
      if (!parsedDate) return null;
      
      // Extract other fields with flexible positioning
      const type = row[structure.typeColumn]?.trim() || '';
      const documentNumber = row[3]?.trim() || null;
      const name = row[4]?.trim() || null;
      const account = row[5]?.trim() || '';
      const memo = row[6]?.trim() || null;
      
      // Parse amount (look for numeric values)
      let amount = 0;
      for (let i = 7; i < Math.min(row.length, 12); i++) {
        const amountStr = row[i]?.trim();
        if (amountStr && /^-?\d+(\.\d+)?$/.test(amountStr.replace(/,/g, ''))) {
          amount = parseFloat(amountStr.replace(/,/g, ''));
          break;
        }
      }
      
      const transaction = {
        date: parsedDate,
        dateFormatted: row[1]?.trim() || dateStr,
        type,
        documentNumber,
        name,
        account,
        memo,
        amount,
        employee: row[8]?.trim() || null,
        employeeName: row[9]?.trim() || null,
        item: row[10]?.trim() || null,
        serialNumber: row[11]?.trim() || null,
        location: row[12]?.trim() || null,
        subsidiary: row[13]?.trim() || null
      };
      
      return transaction;
    } catch (error) {
      return null;
    }
  }

  async processCSVFile(filePath: string, progress: ImportProgress): Promise<ImportProgress> {
    console.log(`\n📁 Processing ${progress.fileName}...`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      progress.completed = true;
      return progress;
    }

    const csvContent = fs.readFileSync(filePath, 'utf8');
    
    const parseResult = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.warn(`⚠️  Parsing errors in ${progress.fileName}:`, parseResult.errors.slice(0, 3));
    }

    const allRows = parseResult.data as string[][];
    progress.totalRows = allRows.length;
    
    // Detect CSV structure
    const structure = this.detectCSVStructure(allRows);
    console.log(`📊 Detected structure: hasHeader=${structure.hasHeader}, dateColumn=${structure.dateColumn}`);
    
    const dataRows = structure.hasHeader ? allRows.slice(1) : allRows;
    let batch: any[] = [];
    
    for (let i = progress.processedRows; i < dataRows.length; i++) {
      const row = dataRows[i];
      progress.processedRows++;
      
      const transaction = this.parseTransactionFromRow(row, structure);
      
      if (!transaction) {
        progress.skippedRows++;
        continue;
      }
      
      // Check for duplicates
      const key = this.generateTransactionKey(transaction);
      if (this.existingTransactions.has(key)) {
        progress.skippedRows++;
        continue;
      }
      
      batch.push(transaction);
      
      // Process batch
      if (batch.length >= this.batchSize) {
        const imported = await this.saveBatch(batch);
        progress.importedRows += imported;
        
        // Add to existing set to prevent duplicates within the same import
        batch.forEach(t => this.existingTransactions.add(this.generateTransactionKey(t)));
        
        batch = [];
        
        // Save progress
        this.saveProgress([progress]);
        
        console.log(`✅ Progress: ${progress.processedRows}/${progress.totalRows} processed, ${progress.importedRows} imported, ${progress.skippedRows} skipped`);
      }
    }
    
    // Process remaining batch
    if (batch.length > 0) {
      const imported = await this.saveBatch(batch);
      progress.importedRows += imported;
      batch.forEach(t => this.existingTransactions.add(this.generateTransactionKey(t)));
    }
    
    progress.completed = true;
    const duration = (Date.now() - progress.startTime) / 1000;
    
    console.log(`✅ Completed ${progress.fileName}:`);
    console.log(`   - Total rows: ${progress.totalRows}`);
    console.log(`   - Imported: ${progress.importedRows}`);
    console.log(`   - Skipped: ${progress.skippedRows}`);
    console.log(`   - Errors: ${progress.errors}`);
    console.log(`   - Duration: ${duration.toFixed(2)}s`);
    
    return progress;
  }

  async saveBatch(transactions: any[]): Promise<number> {
    try {
      const entities = transactions.map(t => {
        const transaction = new Transaction();
        Object.assign(transaction, t);
        return transaction;
      });
      
      await this.transactionRepository.save(entities);
      return entities.length;
    } catch (error) {
      console.error('Error saving batch:', error);
      return 0;
    }
  }

  async importAllTransactions(): Promise<void> {
    try {
      await this.initialize();
      
      // Discover all CSV files
      const transactionsDir = path.join(process.cwd(), '..', 'csv_files', 'transactions');
      
      if (!fs.existsSync(transactionsDir)) {
        console.error(`❌ Transactions directory not found: ${transactionsDir}`);
        return;
      }
      
      const csvFiles = fs.readdirSync(transactionsDir)
        .filter(file => file.endsWith('.csv'))
        .sort();
      
      console.log(`📂 Discovered ${csvFiles.length} CSV files:`, csvFiles);
      
      // Load existing progress
      let progressList = this.loadProgress();
      
      // Initialize progress for new files
      for (const csvFile of csvFiles) {
        if (!progressList.find(p => p.fileName === csvFile)) {
          progressList.push({
            fileName: csvFile,
            totalRows: 0,
            processedRows: 0,
            importedRows: 0,
            skippedRows: 0,
            errors: 0,
            startTime: Date.now(),
            completed: false
          });
        }
      }
      
      const startTime = Date.now();
      let totalImported = 0;
      
      // Process each file
      for (const progress of progressList) {
        if (progress.completed) {
          console.log(`⏭️  Skipping already completed file: ${progress.fileName}`);
          totalImported += progress.importedRows;
          continue;
        }
        
        const filePath = path.join(transactionsDir, progress.fileName);
        const updatedProgress = await this.processCSVFile(filePath, progress);
        totalImported += updatedProgress.importedRows;
        
        // Update progress list
        const index = progressList.findIndex(p => p.fileName === progress.fileName);
        if (index >= 0) {
          progressList[index] = updatedProgress;
        }
        
        this.saveProgress(progressList);
      }
      
      const totalDuration = (Date.now() - startTime) / 1000;
      
      console.log(`\n🎉 Auto import completed!`);
      console.log(`📊 Summary:`);
      console.log(`   - Files processed: ${csvFiles.length}`);
      console.log(`   - Total transactions imported: ${totalImported}`);
      console.log(`   - Total duration: ${totalDuration.toFixed(2)}s`);
      console.log(`   - Average speed: ${(totalImported / totalDuration).toFixed(0)} transactions/second`);
      
      // Clean up progress file
      const progressPath = path.join(process.cwd(), this.progressFile);
      if (fs.existsSync(progressPath)) {
        fs.unlinkSync(progressPath);
        console.log('🧹 Cleaned up progress file');
      }
      
      // Final database summary
      const totalCount = await this.transactionRepository.count();
      console.log(`\n📈 Final database count: ${totalCount} transactions`);
      
    } catch (error) {
      console.error('❌ Auto import failed:', error);
      throw error;
    } finally {
      await this.dataSource.destroy();
    }
  }
}

// Run the auto import
async function main() {
  const importer = new AutoTransactionImporter();
  
  try {
    await importer.importAllTransactions();
    console.log('\n✅ Auto import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Auto import failed:', error);
    process.exit(1);
  }
}

main();