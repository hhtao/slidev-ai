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
import { ResetPassword } from './reset-password.entity';
import { ResetPasswordRepository } from './reset-password.repository';
import { ResetPasswordService } from './reset-password.service';
import { ResetPasswordController } from './reset-password.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Invitation, ResetPassword]),
        SlidesModule,
    ],
    providers: [
        UserRepository, 
        UsersService, 
        InvitationRepository, 
        InvitationService,
        ResetPasswordRepository,
        ResetPasswordService
    ],
    controllers: [UsersController, InvitationsController, ResetPasswordController],
    exports: [
        UsersService, 
        UserRepository, 
        InvitationService, 
        InvitationRepository,
        ResetPasswordService,
        ResetPasswordRepository
    ],
})
export class UsersModule { }