// src/slidev/slidev-manager.service.ts
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as net from 'net';
import { spawn, ChildProcess } from 'child_process';



@Injectable()
export class SlidevManagerService implements OnApplicationShutdown {
    private instances = new Map<number, { port: number, process: ChildProcess }>();
    private usedPorts = new Set<number>();

    async startSlidev(id: number, filePath: string): Promise<number> {
        // 检查是否已存在实例
        const existing = this.instances.get(id);
        if (existing) return existing.port;

        // 获取可用端口
        const port = await this.findAvailablePort();
        const process = this.spawnSlidevProcess(filePath, port);

        // 存储实例信息
        const instance = { port, process };
        this.instances.set(id, instance);
        this.usedPorts.add(port);

        // 清理进程退出
        process.on('exit', () => {
            this.instances.delete(id);
            this.usedPorts.delete(port);
        });

        return port;
    }

    getSlidevPort(id: number): number | null {
        return this.instances.get(id)?.port || null;
    }

    private spawnSlidevProcess(filePath: string, port: number): ChildProcess {
        return spawn('slidev', [filePath, '--port', port.toString()], {
            detached: true,
            stdio: 'ignore',
        });
    }

    private async findAvailablePort(start = 3000): Promise<number> {
        for (let port = start; port < 65535; port++) {
            if (this.usedPorts.has(port)) continue;
            if (await this.isPortAvailable(port)) return port;
        }
        throw new Error('No available ports');
    }

    private isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close(() => resolve(true));
            });
            server.listen(port);
        });
    }

    onApplicationShutdown() {
        for (const instance of this.instances.values()) {
            instance.process.kill();
        }
    }
}