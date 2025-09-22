#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const colors = require('chalk');

/**
 * 知识库模块自动修复脚本
 * 自动修复知识库模块丢失问题
 */

const APP_MODULE_PATH = path.join(__dirname, '../backend/src/app.module.ts');

console.log(colors.blue('🔧 自动修复知识库模块...'));

function fixKnowledgeModule() {
    try {
        // 读取app.module.ts文件
        let appModuleContent = fs.readFileSync(APP_MODULE_PATH, 'utf8');
        
        let needUpdate = false;
        
        // 1. 检查并添加导入语句
        if (!appModuleContent.includes("import { KnowledgeModule }")) {
            console.log(colors.yellow('🔄 添加 KnowledgeModule 导入语句...'));
            
            // 在SlidevMcpModule导入后添加KnowledgeModule导入
            appModuleContent = appModuleContent.replace(
                /import { SlidevMcpModule } from '\.\/app\/mcp\/slidev-mcp\.module';/,
                `import { SlidevMcpModule } from './app/mcp/slidev-mcp.module';\nimport { KnowledgeModule } from './app/knowledge/knowledge.module';`
            );
            needUpdate = true;
        }
        
        // 2. 检查并添加模块注册
        if (!appModuleContent.includes('KnowledgeModule,')) {
            console.log(colors.yellow('🔄 在 imports 数组中注册 KnowledgeModule...'));
            
            // 在SlidevMcpModule后添加KnowledgeModule
            appModuleContent = appModuleContent.replace(
                /SlidevMcpModule,\s*\n\s*SlidesModule,/,
                `SlidevMcpModule,
        KnowledgeModule,  // 知识库模块 - 绝对不能删除！这是第10次恢复
        SlidesModule,`
            );
            needUpdate = true;
        }
        
        // 3. 保存文件
        if (needUpdate) {
            fs.writeFileSync(APP_MODULE_PATH, appModuleContent, 'utf8');
            console.log(colors.green('✅ app.module.ts 已更新'));
        } else {
            console.log(colors.green('✅ KnowledgeModule 已正确配置'));
        }
        
        // 4. 验证修复结果
        const updatedContent = fs.readFileSync(APP_MODULE_PATH, 'utf8');
        const hasImport = updatedContent.includes("import { KnowledgeModule }");
        const hasRegistration = updatedContent.includes('KnowledgeModule,');
        
        if (hasImport && hasRegistration) {
            console.log(colors.green('🎉 知识库模块修复成功!'));
            console.log(colors.blue('📋 请重启后端服务以使更改生效'));
            return true;
        } else {
            console.log(colors.red('❌ 修复失败，请手动检查'));
            return false;
        }
        
    } catch (error) {
        console.log(colors.red(`❌ 修复过程中出现错误: ${error.message}`));
        return false;
    }
}

// 执行修复
const success = fixKnowledgeModule();
process.exit(success ? 0 : 1);