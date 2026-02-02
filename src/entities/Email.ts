import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'

@Entity('Email')
export class Email {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  email: string

  @Column('text')
  gmailMessageId: string

  @Column('text', { nullable: true })
  subject?: string

  @Column('text', { nullable: true })
  from?: string

  @CreateDateColumn()
  createdAt: Date
}

registerEntity(Email)
