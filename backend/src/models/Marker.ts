import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('markers')
export class Marker {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ default: false })
  isFavorite!: boolean;

  @Column({ nullable: true })
  visitedAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  user_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
} 