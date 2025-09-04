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
import { InvitationsController } from './invitations.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Invitation]),
        SlidesModule,
    ],
    providers: [UserRepository, UsersService, InvitationRepository, InvitationService],
    controllers: [UsersController, InvitationsController],
    exports: [UsersService, UserRepository, InvitationService, InvitationRepository],
})
export class UsersModule { }