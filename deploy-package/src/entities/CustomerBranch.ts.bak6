import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Customer } from './Customer'

// Forward declarations for entities that will be created in later tasks
export class TechnicianBranchAssignment {
  branch: any
}

export class ServiceTicket {
  branch: any
}

export class OrderItem {
  branch: any
}

@Entity('CustomerBranch')
export class CustomerBranch {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('text')
  branchCode: string

  @Column('text')
  branchName: string

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('text', { nullable: true })
  coordinates?: string

  @Column('text', { nullable: true })
  oldBranchCode?: string

  @Column('boolean', { default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, customer => customer.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @OneToMany(() => TechnicianBranchAssignment, assignment => assignment.branch, { cascade: true })
  technicianAssignments: TechnicianBranchAssignment[]

  @OneToMany(() => ServiceTicket, ticket => ticket.branch, { cascade: true })
  serviceTickets: ServiceTicket[]

  @OneToMany(() => OrderItem, item => item.branch, { cascade: true })
  orderItems: OrderItem[]
}

registerEntity(CustomerBranch)
