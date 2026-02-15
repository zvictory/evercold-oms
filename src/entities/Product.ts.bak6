import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'

// Forward declarations for entities that will be created later
export class OrderItem {
  product: any
}

export class CustomerProductPrice {
  product: any
}

@Entity('Product')
export class Product {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  sku?: string

  @Column('text', { nullable: true })
  barcode?: string

  @Column('text', { nullable: true })
  sapCode?: string

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number

  @Column('decimal', { precision: 5, scale: 2 })
  vatRate: number

  @Column('text', { nullable: true })
  category?: string

  @Column('text', { nullable: true })
  description?: string

  @Column('integer', { default: 0 })
  stock: number

  @Column('text', { nullable: true })
  unit?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => OrderItem, item => item.product, { cascade: true })
  orderItems: OrderItem[]

  @OneToMany(() => CustomerProductPrice, price => price.product, { cascade: true })
  customerPrices: CustomerProductPrice[]
}

registerEntity(Product)
