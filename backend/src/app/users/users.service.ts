import { UserRepository } from '@/app/users/users.repository';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        private userRepository: UserRepository,
    ) { }

    async onModuleInit() {
        await this.initializeAdminUser();
    }

    private async initializeAdminUser() {
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
        
        // Check if admin user already exists
        const existingAdmin = await this.userRepository.findOneByUsername(adminUsername);
        
        if (!existingAdmin) {
            // Create admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            const adminUser = {
                username: adminUsername,
                password: hashedPassword,
                email: `${adminUsername}@system.local`,
                role: 'admin'
            };
            
            await this.userRepository.create(adminUser);
            console.log(`Admin user '${adminUsername}' created successfully`);
        } else {
            console.log(`Admin user '${adminUsername}' already exists`);
        }
    }
}