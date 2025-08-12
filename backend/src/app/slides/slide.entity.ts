import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Check, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
@Entity("slides")
export class Slide {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ default: 'pending' })
    processingStatus!: string;

    @Column()
    userId!: string;

    @Column()
    @Check(`"visibility" IN ('public', 'private')`)
    visibility: string;


    @ManyToOne(() => User, user => user.slides)
    @JoinColumn({ name: 'userId' })
    user: User;
}

