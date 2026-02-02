import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Order } from './Order'

// Forward declarations for entities that will be created in later tasks
export class Driver {
  deliveries: any
}

export class Vehicle {
  deliveries: any
}

export class DeliveryRoute {
  deliveries: any
}

export class DeliveryChecklist {
  delivery: any
}

export class DeliveryItem {
  delivery: any
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('Delivery')
export class Delivery {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  orderId: string

  @Column('uuid', { nullable: true })
  driverId?: string

  @Column('uuid', { nullable: true })
  vehicleId?: string

  @Column('uuid', { nullable: true })
  routeId?: string

  @Column('enum', { enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus

  @Column('date')
  scheduledDate: Date

  @Column('time', { nullable: true })
  scheduledTime?: string

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalDelivered?: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Order, order => order.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order

  @ManyToOne(() => Driver, driver => driver.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver

  @ManyToOne(() => Vehicle, vehicle => vehicle.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle

  @ManyToOne(() => DeliveryRoute, route => route.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'routeId' })
  route?: DeliveryRoute

  @OneToMany(() => DeliveryChecklist, checklist => checklist.delivery, { cascade: true })
  checklists: DeliveryChecklist[]

  @OneToMany(() => DeliveryItem, item => item.delivery, { cascade: true })
  deliveryItems: DeliveryItem[]
}

registerEntity(Delivery)
