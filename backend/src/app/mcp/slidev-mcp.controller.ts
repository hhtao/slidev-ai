import { Controller, Get } from '@nestjs/common';
import { SlidevMcpService } from './slidev-mcp.service';
import { readdirSync, existsSync } from 'fs';
import * as path from 'path';

@Controller('mcp')
export class SlidevMcpController {
    constructor(private readonly slidevMcpService: SlidevMcpService) { }

    @Get('themes')
    getThemes(): string[] {
        // 根据要求，从 backend/slidev-mcp/servers/themes 目录下获取所有主题
        const themesPath = path.join(process.cwd(), 'slidev-mcp', 'servers', 'themes');

        if (!existsSync(themesPath)) {
            return [];
        }

        const themes = readdirSync(themesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        return themes;
    }
}