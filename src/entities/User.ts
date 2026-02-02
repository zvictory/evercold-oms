import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { CustomerBranch } from './CustomerBranch'

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
  TECHNICIAN = 'TECHNICIAN',
  CUSTOMER = 'CUSTOMER',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
}

@Entity('User')
export class User {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  email: string

  @Column('text')
  passwordHash: string

  @Column('text')
  firstName: string

  @Column('text')
  lastName: string

  @Column('text', { nullable: true })
  phone?: string

  @Column('enum', { enum: UserRole })
  role: UserRole

  @Column('uuid', { nullable: true })
  branchId?: string

  @Column('boolean', { default: true })
  isActive: boolean

  @Column('timestamp', { nullable: true })
  lastLogin?: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => CustomerBranch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch?: CustomerBranch
}

registerEntity(User)
