import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Theme extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column({ unique: true })
    name: string = '';

    @Column({ nullable: true })
    github: string = '';

    @Column({ type: 'json', nullable: true })
    images: Array<{ imageUrl: string; imageName: string }> = [];

    @Column({ type: 'json', nullable: true })
    installScripts: string[] = [];
    
    @Column({ type: 'boolean', default: false })
    installed: boolean = false;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();
}