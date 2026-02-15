import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Driver } from './Driver'

@Entity('DriverSession')
export class DriverSession {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  driverId: string

  @Column('timestamp')
  startTime: Date

  @Column('timestamp', { nullable: true })
  endTime?: Date

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  startLatitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  startLongitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  endLatitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  endLongitude?: number

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  distance?: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Driver, driver => driver.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: Driver
}

registerEntity(DriverSession)
