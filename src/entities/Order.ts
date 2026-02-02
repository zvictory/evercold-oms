import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Customer } from './Customer'

// Forward declarations for entities that will be created in later tasks
export class OrderItem {
  order: any
}

export class Delivery {
  order: any
}

export class EdoDocumentSync {
  order: any
}

export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum SourceType {
  DETAILED = 'DETAILED',
  REGISTRY = 'REGISTRY',
}

@Entity('Order')
export class Order {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('text', { unique: true })
  orderNumber: string

  @Column('enum', { enum: OrderStatus, default: OrderStatus.NEW })
  status: OrderStatus

  @Column('enum', { enum: SourceType, default: SourceType.DETAILED })
  sourceType: SourceType

  @Column('date')
  orderDate: Date

  @Column('date', { nullable: true })
  requiredDeliveryDate?: Date

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number

  @Column('text', { unique: true, nullable: true })
  invoiceNumber?: string

  @Column('date', { nullable: true })
  invoiceDate?: Date

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, customer => customer.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @OneToMany(() => OrderItem, item => item.order, { cascade: true, onDelete: 'CASCADE' })
  orderItems: OrderItem[]

  @OneToMany(() => Delivery, delivery => delivery.order, { cascade: true, onDelete: 'CASCADE' })
  deliveries: Delivery[]

  @OneToMany(() => EdoDocumentSync, sync => sync.order, { cascade: true, onDelete: 'CASCADE' })
  edoSync: EdoDocumentSync[]
}

registerEntity(Order)
