import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { DocumentStatus } from '../enums/document-status.enum';
import { User } from './user.entity';
import { IngestionProcess } from './ingestion-process.entity';

@Entity('documents')
@Index(['status'])
@Index(['uploadedBy'])
export class Document extends BaseEntity {
  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  filePath: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, (user) => user.documents, { eager: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: User;

  @OneToMany(() => IngestionProcess, (ingestion) => ingestion.document)
  ingestionProcesses: IngestionProcess[];
}
