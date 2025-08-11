import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from './slide.dto';

@Injectable()
export class SlideService {
    constructor(
        @InjectRepository(Slide)
        private readonly slideRepository: Repository<Slide>,
    ) {}

    async create(slide: Partial<Slide>): Promise<Slide> {
        return this.slideRepository.save(slide);
    }

    async findAll(): Promise<Slide[]> {
        return this.slideRepository.find();
    }

    async findOneById(id: string): Promise<Slide | null> {
        return this.slideRepository.findOne({ where: { id } });
    }

    async update(id: string, update: Partial<Slide>): Promise<Slide> {
        await this.slideRepository.update(id, update);
        const updated = await this.findOneById(id);
        if (!updated) throw new NotFoundException('Slide not found');
        return updated;
    }

    async remove(id: string): Promise<void> {
        await this.slideRepository.delete(id);
    }
}
