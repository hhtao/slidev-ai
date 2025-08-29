import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { createHash } from 'crypto';
import { SLIDEV_MCP_ROOT } from '@/constant/filepath';
import { Slide } from '../slides/slide.entity';
import { Theme } from './theme.entity';
import { ThemeRepository } from './theme.repository';
import { SsoLite } from '@/utils';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SlidevMcpService implements OnModuleInit {
    private readonly logger = new Logger(SlidevMcpService.name);
    private readonly repoUrl = process.env.SLIDEV_MCP_REPO || 'https://github.com/LSTM-Kirigaya/slidev-mcp';
    private readonly repoPath = path.join(process.cwd(), process.env.SLIDEV_MCP_PATH || 'slidev-mcp');
    private readonly updateInterval = parseInt(process.env.SLIDEV_MCP_UPDATE_INTERVAL || '3600000', 10); // default 1 hour

    constructor(
        private readonly themeRepository: ThemeRepository,
        private readonly httpService: HttpService,
    ) { }

    async onModuleInit() {
        await this.ensureRepo();
        // 初始化主题数据
        await this.initializeThemes();
    }

    private async ensureRepo() {
        if (!existsSync(this.repoPath)) {
            this.logger.log(chalk.yellow(`Repository not found, cloning: ${this.repoUrl}`));
            if (this.gitClone()) {
                this.installDependencies();
                this.installHeadlessBrowser();
            }
        } else {
            this.logger.log(chalk.blue(`Repository already exists at ${this.repoPath}, trying to update dependencies...`));
            this.installDependencies();
        }
    }

    private gitClone(): boolean {
        try {
            execSync(`git clone ${this.repoUrl} ${this.repoPath}`, { stdio: 'inherit' });
            return true;
        } catch (error) {
            this.logger.error(chalk.red(`git clone failed: ${error.message}`));
            return false;
        }
    }

    private installDependencies() {
        try {
            this.logger.log(chalk.blue(`Installing dependencies: uv sync`));
            execSync(`uv sync`, { cwd: this.repoPath, stdio: 'inherit' });
            this.logger.log(chalk.green(`Dependencies installed successfully`));
        } catch (error) {
            this.logger.error(chalk.red(`uv sync failed: ${error.message}`));
        }
    }

    private installHeadlessBrowser() {
        try {
            this.logger.log(chalk.blue(`Installing headless browser: uv run playwright install`));
            execSync(`uv run playwright install`, { cwd: this.repoPath, stdio: 'inherit' });
            this.logger.log(chalk.green(`Dependencies installed successfully`));
        } catch (error) {
            this.logger.error(chalk.red(`uv sync failed: ${error.message}`));
        }
    }


    private updateRepo() {
        try {
            execSync(`git -C ${this.repoPath} pull`, { stdio: 'inherit' });
            this.logger.log(chalk.green(`Repository updated successfully`));
        } catch (error) {
            this.logger.error(chalk.red(`git pull failed: ${error.message}`));
        }
    }

    @Interval(parseInt(process.env.SLIDEV_MCP_UPDATE_INTERVAL || '3600000', 10))
    handleUpdate() {
        if (existsSync(this.repoPath)) {
            this.logger.log(chalk.blue(`Starting repository update...`));
            this.updateRepo();
            this.installDependencies();
        } else {
            this.logger.warn(chalk.yellow(`Repository not found, cloning again...`));
            if (this.gitClone()) {
                this.installDependencies();
            }
        }
    }

    /**
     * Initialize themes from the slidev-mcp repository
     */
    private async initializeThemes() {
        try {
            const themesPath = path.join(this.repoPath, 'servers', 'themes');
            if (!existsSync(themesPath)) {
                this.logger.warn(chalk.yellow(`Themes directory not found: ${themesPath}`));
                return;
            }

            const themeDirs = fs.readdirSync(themesPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const themeName of themeDirs) {
                await this.processTheme(themesPath, themeName);
            }

            this.logger.log(chalk.green(`Themes initialization completed`));
        } catch (error) {
            this.logger.error(chalk.red(`Theme initialization failed: ${error.message}`));
        }
    }

    /**
     * Process a single theme
     */
    private async processTheme(themesPath: string, themeName: string) {
        try {
            this.logger.log(chalk.cyan(`=== Processing theme: ${themeName} ===`));

            const themePath = path.join(themesPath, themeName);
            const manifestPath = path.join(themePath, 'manifest.json');

            if (!existsSync(manifestPath)) {
                this.logger.warn(chalk.yellow(`Manifest not found for theme: ${themeName}`));
                return;
            }

            this.logger.log(chalk.blue(`Reading manifest.json for ${themeName}...`));
            const manifestContent = readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);

            // 处理图片下载
            const imageMappings = await Promise.all(
                (manifest.images ?? []).map(async (imageUrl) => {
                    // 生成唯一文件名
                    const imageName = await this.generateImageName(imageUrl);

                    // 下载文件
                    const savePath = SsoLite.getPath('theme-examples', imageName);
                    if (!fs.existsSync(savePath)) {
                        await SsoLite.downloadFile(imageUrl, savePath, this.httpService);
                        this.logger.log(chalk.gray(`  ↳ downloaded: ${imageUrl}`));
                    } else {
                        this.logger.log(chalk.gray(`  ↳ cached: ${imageUrl}`));
                    }

                    // 返回映射
                    return { imageUrl, imageName };
                })
            );
            
            // 保存或更新主题信息到数据库
            this.logger.log(chalk.blue(`Saving theme ${themeName} into database...`));
            let theme = await this.themeRepository.findOneByName(themeName);

            if (!theme) {
                theme = new Theme();
                theme.name = themeName;
            }

            theme.github = manifest.github || null;
            theme.images = imageMappings;
            theme.installScripts = manifest.installScripts || [];

            await this.themeRepository.save(theme);

            // 执行安装脚本
            if (manifest.installScripts && Array.isArray(manifest.installScripts)) {
                this.logger.log(chalk.blue(`Executing install scripts for ${themeName}...`));
                this.executeInstallScripts(themePath, manifest.installScripts);
            }

            this.logger.log(chalk.green(`✓ Processed theme successfully: ${themeName}`));
        } catch (error) {
            this.logger.error(chalk.red(`✗ Failed to process theme ${themeName}: ${error.message}`));
        }
    }

    /**
     * Generate unique image name based on URL
     */
    private async generateImageName(imageUrl: string): Promise<string> {
        const hash = createHash('md5').update(imageUrl).digest('hex');
        const extension = await SsoLite.getImageExtension(imageUrl, this.httpService);
        return `${hash}${extension}`;
    }

    /**
     * Execute install scripts synchronously
     */
    private executeInstallScripts(themePath: string, scripts: string[]) {
        for (const script of scripts) {
            try {
                this.logger.log(chalk.blue(`Executing script: ${script}`));
                execSync(script, { cwd: themePath, stdio: 'inherit' });
                this.logger.log(chalk.green(`Script executed successfully: ${script}`));
            } catch (error) {
                this.logger.error(chalk.red(`Script execution failed: ${script} - ${error.message}`));
            }
        }
    }

    /**
     * Generate openmcp config file
     */
    generateOpenMcpConfig(slide: Slide): string {
        const apiKey = process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENAI_BASE_URL;
        const model = process.env.OPENAI_MODEL;

        if (!apiKey || !baseUrl || !model) {
            this.logger.error(
                chalk.red('Missing required environment variables: OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL')
            );
            process.exit(1);
        }

        const theme = slide.theme;

        if (!theme) {
            this.logger.error(chalk.red('Missing required environment variables: theme'));
        }

        const serverRoot = path.join(
            this.repoPath,
            'servers',
            'themes',
            theme
        );

        if (!fs.existsSync(serverRoot)) {
            throw new Error(
                `Theme ${theme} does not exist. Please check the theme name.`
            );
        }

        const serverName = 'slidev-mcp-' + theme;

        const config = {
            version: '0.0.1',
            namespace: 'openmcp',
            mcpServers: {
                'slidev-mcp-academic': {
                    type: 'stdio',
                    command: 'mcp',
                    args: ['run', 'server.py'],
                    cwd: serverRoot,
                    description: serverName,
                    env: {
                        SLIDEV_MCP_ROOT: SLIDEV_MCP_ROOT,
                    }
                }
            },
            defaultLLM: {
                baseURL: baseUrl,
                apiToken: apiKey,
                model: model
            }
        };

        const openMcpDir = path.join(process.cwd(), 'openmcp');
        if (!existsSync(openMcpDir)) {
            mkdirSync(openMcpDir, { recursive: true });
        }


        const configPath = path.join(openMcpDir, 'config.json');
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        this.logger.log(chalk.green(`openmcp config generated: ${configPath}`));

        return configPath;
    }
}
