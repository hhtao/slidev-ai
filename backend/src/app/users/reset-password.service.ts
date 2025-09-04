import { Injectable } from '@nestjs/common';
import { ResetPasswordRepository } from './reset-password.repository';
import { UserRepository } from './users.repository';
import { ResetPassword } from './reset-password.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ResetPasswordService {
    constructor(
        private resetPasswordRepository: ResetPasswordRepository,
        private userRepository: UserRepository,
    ) { }

    async generateResetHash(userId: number): Promise<ResetPassword> {
        // First, delete any existing reset password records for this user
        const existingResetPasswords = await this.resetPasswordRepository.findByUserId(userId);
        if (existingResetPasswords.length > 0) {
            for (const resetPassword of existingResetPasswords) {
                await this.resetPasswordRepository.deleteById(resetPassword.id);
            }
        }

        // Generate new hash and create reset password record
        const hashId = uuidv4();
        const resetPassword = await this.resetPasswordRepository.create({
            hashId,
            userId
        });
        return resetPassword;
    }

    async validateResetHash(hashId: string): Promise<{ valid: boolean; userId?: number }> {
        const resetPassword = await this.resetPasswordRepository.findOneByHashId(hashId);
        
        if (!resetPassword) {
            return { valid: false };
        }

        // Check if the reset link is still valid (within 10 minutes)
        const createdAt = new Date(resetPassword.createdAt);
        const now = new Date();
        const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (diffInMinutes > 10) {
            // Expired, delete it
            await this.resetPasswordRepository.deleteByHashId(hashId);
            return { valid: false };
        }

        return { valid: true, userId: resetPassword.userId };
    }

    async resetPassword(hashId: string, newPassword: string): Promise<boolean> {
        const validation = await this.validateResetHash(hashId);
        
        if (!validation.valid || !validation.userId) {
            return false;
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user's password
        await this.userRepository.update(validation.userId, { password: hashedPassword });
        
        // Delete the reset password record
        await this.resetPasswordRepository.deleteByHashId(hashId);
        
        return true;
    }
}