import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'varchar', length: 150 })
  company: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'varchar' })
  startDate: string;

  @Column({ type: 'varchar', nullable: true })
  endDate?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', array: true, default: [] })
  photos: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
