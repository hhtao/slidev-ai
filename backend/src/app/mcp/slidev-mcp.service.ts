import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';

@Injectable()
export class SlidevMcpService implements OnModuleInit {
    private readonly logger = new Logger(SlidevMcpService.name);
    private readonly repoUrl = process.env.SLIDEV_MCP_REPO || 'https://github.com/LSTM-Kirigaya/slidev-mcp';
    private readonly repoPath = path.join(process.cwd(), process.env.SLIDEV_MCP_PATH || 'slidev-mcp');
    private readonly updateInterval = parseInt(process.env.SLIDEV_MCP_UPDATE_INTERVAL || '3600000', 10); // 默认 1 小时

    async onModuleInit() {
        await this.ensureRepo();
    }

    private async ensureRepo() {
        if (!existsSync(this.repoPath)) {
            this.logger.log(`项目不存在，正在 clone: ${this.repoUrl}`);
            if (this.gitClone()) {
                this.installDependencies();
            }
        } else {
            this.logger.log(`检测到已存在 ${this.repoPath}，尝试更新依赖`);
            this.installDependencies();
        }
    }

    private gitClone(): boolean {
        try {
            execSync(`git clone ${this.repoUrl} ${this.repoPath}`, { stdio: 'inherit' });
            return true;
        } catch (error) {
            this.logger.error(`git clone 失败: ${error.message}`);
            return false;
        }
    }

    private installDependencies() {
        try {
            this.logger.log(`安装依赖: uv sync`);
            execSync(`uv sync`, { cwd: this.repoPath, stdio: 'inherit' });
            this.logger.log(`依赖安装完成`);
        } catch (error) {
            this.logger.error(`uv sync 失败: ${error.message}`);
        }
    }

    private updateRepo() {
        try {
            execSync(`git -C ${this.repoPath} pull`, { stdio: 'inherit' });
            this.logger.log(`代码更新完成`);
        } catch (error) {
            this.logger.error(`git pull 失败: ${error.message}`);
        }
    }

    @Interval(parseInt(process.env.SLIDEV_MCP_UPDATE_INTERVAL || '3600000', 10))
    handleUpdate() {
        if (existsSync(this.repoPath)) {
            this.logger.log(`开始更新项目`);
            this.updateRepo();
            this.installDependencies();
        } else {
            this.logger.warn(`仓库不存在，重新 clone`);
            if (this.gitClone()) {
                this.installDependencies();
            }
        }
    }

    /**
     * 生成 openmcp 配置文件
     */
    generateOpenMcpConfig(): string {
        // 检查必要的环境变量
        const apiKey = process.env.OPENAI_API_KEY;
        const baseUrl = process.env.OPENAI_BASE_URL;
        const model = process.env.OPENAI_MODEL;

        if (!apiKey || !baseUrl || !model) {
            this.logger.error('缺少必要的环境变量: OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL');
            process.exit(1);
        }

        // 生成配置对象
        const config = {
            version: '0.0.1',
            namespace: 'openmcp',
            mcpServers: {
                'slidev-mcp-academic': {
                    type: 'stdio',
                    command: 'mcp',
                    args: ['run', 'main.py'],
                    cwd: this.repoPath, // clone 下来的绝对路径
                    description: 'slidev-mcp-academic'
                }
            },
            defaultLLM: {
                baseURL: baseUrl,
                apiToken: apiKey,
                model: model
            }
        };

        // 确保 openmcp 目录存在
        const openMcpDir = path.join(process.cwd(), 'openmcp');
        if (!existsSync(openMcpDir)) {
            mkdirSync(openMcpDir, { recursive: true });
        }

        // 保存 JSON 文件
        const configPath = path.join(openMcpDir, 'config.json');
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        this.logger.log(`openmcp 配置已生成: ${configPath}`);

        return configPath;
    }
}
