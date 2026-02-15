import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Order } from './Order'
import { Product } from './Product'
import { CustomerBranch } from './CustomerBranch'

// Forward declaration for entity that will be created in Task 4
export class DeliveryItem {
  orderItem: any
}

@Entity('OrderItem')
export class OrderItem {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  orderId: string

  @Column('uuid')
  productId: string

  @Column('uuid', { nullable: true })
  branchId?: string

  @Column('integer')
  quantity: number

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number

  @Column('text', { nullable: true })
  sapCode?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Order, order => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order

  @ManyToOne(() => Product, product => product.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product

  @ManyToOne(() => CustomerBranch, branch => branch.orderItems, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch?: CustomerBranch

  @OneToMany(() => DeliveryItem, item => item.orderItem, { cascade: true })
  deliveryItems: DeliveryItem[]
}

registerEntity(OrderItem)
