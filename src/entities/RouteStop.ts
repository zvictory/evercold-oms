import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { DeliveryRoute } from './DeliveryRoute'
import { Delivery } from './Delivery'

export enum RouteStopStatus {
  PENDING = 'PENDING',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Entity('RouteStop')
export class RouteStop {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  routeId: string

  @Column('uuid', { nullable: true })
  deliveryId?: string

  @Column('integer')
  stopNumber: number

  @Column('enum', { enum: RouteStopStatus, default: RouteStopStatus.PENDING })
  status: RouteStopStatus

  @Column('text', { nullable: true })
  address?: string

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude?: number

  @Column('time', { nullable: true })
  scheduledTime?: string

  @Column('time', { nullable: true })
  eta?: string

  @Column('time', { nullable: true })
  actualArrival?: string

  @Column('time', { nullable: true })
  actualDeparture?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => DeliveryRoute, route => route.routeStops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: DeliveryRoute

  @ManyToOne(() => Delivery, delivery => delivery.routeStops, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deliveryId' })
  delivery?: Delivery
}

registerEntity(RouteStop)
