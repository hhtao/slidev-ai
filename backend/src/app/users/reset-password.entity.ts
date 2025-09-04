import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('reset_password')
export class ResetPassword {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    hashId: string;

    @Column({ name: 'user_id' })
    userId: number;

    @CreateDateColumn()
    createdAt: Date = new Date();
}