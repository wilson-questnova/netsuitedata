import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';

@Entity()
export class PurchaseOrderEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  item!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  rate!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  quantity!: number;

  @ManyToOne('PurchaseOrder', (purchaseOrder: PurchaseOrder) => purchaseOrder.entries)
  purchaseOrder!: PurchaseOrder;
}