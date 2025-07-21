import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('purchase_order_entry')
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

  @Column()
  purchaseOrderId!: number;
}