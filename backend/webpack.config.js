const path = require('path');

const isDev = process.env.NODE_ENV === 'development';


module.exports = {
    optimization: {
        minimize: false,       // 禁用代码压缩
        concatenateModules: false, // 禁用模块合并
        usedExports: false,    // 禁用 Tree Shaking
        sideEffects: false,    // 完全禁用副作用优化
        mangleExports: false,  // 禁用导出名混淆
    },
    entry: './src/main.ts',
    target: 'node',
    mode: isDev ? 'development' : 'production',
    externals: {
        // 排除不需要打包的模块
        'bcryptjs': 'commonjs bcryptjs',
        'sqlite3': 'commonjs sqlite3',
        'typeorm': 'commonjs typeorm'
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
};