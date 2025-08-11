import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SlideRepository } from '@/databases/slide';

@Injectable()
export class UsersService {
    constructor(
        private slidesRepository: SlideRepository,
    ) { }

    
}