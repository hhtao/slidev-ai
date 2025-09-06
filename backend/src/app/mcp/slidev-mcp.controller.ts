import { Controller, Get, Post, Param, Sse, UseGuards, Request } from '@nestjs/common';
import { SlidevMcpService } from './slidev-mcp.service';
import { ThemeRepository } from './theme.repository';
import { Theme } from './theme.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Observable } from 'rxjs';

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

    // 更新所有主题
    @UseGuards(JwtAuthGuard)
    @Sse('themes/update-all')
    updateAllThemes(@Request() req: Request): Observable<any> {
        const user = (req as any).user;
        if (user.role !== 'admin') {
            throw new Error('Unauthorized');
        }
        return new Observable(subscriber => {
            this.slidevMcpService.updateAllThemesHandler(subscriber);
        });
    }

    // 更新单个主题
    @UseGuards(JwtAuthGuard)
    @Sse('themes/:id/update')
    updateTheme(@Param('id') id: number, @Request() req: Request): Observable<any> {
        const user = (req as any).user;
        if (user.role !== 'admin') {
            throw new Error('Unauthorized');
        }
        return new Observable(subscriber => {
            this.slidevMcpService.updateThemeHandler(id, subscriber);
        });
    }
}