import { getDataSource } from '../src/lib/db';
import { Transaction } from '../src/entity/Transaction';

async function clearTransactions() {
  try {
    console.log('🔄 Connecting to database...');
    const dataSource = await getDataSource();
    console.log('✅ Database connected successfully');

    const transactionRepository = dataSource.getRepository(Transaction);
    
    // Get count before clearing
    const countBefore = await transactionRepository.count();
    console.log(`📊 Current transactions count: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('ℹ️  Transactions table is already empty');
      return;
    }
    
    // Clear all transactions
    console.log('🗑️  Clearing all transactions...');
    await transactionRepository.clear();
    
    // Verify clearing
    const countAfter = await transactionRepository.count();
    console.log(`✅ Transactions cleared successfully. Remaining count: ${countAfter}`);
    
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Database connection will be handled by the connection pool');
  }
}

// Run the script
clearTransactions();