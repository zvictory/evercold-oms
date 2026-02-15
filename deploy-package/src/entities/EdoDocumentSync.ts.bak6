import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { EdoIntegration } from './EdoIntegration'
import { Order } from './Order'

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

@Entity('EdoDocumentSync')
export class EdoDocumentSync {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  integrationId: string

  @Column('uuid')
  orderId: string

  @Column('text')
  documentNumber: string

  @Column('enum', { enum: SyncStatus, default: SyncStatus.PENDING })
  status: SyncStatus

  @Column('integer', { default: 0 })
  syncAttempts: number

  @Column('text', { nullable: true })
  lastError?: string

  @Column('text', { nullable: true })
  externalDocumentId?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => EdoIntegration, integration => integration.documentSyncs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integrationId' })
  integration: EdoIntegration

  @ManyToOne(() => Order, order => order.edoSync, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order
}

registerEntity(EdoDocumentSync)
