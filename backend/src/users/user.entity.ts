import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Slide } from '../slides/slide.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @OneToMany(() => Slide, slide => slide.user)
    slides!: Slide[];
}