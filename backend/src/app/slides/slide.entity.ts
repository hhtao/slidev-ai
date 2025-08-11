import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,Check } from 'typeorm';

@Entity("slides")
export class Slide {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ unique: true })
    uid: string;

    @Column({ default: 'pending' })
    processingStatus!: string;

    @Column()
    userId!: string;

    @Column()
    @Check(`"visibility" IN ('public', 'private')`)
    visibility: string;
}

