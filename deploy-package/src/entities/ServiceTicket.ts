import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { CustomerBranch } from './CustomerBranch'
import { Technician } from './Technician'
import { IssueCategory } from './IssueCategory'
import { IssueSubcategory } from './IssueSubcategory'

// Forward declaration
export class ServiceCompletion {
  ticket: any
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('ServiceTicket')
export class ServiceTicket {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  ticketNumber: string

  @Column('uuid')
  branchId: string

  @Column('uuid', { nullable: true })
  technicianId?: string

  @Column('uuid')
  categoryId: string

  @Column('uuid', { nullable: true })
  subcategoryId?: string

  @Column('enum', { enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus

  @Column('enum', { enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority

  @Column('text')
  description: string

  @Column('text', { nullable: true })
  resolution?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column('timestamp', { nullable: true })
  resolvedAt?: Date

  @ManyToOne(() => CustomerBranch, branch => branch.serviceTickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: CustomerBranch

  @ManyToOne(() => Technician, technician => technician.serviceTickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'technicianId' })
  technician?: Technician

  @ManyToOne(() => IssueCategory, category => category.serviceTickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: IssueCategory

  @ManyToOne(() => IssueSubcategory, subcategory => subcategory.serviceTickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory?: IssueSubcategory

  @OneToMany(() => ServiceCompletion, completion => completion.ticket, { cascade: true })
  completions: ServiceCompletion[]
}

registerEntity(ServiceTicket)
