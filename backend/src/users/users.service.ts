import { SlideRepository } from '@/databases/repository/slide';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(SlideRepository)
        private slidesRepository: SlideRepository,
    ) { }

    
}