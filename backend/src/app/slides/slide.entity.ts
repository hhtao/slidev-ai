import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Check, ManyToOne, JoinColumn, OneToOne, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';

@Entity("slidev_projects")
export class SlidevProject {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * @example "test2"
     */
    @Column()
    name: string;

    /**
     * @example ".slidev-mcp/test2"
     */
    @Column()
    home: string;

    /**
     * @example ".slidev-mcp/test2/slides.md"
     */
    @Column()
    slides_path: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

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

    @Column({ type: 'text', nullable: true })
    outlines: string;

    @OneToOne(() => SlidevProject, { nullable: true, cascade: true })
    @JoinTable()
    project?: SlidevProject;

    @ManyToOne(() => User, user => user.slides)
    @JoinColumn({ name: 'userId' })
    user: User;
}