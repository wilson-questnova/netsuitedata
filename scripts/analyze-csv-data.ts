import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

/**
 * Analyze CSV data to understand parsing issues
 */

function parseTransactionRow(row: string[]): any {
  try {
    // Skip empty rows or rows with insufficient data
    if (!row || row.length < 8) return { valid: false, reason: 'insufficient_data' };
    
    // Parse date (format: 7/1/25)
    const dateStr = row[0]?.trim();
    let parsedDate: string | null = null;
    
    if (dateStr && dateStr !== 'Date') {
      const [month, day, year] = dateStr.split('/');
      if (!isNaN(parseInt(month)) && !isNaN(parseInt(day)) && !isNaN(parseInt(year))) {
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day)).toISOString();
      }
    }
    
    // Skip if no valid date
    if (!parsedDate) return { valid: false, reason: 'invalid_date', dateStr };
    
    // Parse amount
    const amountStr = row[7]?.trim();
    const amount = amountStr && amountStr !== '' ? parseFloat(amountStr.replace(/,/g, '')) || 0 : 0;
    
    return {
      valid: true,
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
    return { valid: false, reason: 'parse_error', error: error.message };
  }
}

async function analyzeCSVFile(csvFile: string): Promise<void> {
  console.log(`\n📁 Analyzing ${csvFile}...`);
  
  const csvPath = path.join(process.cwd(), '..', 'csv_files', 'transactions', csvFile);
  
  if (!fs.existsSync(csvPath)) {
    console.warn(`⚠️  CSV file not found at: ${csvPath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parseResult = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
  }

  const rows = parseResult.data as string[][];
  console.log(`📊 Total rows in CSV: ${rows.length}`);
  
  let validCount = 0;
  let invalidCount = 0;
  const invalidReasons: { [key: string]: number } = {};
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const result = parseTransactionRow(rows[i]);
    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
      invalidReasons[result.reason] = (invalidReasons[result.reason] || 0) + 1;
      
      // Show first few invalid examples
      if (invalidCount <= 5) {
        console.log(`Invalid row ${i}:`, result.reason, result.dateStr || result.error);
      }
    }
  }
  
  console.log(`✅ Valid transactions: ${validCount}`);
  console.log(`❌ Invalid transactions: ${invalidCount}`);
  console.log(`📋 Invalid reasons:`, invalidReasons);
}

async function main() {
  try {
    const transactionsDir = path.join(process.cwd(), '..', 'csv_files', 'transactions');
    const csvFiles = fs.readdirSync(transactionsDir)
      .filter(file => file.endsWith('.csv'))
      .sort();
    
    console.log(`📂 Found ${csvFiles.length} CSV files to analyze:`, csvFiles);
    
    for (const csvFile of csvFiles) {
      await analyzeCSVFile(csvFile);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

main();