import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Transaction entity representing financial transactions from NetSuite
 * Maps to the transactions table in the database
 */
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  dateFormatted!: string; // e.g., "25-Jul"

  @Column()
  type!: string; // e.g., "Bill Payment", "Invoice", "Item Fulfillment"

  @Column({ type: 'varchar', length: 255, nullable: true })
  documentNumber!: string | null; // e.g., "6000023482", "417250"

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber!: string | null; // Serial number for tracking

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null; // Entity name

  @Column({ type: 'varchar', length: 255, nullable: true })
  account!: string | null; // Account description

  @Column({ type: 'text', nullable: true })
  memo!: string | null; // Transaction memo/description

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number; // Transaction amount

  @Column({ type: 'varchar', length: 255, nullable: true })
  employee!: string | null; // Employee name

  @Column({ type: 'varchar', length: 255, nullable: true })
  employeeName!: string | null; // Full employee name

  @Column({ type: 'varchar', length: 255, nullable: true })
  item!: string | null; // Item code/reference

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null; // Location code

  @Column({ type: 'varchar', length: 255, nullable: true })
  subsidiary!: string | null; // Subsidiary name

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}