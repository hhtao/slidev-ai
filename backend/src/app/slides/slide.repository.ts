import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from './slide.entity';

@Injectable()
export class SlideRepository {
    constructor(
        @InjectRepository(Slide)
        private readonly slideRepository: Repository<Slide>,
    ) {}

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

    async findAllByUserId(userId: string): Promise<Slide[]> {
        return this.slideRepository.find({ where: { userId } });
    }

    async update(uid: string, update: Partial<Slide>): Promise<Slide> {
        await this.slideRepository.update(uid, update);
        const updated = await this.findOneByUid(uid);
        if (!updated) throw new NotFoundException('Slide not found');
        return updated;
    }

    async getPublicSlides(skip: number, take: number): Promise<[Slide[], number]> {
            return this.slideRepository
                .createQueryBuilder('slide')
                .leftJoinAndSelect('slide.user', 'user')
                .select([
                    'slide.id',
                    'slide.title',
                    'slide.uid',
                    'slide.createdAt',
                    'user.username'
                ])
                .skip(skip)
                .take(take)
                .getManyAndCount();
        }
    

    async remove(id: string): Promise<void> {
        await this.slideRepository.delete(id);
    }
}
