import 'reflect-metadata';
import { getDataSource } from '../src/lib/db';

async function addDateColumns() {
  const dataSource = await getDataSource(true);
  
  try {
    // Add date columns to purchase_order table
    await dataSource.query(`
      ALTER TABLE purchase_order 
      ADD COLUMN date DATE;
    `);
    
    await dataSource.query(`
      ALTER TABLE purchase_order 
      ADD COLUMN receiveBy DATE;
    `);
    
    console.log('Date columns added successfully');
  } catch (error) {
    console.error('Error adding date columns:', error);
  } finally {
    await dataSource.destroy();
  }
}

addDateColumns()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  });