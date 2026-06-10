import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('jobs')
export class Job {
  @ApiProperty({ description: 'Unique identifier of the job', example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({
    description: 'Source platform of the job',
    example: 'staff.am',
  })
  @Column()
  source!: string;

  @ApiProperty({ description: 'Company name', example: 'NextChallenge' })
  @Column()
  company!: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior Frontend Developer (React+Angular)',
  })
  @Column()
  title!: string;

  @ApiProperty({
    description: 'Job description',
    example: 'Deadline: 2026-06-26',
  })
  @Column('text')
  description!: string;

  @ApiProperty({
    description: 'Whether the user is applying to this job',
    example: false,
    default: false,
  })
  @Column({ default: false })
  isApplying!: boolean;

  @ApiProperty({
    description: 'Unique identifier from the source platform',
    example: '158410',
  })
  @Column({ unique: true })
  sourceId!: string;

  @ApiProperty({
    description: 'Date when the job was created',
    example: '2026-06-10T12:00:00Z',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    description: 'Date when the job was last updated',
    example: '2026-06-10T12:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt!: Date;
}
