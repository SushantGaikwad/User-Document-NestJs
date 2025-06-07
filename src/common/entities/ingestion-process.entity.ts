import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Document } from './document.entity';
import { IngestionStatus } from '../enums/ingestion-status.enum';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('ingestion_processes')
@Index(['status'])
@Index(['triggeredBy'])
export class IngestionProcess extends BaseEntity {
  @ManyToOne(() => Document, (document) => document.ingestionProcesses)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column()
  documentId: string;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.QUEUED,
  })
  status: IngestionStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggeredBy' })
  triggeredBy: User;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  processingResult: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;
}
