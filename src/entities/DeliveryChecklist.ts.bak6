import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Delivery } from './Delivery'

// Forward declaration for entity that will be created in Task 4
export class DeliveryPhoto {
  checklist: any
}

@Entity('DeliveryChecklist')
export class DeliveryChecklist {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  deliveryId: string

  @Column('boolean', { default: false })
  itemsVerified: boolean

  @Column('boolean', { default: false })
  photosCollected: boolean

  @Column('boolean', { default: false })
  signatureCollected: boolean

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Delivery, delivery => delivery.checklists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery

  @OneToMany(() => DeliveryPhoto, photo => photo.checklist, { cascade: true })
  photos: DeliveryPhoto[]
}

registerEntity(DeliveryChecklist)
