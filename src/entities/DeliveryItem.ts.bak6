import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Delivery } from './Delivery'
import { OrderItem } from './OrderItem'

export enum RejectionReason {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DAMAGED = 'DAMAGED',
  WRONG_ITEM = 'WRONG_ITEM',
  CUSTOMER_REFUSED = 'CUSTOMER_REFUSED',
  ADDRESS_ISSUE = 'ADDRESS_ISSUE',
  QUANTITY_MISMATCH = 'QUANTITY_MISMATCH',
  OTHER = 'OTHER',
}

@Entity('DeliveryItem')
export class DeliveryItem {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  deliveryId: string

  @Column('uuid')
  orderItemId: string

  @Column('integer')
  deliveredQuantity: number

  @Column('enum', { enum: RejectionReason, nullable: true })
  rejectionReason?: RejectionReason

  @Column('text', { nullable: true })
  rejectionNotes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Delivery, delivery => delivery.deliveryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery

  @ManyToOne(() => OrderItem, item => item.deliveryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem
}

registerEntity(DeliveryItem)
