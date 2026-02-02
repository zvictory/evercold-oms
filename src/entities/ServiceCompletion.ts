import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { ServiceTicket } from './ServiceTicket'

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('ServiceCompletion')
export class ServiceCompletion {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  ticketId: string

  @Column('date')
  completionDate: Date

  @Column('text', { nullable: true })
  technicianNotes?: string

  @Column('enum', { enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus

  @Column('text', { nullable: true })
  approverNotes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => ServiceTicket, ticket => ticket.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: ServiceTicket
}

registerEntity(ServiceCompletion)
