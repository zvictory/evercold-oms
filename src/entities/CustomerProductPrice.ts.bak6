import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Customer } from './Customer'
import { Product } from './Product'

@Entity('CustomerProductPrice')
export class CustomerProductPrice {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('uuid')
  productId: string

  @Column('decimal', { precision: 12, scale: 2 })
  customPrice: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @ManyToOne(() => Product, product => product.customerPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product
}

registerEntity(CustomerProductPrice)
