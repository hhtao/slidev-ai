import { SlideRepository } from '@/app/slides/slide.repository';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
    constructor(
        private slidesRepository: SlideRepository,
    ) { }

    
}