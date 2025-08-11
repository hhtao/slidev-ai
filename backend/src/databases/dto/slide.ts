import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

    @Column()
    userId!: string;
}


export class CreateSlideDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    outline?: string;
}
