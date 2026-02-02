import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Delivery } from './Delivery'
import { DeliveryRoute } from './DeliveryRoute'

export enum VehicleType {
  ICE_TRUCK = 'ICE_TRUCK',
  VAN = 'VAN',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  OTHER = 'OTHER',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  RETIRED = 'RETIRED',
}

@Entity('Vehicle')
export class Vehicle {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  plateNumber: string

  @Column('text', { unique: true, nullable: true })
  vin?: string

  @Column('enum', { enum: VehicleType })
  type: VehicleType

  @Column('text')
  make: string

  @Column('text')
  model: string

  @Column('integer', { nullable: true })
  year?: number

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  capacity?: number

  @Column('enum', { enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status: VehicleStatus

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalDistance: number

  @Column('date', { nullable: true })
  maintenanceLastDate?: Date

  @Column('date', { nullable: true })
  insuranceExpiry?: Date

  @Column('date', { nullable: true })
  registrationExpiry?: Date

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Delivery, delivery => delivery.vehicle, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => DeliveryRoute, route => route.vehicle, { cascade: true })
  routes: DeliveryRoute[]
}

registerEntity(Vehicle)
