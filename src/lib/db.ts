import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PurchaseOrder } from '../entity/PurchaseOrder';
import { PurchaseOrderEntry } from '../entity/PurchaseOrderEntry';
import path from 'path';

const AppDataSource = (synchronize: boolean) => {
  // Use SQLite only when explicitly enabled
  const useSQLite = process.env.USE_SQLITE === 'true';
  
  if (useSQLite) {
    return new DataSource({
      type: 'sqlite',
      database: path.join(process.cwd(), 'netsuite_data.sqlite'),
      synchronize: true, // Auto-create tables for SQLite
      logging: process.env.DB_LOGGING === 'true' || false,
      entities: [PurchaseOrder, PurchaseOrderEntry],
      migrations: [],
      subscribers: [],
    });
  }
  
  // MySQL configuration for production with connection pooling
  return new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'letmeinsyo',
    database: process.env.DB_DATABASE || 'netsuite_data',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || synchronize,
    logging: process.env.DB_LOGGING === 'true' || false,
    entities: [PurchaseOrder, PurchaseOrderEntry],
    migrations: [],
    subscribers: [],
    // Connection pooling configuration
    extra: {
      connectionLimit: 10, // Maximum number of connections in pool
      acquireTimeout: 60000, // Maximum time to wait for connection
      timeout: 60000, // Maximum time for query execution
      reconnect: true, // Automatically reconnect on connection loss
      idleTimeout: 300000, // Close idle connections after 5 minutes
    },
    // Additional options for remote connections
    connectTimeout: 60000,
  });
};

let dataSource: DataSource;

export const getDataSource = async (synchronize = false) => {


  dataSource = AppDataSource(synchronize);
  return await dataSource.initialize();
};