import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import {SLIDEV_MCP_ROOT} from '@/constant/filepath';

@Injectable()
export class SlidevMcpService implements OnModuleInit {
    private readonly logger = new Logger(SlidevMcpService.name);
    private readonly repoUrl = process.env.SLIDEV_MCP_REPO || 'https://github.com/LSTM-Kirigaya/slidev-mcp';
    private readonly repoPath = path.join(process.cwd(), process.env.SLIDEV_MCP_PATH || 'slidev-mcp');
    private readonly updateInterval = parseInt(process.env.SLIDEV_MCP_UPDATE_INTERVAL || '3600000', 10); // default 1 hour

    async onModuleInit() {
        await this.ensureRepo();
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
     * Generate openmcp config file
     */
    generateOpenMcpConfig(): string {
        const apiKey = process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENAI_BASE_URL;
        const model = process.env.OPENAI_MODEL;

        if (!apiKey || !baseUrl || !model) {
            this.logger.error(
                chalk.red('Missing required environment variables: OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL')
            );
            process.exit(1);
        }

        const config = {
            version: '0.0.1',
            namespace: 'openmcp',
            mcpServers: {
                'slidev-mcp-academic': {
                    type: 'stdio',
                    command: 'mcp',
                    args: ['run', 'main.py'],
                    cwd: this.repoPath, // absolute path of cloned repo
                    description: 'slidev-mcp-academic',
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
