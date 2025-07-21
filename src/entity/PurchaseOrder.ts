import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PurchaseOrderEntry } from './PurchaseOrderEntry';

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  internalId!: string;

  @Column()
  documentNumber!: string;

  @Column()
  vendor!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column()
  status!: string;

  @Column()
  memo!: string;

  @Column({ type: 'date', nullable: true })
  date!: Date;

  @Column({ type: 'date', nullable: true })
  receiveBy!: Date;

  @OneToMany('PurchaseOrderEntry', (entry: PurchaseOrderEntry) => entry.purchaseOrder, { cascade: true })
  entries!: PurchaseOrderEntry[];
}