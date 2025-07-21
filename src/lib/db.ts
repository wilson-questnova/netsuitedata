import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PurchaseOrder } from '../entity/PurchaseOrder';
import { PurchaseOrderEntry } from '../entity/PurchaseOrderEntry';

const AppDataSource = (synchronize: boolean) => new DataSource({
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
  // Additional options for remote connections
  connectTimeout: 60000,
  acquireTimeout: 60000,
});

let dataSource: DataSource;

export const getDataSource = async (synchronize = false) => {


  dataSource = AppDataSource(synchronize);
  return await dataSource.initialize();
};