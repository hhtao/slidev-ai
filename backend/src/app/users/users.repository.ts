import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(user: Partial<User>): Promise<User> {
        return this.userRepository.save(user);
    }

    async findAll(skip: number = 0, take: number = 15): Promise<[User[], number]> {
        return this.userRepository.findAndCount({
            skip,
            take
        });
    }

    async findOneById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findOneByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findByRole(role: string): Promise<User[]> {
        return this.userRepository.find({ where: { role } });
    }

    async update(id: number, update: Partial<User>) {
        await this.userRepository.update(id, update);
        return this.findOneById(id);
    }

    async remove(id: number): Promise<void> {
        await this.userRepository.delete(id);
    }
}