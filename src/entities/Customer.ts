import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { CustomerBranch } from './CustomerBranch'
import { Order } from './Order'

@Entity('Customer')
export class Customer {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  customerCode: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  email?: string

  @Column('text', { nullable: true })
  phone?: string

  @Column('text', { nullable: true })
  contactPerson?: string

  @Column('text', { nullable: true })
  contractNumber?: string

  @Column('text', { nullable: true })
  legalAddress?: string

  @Column('text', { nullable: true })
  organizationType?: string

  @Column('text', { nullable: true })
  innumber?: string

  @Column('text', { nullable: true })
  accountManager?: string

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  creditLimit?: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentDebt: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => CustomerBranch, branch => branch.customer, { cascade: true })
  branches: CustomerBranch[]

  @OneToMany(() => Order, order => order.customer, { cascade: true })
  orders: Order[]
}

registerEntity(Customer)
