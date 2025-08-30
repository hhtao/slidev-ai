import { Controller, Get } from '@nestjs/common';
import { SlidevMcpService } from './slidev-mcp.service';
import { ThemeRepository } from './theme.repository';
import { Theme } from './theme.entity';

@Controller('mcp')
export class SlidevMcpController {
    constructor(
        private readonly slidevMcpService: SlidevMcpService,
        private readonly themeRepository: ThemeRepository,
    ) { }

    @Get('themes')
    async getThemes(): Promise<Theme[]> {
        const themes = await this.themeRepository.findAll();

        return themes;
    }
}