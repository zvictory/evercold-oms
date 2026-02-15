import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { registerEntity } from '@/lib/database'
import { Technician } from './Technician'
import { CustomerBranch } from './CustomerBranch'

@Entity('TechnicianBranchAssignment')
export class TechnicianBranchAssignment {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  technicianId: string

  @Column('uuid')
  branchId: string

  @Column('date')
  assignmentDate: Date

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Technician, technician => technician.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'technicianId' })
  technician: Technician

  @ManyToOne(() => CustomerBranch, branch => branch.technicianAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: CustomerBranch
}

registerEntity(TechnicianBranchAssignment)
