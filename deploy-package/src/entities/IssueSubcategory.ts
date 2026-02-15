import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { IssueCategory } from './IssueCategory'

// Forward declaration
export class ServiceTicket {
  subcategory: any
}

@Entity('IssueSubcategory')
export class IssueSubcategory {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  categoryId: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  description?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => IssueCategory, category => category.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: IssueCategory

  @OneToMany(() => ServiceTicket, ticket => ticket.subcategory, { cascade: true })
  serviceTickets: ServiceTicket[]
}

registerEntity(IssueSubcategory)
