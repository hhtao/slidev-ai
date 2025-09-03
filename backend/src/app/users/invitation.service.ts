import { Injectable } from '@nestjs/common';
import { Invitation } from './invitation.entity';
import { InvitationRepository } from './invitation.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationService {
    constructor(private invitationRepository: InvitationRepository) { }

    async create(code?: string): Promise<Invitation> {
        // 如果没有提供 code，则生成一个 UUID 作为邀请码
        const invitationCode = code || uuidv4();
        
        // 检查生成的 code 是否已存在
        const existingInvitation = await this.invitationRepository.findOneByCode(invitationCode);
        if (existingInvitation) {
            // 如果已存在，则递归调用重新生成
            return this.create();
        }

        return this.invitationRepository.create({ code: invitationCode });
    }

    async findAll(): Promise<Invitation[]> {
        return this.invitationRepository.findAll();
    }

    async findOneById(id: number): Promise<Invitation | null> {
        return this.invitationRepository.findOneById(id);
    }

    async findOneByCode(code: string): Promise<Invitation | null> {
        return this.invitationRepository.findOneByCode(code);
    }

    async update(id: number, updateData: Partial<Invitation>): Promise<Invitation | null> {
        return this.invitationRepository.update(id, updateData);
    }

    async delete(id: number): Promise<void> {
        return this.invitationRepository.delete(id);
    }

    async isValid(code: string): Promise<boolean> {
        const invitation = await this.invitationRepository.findOneByCode(code);
        return invitation !== null;
    }
}