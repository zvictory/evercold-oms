import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { DeliveryChecklist } from './DeliveryChecklist'

@Entity('DeliveryPhoto')
export class DeliveryPhoto {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  checklistId: string

  @Column('text')
  photoUrl: string

  @Column('text', { nullable: true })
  caption?: string

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => DeliveryChecklist, checklist => checklist.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist: DeliveryChecklist
}

registerEntity(DeliveryPhoto)
