import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'

// Forward declaration
export class EdoDocumentSync {
  integration: any
}

@Entity('EdoIntegration')
export class EdoIntegration {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  name: string

  @Column('text')
  apiKey: string

  @Column('text')
  apiSecret: string

  @Column('text', { nullable: true })
  organizationId?: string

  @Column('boolean', { default: true })
  isActive: boolean

  @Column('timestamp', { nullable: true })
  lastSyncDate?: Date

  @Column('text', { nullable: true })
  lastSyncStatus?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => EdoDocumentSync, sync => sync.integration, { cascade: true })
  documentSyncs: EdoDocumentSync[]
}

registerEntity(EdoIntegration)
