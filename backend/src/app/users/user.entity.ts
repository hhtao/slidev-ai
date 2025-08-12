import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,OneToMany,Check } from 'typeorm';
import { Slide } from '../slides/slide.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @OneToMany(() => Slide, slide => slide.user)
    slides: Slide[];

    @Column({default:'user'})
    @Check(`"role" IN ('admin', 'user')`)
    role: string;


}
