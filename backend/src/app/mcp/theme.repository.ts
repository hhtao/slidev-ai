import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theme } from './theme.entity';

@Injectable()
export class ThemeRepository {
    constructor(
        @InjectRepository(Theme)
        private readonly themeRepository: Repository<Theme>,
    ) { }

    async create(theme: Partial<Theme>): Promise<Theme> {
        return this.themeRepository.save(
            this.themeRepository.create(theme)
        );
    }

    async findAll(): Promise<Theme[]> {
        return this.themeRepository.find();
    }

    async findOneById(id: number): Promise<Theme | null> {
        return this.themeRepository.findOne({ where: { id } });
    }

    async findOneByName(name: string): Promise<Theme | null> {
        return this.themeRepository.findOne({ where: { name } });
    }

    async update(id: number, update: Partial<Theme>): Promise<Theme> {
        await this.themeRepository.update(id, update);
        const updated = await this.findOneById(id);
        if (!updated) throw new Error('Theme not found');
        return updated;
    }

    async save(theme: Theme): Promise<Theme> {
        return this.themeRepository.save(theme);
    }

    async remove(id: number): Promise<void> {
        await this.themeRepository.delete(id);
    }
}