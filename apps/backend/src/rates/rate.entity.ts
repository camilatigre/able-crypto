import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('hourly_rates')
@Index(['symbol', 'hour'], { unique: true })
export class HourlyRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  symbol: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  averagePrice: number;

  @Column({ type: 'timestamp' })
  hour: Date;

  @CreateDateColumn()
  createdAt: Date;
}

