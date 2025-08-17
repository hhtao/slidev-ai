import {
    CanActivate,
    ExecutionContext,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from '@/app/slides/slide.entity';

@Injectable()
export class PrivateSlideOwnerGuard implements CanActivate {
    constructor(
        @InjectRepository(Slide)
        private readonly slideRepository: Repository<Slide>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const slideId = Number(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new UnauthorizedException('用户未登录');
        }

        const slide = await this.slideRepository.findOne({ where: { id: slideId } });
        if (!slide) {
            throw new NotFoundException('幻灯片不存在');
        }
        if (slide.userId !== userId) {
            throw new UnauthorizedException('无权操作该幻灯片');
        }

        // 挂到 request，后续 controller 可以直接用
        req.slide = slide;
        return true;
    }
}


@Injectable()
export class PublicSlideOwnerGuard implements CanActivate {
    constructor(
        @InjectRepository(Slide)
        private readonly slideRepository: Repository<Slide>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const slideId = Number(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new UnauthorizedException('用户未登录');
        }

        const slide = await this.slideRepository.findOne({ where: { id: slideId } });
        if (!slide) {
            throw new NotFoundException('幻灯片不存在');
        }

        if (slide.userId !== userId && slide.visibility !== 'public') {
            throw new Error('无权查看该幻灯片');
        }

        // 挂到 request，后续 controller 可以直接用
        req.slide = slide;
        return true;
    }
}
