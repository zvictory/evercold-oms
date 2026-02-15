import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'

// Forward declarations for entities that will be created in this task
export class IssueSubcategory {
  category: any
}

export class ServiceTicket {
  category: any
}

@Entity('IssueCategory')
export class IssueCategory {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  name: string

  @Column('text', { nullable: true })
  description?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => IssueSubcategory, subcategory => subcategory.category, { cascade: true })
  subcategories: IssueSubcategory[]

  @OneToMany(() => ServiceTicket, ticket => ticket.category, { cascade: true })
  serviceTickets: ServiceTicket[]
}

registerEntity(IssueCategory)
