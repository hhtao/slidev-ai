import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesModule } from '@/app/slides/slides.module';
import { Invitation } from './invitation.entity';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Invitation]),
        SlidesModule,
    ],
    providers: [UserRepository, UsersService, InvitationRepository, InvitationService],
    controllers: [UsersController],
    exports: [UsersService, UserRepository, InvitationService, InvitationRepository],
})
export class UsersModule { }