const path = require('path');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    optimization: {
        minimize: !isDev,       // 在生产模式下启用代码压缩
        concatenateModules: !isDev, // 在生产模式下启用模块合并
        usedExports: !isDev,    // 在生产模式下启用 Tree Shaking
        sideEffects: !isDev,    // 在生产模式下启用副作用优化
        mangleExports: !isDev,  // 在生产模式下启用导出名混淆
        splitChunks: false,   // 彻底禁用代码分割
        runtimeChunk: false,  // 禁止生成 runtime 文件
        // 禁止生成额外的chunks
        chunkIds: 'total-size',
        moduleIds: 'size'
    },
    entry: './src/main.ts',
    target: 'node',
    mode: isDev ? 'development' : 'production',
    externals: {
        // 排除不需要打包的模块
        'bcryptjs': 'commonjs bcryptjs',
        'sqlite3': 'commonjs sqlite3',
        'typeorm': 'commonjs typeorm',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@utils': path.resolve(__dirname, 'src/utils'),
        },
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        libraryTarget: 'commonjs2',
    },
    watchOptions: {
        ignored: [
            '**/.slidev-temp-build/**',
            '**/slidev-mcp/.slidev-mcp/**',
            '**/presentation/**',
            '**/uploads/**'
        ]
    }
}