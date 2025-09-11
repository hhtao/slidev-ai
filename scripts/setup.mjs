#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import gradient from "gradient-string";
import boxen from "boxen";
import net from "net";
import path from 'path';
import fs from 'fs-extra';
import OpenAI from "openai";

// 项目信息展示框
const projectBox = boxen(
    [
        `     ${gradient.pastel.multiline("Slidev AI 安装器")}  v1.0.0`,
        `     项目地址  ${chalk.cyan("https://github.com/LSTM-Kirigaya/slidev-ai")} `,
        `     有问题请联系 kirigaya: ${chalk.cyan("zhelonghuang@qq.com")}`,
        `     QQ 群: 782833642`,
    ].join("\n"),
    {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
        align: "center",
    }
);

console.log(projectBox);

// 检查端口是否被占用
async function checkPort(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                reject(new Error(`端口 ${port} 已被占用`));
            } else {
                reject(err);
            }
        });

        server.once("listening", () => {
            server.close(() => resolve(true));
        });

        server.listen(port);
    });
}

// 验证 OpenAI API
async function validateOpenAI(apiKey, baseUrl, model) {
    const client = new OpenAI({
        apiKey,
        baseURL: baseUrl,
    });

    const resp = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: "hello world" }],
    });

    return resp.choices?.length > 0;
}

async function main() {
    const answers = await inquirer.prompt([
        {
            name: "OPENAI_BASE_URL",
            message: "🌐 请输入 OpenAI 接口地址:",
            default: process.env.OPENAI_BASE_URL || "https://api.deepseek.com",
            validate: (input) =>
                input.startsWith("http") ? true : "必须是合法的 URL",
        },
        {
            name: "OPENAI_API_KEY",
            message: "🔑 请输入 OpenAI API Key:",
            default: process.env.OPENAI_API_KEY || "sk-xxxxx",
            validate: (input) =>
                input.startsWith("sk-") ? true : "API Key 必须以 sk- 开头",
        },
        {
            name: "OPENAI_MODEL",
            message: "🤖 请选择要使用的模型:",
            default: process.env.OPENAI_MODEL || "deepseek-chat",
        },
        {
            name: "ADMIN_USERNAME",
            message: "👤 设置管理员用户名:",
            default: "admin",
        },
        {
            name: "ADMIN_PASSWORD",
            message: "🔒 设置管理员密码:",
            default: "admin",
            mask: "*",
        },
        {
            name: "PORT",
            message: "📡 请输入服务运行端口:",
            default: 3001,
            validate: async (input) => {
                const port = parseInt(input, 10);
                if (isNaN(port) || port <= 0 || port > 65535) {
                    return "请输入合法的端口号 (1-65535)";
                }
                try {
                    await checkPort(port);
                    return true;
                } catch (err) {
                    return err.message;
                }
            },
        },
        {
            name: "DOMAIN",
            message: "🌍 请输入域名:",
            default: "localhost",
        },
        {
            type: "confirm",
            name: "ENABLE_HTTPS",
            message: "🔐 是否启用 HTTPS?",
            default: false,
        },
    ]);

    console.log(chalk.yellow("\n正在验证 OpenAI API 配置..."));
    const ok = await validateOpenAI(
        answers.OPENAI_API_KEY,
        answers.OPENAI_BASE_URL,
        answers.OPENAI_MODEL
    );

    if (!ok) {
        console.log(chalk.red("❌ OpenAI API 验证失败，请检查 API_KEY / BASE_URL / MODEL"));
        process.exit(1);
    }

    console.log(chalk.green("✅ OpenAI API 验证成功！\n"));

    // ================================
    // 写入 backend/.env.production
    // ================================
    const backendEnv = [
        `JWT_SECRET=slidev-ai-jwt-secret-key`,
        `SLIDEV_MCP_REPO=https://github.com/LSTM-Kirigaya/slidev-mcp`,
        `SLIDEV_MCP_PATH=slidev-mcp`,
        `SLIDEV_MCP_UPDATE_INTERVAL=3600000`,
        `OPENAI_API_KEY=${answers.OPENAI_API_KEY}`,
        `OPENAI_BASE_URL=${answers.OPENAI_BASE_URL}`,
        `OPENAI_MODEL=${answers.OPENAI_MODEL}`,
        `ADMIN_USERNAME=${answers.ADMIN_USERNAME}`,
        `ADMIN_PASSWORD=${answers.ADMIN_PASSWORD}`,
        `PORT=${answers.PORT}`,
    ].join("\n");

    const backendPath = path.resolve("backend/.env.production");
    fs.writeFileSync(backendPath, backendEnv, "utf-8");

    // ================================
    // 写入 frontend/.env.production
    // ================================
    const frontendEnv = [
        `VITE_DOMAIN=${answers.DOMAIN}`,
        `VITE_PORT=${answers.PORT}`,
        `VITE_ENABLE_HTTPS=${answers.ENABLE_HTTPS}`,
    ].join("\n");

    const frontendPath = path.resolve("frontend/.env.production");
    fs.writeFileSync(frontendPath, frontendEnv, "utf-8");

    console.log(chalk.magenta("\n最终配置如下："));
    console.log(answers);

    console.log(chalk.green(`\n✅ 已生成配置文件：`));
    console.log(`- ${backendPath}`);
    console.log(`- ${frontendPath}`);


}

main().catch((err) => {
    console.error(chalk.red("安装失败："), err);
    process.exit(1);
});
