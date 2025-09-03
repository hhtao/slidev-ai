import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Check, ManyToOne, JoinColumn, OneToOne, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';



@Entity("slides")
export class Slide {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date;

    @Column()
    title: string = '';

    @Column({ type: 'text' })
    content!: string;

    @Column({ default: 'pending' })
    processingStatus!: string;

    @Column()
    @Check(`"visibility" IN ('public', 'private')`)
    visibility: string = 'public';

    @Column({ type: 'text', nullable: true })
    outlines: string = '';

    /**
     * @description slidev-mcp 对于当前项目生成的项目名称
     * @example "2024-ai-agent-slides"
     */
    @Column({ type: 'text', nullable: true })
    slidevName: string = '';

    /**
     * @description 生成的 slidev 的文件夹，大纲和生成的 markdown 都在这里
     * @example ".slidev-mcp/2024-ai-agent-slides"
     */
    @Column({ type: 'text', nullable: true })
    slidevHome: string = '';
    
    /**
     * @description 封面图片在 sso-lite 中的名字
     * @example "sso-lite.cf5878c3-9b41-4cf2-a3a8-678c07f549da.png"
     */
    @Column({ type: 'text', nullable: true })
    coverFilename: string = '';

    /**
     * @description 主题
     * @example "academic"
     */
    @Column({ type: 'text', nullable: true })
    theme: string = '';

    /**
     * @description 创建者 ID
     */
    @Column()
    userId!: string;

    /**
     * @description 关联到的用户
     */
    @ManyToOne(() => User, user => user.slides)
    @JoinColumn({ name: 'userId' })
    user: User = {} as User;
}