import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.dto';

@Entity()
export class Slide {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ unique: true })
    uid!: string;

    @Column({ default: 'pending' })
    processingStatus!: string;

    @ManyToOne(() => User, user => user.slides, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: string;
}