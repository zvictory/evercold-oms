import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'

// Forward declarations for entities that will be created in this task
export class TechnicianBranchAssignment {
  technician: any
}

export class ServiceTicket {
  technician: any
}

export enum TechnicianStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('Technician')
export class Technician {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { unique: true })
  phone: string

  @Column('text', { nullable: true })
  email?: string

  @Column('text', { nullable: true })
  specialization?: string

  @Column('enum', { enum: TechnicianStatus, default: TechnicianStatus.ACTIVE })
  status: TechnicianStatus

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number

  @Column('integer', { default: 0 })
  totalTickets: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => TechnicianBranchAssignment, assignment => assignment.technician, { cascade: true })
  assignments: TechnicianBranchAssignment[]

  @OneToMany(() => ServiceTicket, ticket => ticket.technician, { cascade: true })
  serviceTickets: ServiceTicket[]
}

registerEntity(Technician)
