import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Delivery } from './Delivery'
import { DeliveryRoute } from './DeliveryRoute'

// Forward declaration for DriverSession (circular dependency)
export class DriverSession {
  driver: any
}

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

export enum DriverLocationStatus {
  IDLE = 'IDLE',
  IN_TRANSIT = 'IN_TRANSIT',
  ON_DELIVERY = 'ON_DELIVERY',
  BREAK = 'BREAK',
  OFFLINE = 'OFFLINE',
}

@Entity('Driver')
export class Driver {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { unique: true })
  phone: string

  @Column('text', { nullable: true })
  email?: string

  @Column('text', { unique: true })
  licenseNumber: string

  @Column('date', { nullable: true })
  licenseExpiry?: Date

  @Column('enum', { enum: DriverStatus, default: DriverStatus.ACTIVE })
  status: DriverStatus

  @Column('enum', { enum: DriverLocationStatus, default: DriverLocationStatus.OFFLINE })
  locationStatus: DriverLocationStatus

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLatitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLongitude?: number

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number

  @Column('integer', { default: 0 })
  totalDeliveries: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Delivery, delivery => delivery.driver, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => DriverSession, session => session.driver, { cascade: true })
  sessions: DriverSession[]

  @OneToMany(() => DeliveryRoute, route => route.driver, { cascade: true })
  routes: DeliveryRoute[]
}

registerEntity(Driver)
