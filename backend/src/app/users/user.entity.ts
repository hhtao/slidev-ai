import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Check } from 'typeorm';
import { Slide } from '../slides/slide.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @Column({ unique: true })
    username: string = '';

    @Column({ unique: true })
    email: string = '';

    @Column()
    password: string = '';

    // 头像文件相对路径 (例如 /uploads/avatar-xxx.png)
    @Column({ nullable: true })
    avatar?: string;

    @OneToMany(() => Slide, slide => slide.user)
    slides: Slide[] = [];

    @Column({ default: 'user' })
    @Check(`"role" IN ('admin', 'user')`)
    role: string = 'user';

    @Column({ nullable: true })
    website?: string;

    @Column({ nullable: true })
    egoId?: number;
}
