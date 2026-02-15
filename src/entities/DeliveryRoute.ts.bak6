import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Delivery } from './Delivery'

// Forward declarations for entities that will be created in later tasks
export class Driver {
  routes: any
}

export class Vehicle {
  routes: any
}

export class RouteStop {
  route: any
}

@Entity('DeliveryRoute')
export class DeliveryRoute {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid', { nullable: true })
  driverId?: string

  @Column('uuid', { nullable: true })
  vehicleId?: string

  @Column('text')
  routeName: string

  @Column('date')
  routeDate: Date

  @Column('integer')
  stops: number

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalDistance: number

  @Column('text', { nullable: true })
  optimizationMethod?: string

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Driver, driver => driver.routes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver

  @ManyToOne(() => Vehicle, vehicle => vehicle.routes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle

  @OneToMany(() => Delivery, delivery => delivery.route, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => RouteStop, stop => stop.route, { cascade: true })
  routeStops: RouteStop[]
}

registerEntity(DeliveryRoute)
