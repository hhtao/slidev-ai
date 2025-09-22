#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const colors = require('chalk');

/**
 * 知识库模块自动检查脚本
 * 防止知识库模块再次丢失
 */

const APP_MODULE_PATH = path.join(__dirname, '../backend/src/app.module.ts');
const KNOWLEDGE_MODULE_PATH = path.join(__dirname, '../backend/src/app/knowledge/knowledge.module.ts');

console.log(colors.blue('🔍 检查知识库模块状态...'));

function checkKnowledgeModule() {
    let hasError = false;
    
    // 1. 检查知识库模块文件是否存在
    if (!fs.existsSync(KNOWLEDGE_MODULE_PATH)) {
        console.log(colors.red('❌ 错误: knowledge.module.ts 文件不存在!'));
        console.log(colors.yellow(`   期望路径: ${KNOWLEDGE_MODULE_PATH}`));
        hasError = true;
    } else {
        console.log(colors.green('✅ knowledge.module.ts 文件存在'));
    }
    
    // 2. 检查AppModule是否导入了KnowledgeModule
    if (!fs.existsSync(APP_MODULE_PATH)) {
        console.log(colors.red('❌ 错误: app.module.ts 文件不存在!'));
        hasError = true;
    } else {
        const appModuleContent = fs.readFileSync(APP_MODULE_PATH, 'utf8');
        
        // 检查导入语句
        const hasImport = appModuleContent.includes("import { KnowledgeModule }") ||
                         appModuleContent.includes("KnowledgeModule");
        
        if (!hasImport) {
            console.log(colors.red('❌ 错误: AppModule 没有导入 KnowledgeModule!'));
            console.log(colors.yellow('   需要添加: import { KnowledgeModule } from \'./app/knowledge/knowledge.module\';'));
            hasError = true;
        } else {
            console.log(colors.green('✅ KnowledgeModule 导入语句存在'));
        }
        
        // 检查模块注册
        const hasModuleRegistration = appModuleContent.includes('KnowledgeModule,');
        
        if (!hasModuleRegistration) {
            console.log(colors.red('❌ 错误: AppModule 的 imports 数组中没有注册 KnowledgeModule!'));
            console.log(colors.yellow('   需要在 imports 数组中添加: KnowledgeModule,'));
            hasError = true;
        } else {
            console.log(colors.green('✅ KnowledgeModule 已在 imports 数组中注册'));
        }
    }
    
    // 3. 检查关键的知识库文件
    const criticalFiles = [
        'backend/src/app/knowledge/knowledge.controller.ts',
        'backend/src/app/knowledge/knowledge.service.ts',
        'backend/src/app/knowledge/knowledge-based-slide.controller.ts',
        'backend/src/app/knowledge/knowledge-based-slide.service.ts',
        'backend/src/app/knowledge/knowledge-slidev.controller.ts',
        'backend/src/app/knowledge/knowledge-slidev.service.ts'
    ];
    
    console.log(colors.blue('\n🔍 检查关键知识库文件...'));
    
    criticalFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
            console.log(colors.green(`✅ ${filePath}`));
        } else {
            console.log(colors.red(`❌ ${filePath} - 文件缺失!`));
            hasError = true;
        }
    });
    
    // 4. 检查前端知识库路由
    const frontendRouterPath = path.join(__dirname, '../frontend/src/router/index.ts');
    if (fs.existsSync(frontendRouterPath)) {
        const routerContent = fs.readFileSync(frontendRouterPath, 'utf8');
        const hasKnowledgeRoutes = routerContent.includes('/knowledge') || 
                                  routerContent.includes('knowledge-slides');
        
        if (hasKnowledgeRoutes) {
            console.log(colors.green('✅ 前端知识库路由存在'));
        } else {
            console.log(colors.red('❌ 前端知识库路由缺失!'));
            hasError = true;
        }
    }
    
    return !hasError;
}

function generateFixCommand() {
    console.log(colors.blue('\n🛠️  如果检查失败，请运行以下修复命令:'));
    console.log(colors.yellow('cd e:\\slidev-ai'));
    console.log(colors.yellow('node scripts/fix-knowledge-module.js'));
}

// 执行检查
const isHealthy = checkKnowledgeModule();

if (isHealthy) {
    console.log(colors.green('\n🎉 知识库模块状态正常!'));
    process.exit(0);
} else {
    console.log(colors.red('\n💥 发现知识库模块问题!'));
    generateFixCommand();
    process.exit(1);
}