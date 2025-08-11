import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from './slide.entity';

@Injectable()
export class SlideRepository {
    constructor(
        @InjectRepository(Slide)
        private readonly slideRepository: Repository<Slide>,
    ) { }

    async create(slide: Partial<Slide>): Promise<Slide> {
        return this.slideRepository.save(
            this.slideRepository.create(slide)
        );
    }

    async findAll(): Promise<Slide[]> {
        return this.slideRepository.find();
    }

    async findOneByUid(uid: string): Promise<Slide | null> {
        return this.slideRepository.findOne({ where: { uid } });
    }

    /**
     * 查询某用户的幻灯片，可选 visibility: 'public' | 'private' | 'all'
     */
    async findByUserId(userId: string, visibility: 'public' | 'private' | 'all' = 'all'): Promise<Slide[]> {
        if (visibility === 'all') {
            return this.slideRepository.find({ where: { userId } });
        }
        return this.slideRepository.find({ where: { userId, visibility } });
    }

    async update(uid: string, update: Partial<Slide>): Promise<Slide> {
        await this.slideRepository.update(uid, update);
        const updated = await this.findOneByUid(uid);
        if (!updated) throw new NotFoundException('Slide not found');
        return updated;
    }

    /**
     * 查询公开幻灯片
     */
    async getPublicSlides(userId: string | null, skip: number, take: number): Promise<[Slide[], number]> {
        const qb = this.slideRepository
            .createQueryBuilder('slide')
            .where('slide.visibility = :visibility', { visibility: 'public' })
            .leftJoinAndSelect('slide.user', 'user')
            .select([
                'slide.id',
                'slide.title',
                'slide.uid',
                'slide.createdAt',
                'user.username'
            ])
            .skip(skip)
            .take(take);

        if (userId) {
            qb.andWhere('slide.userId = :userId', { userId });
        }

        return qb.getManyAndCount();
    }


    async remove(id: string): Promise<void> {
        await this.slideRepository.delete(id);
    }
}
