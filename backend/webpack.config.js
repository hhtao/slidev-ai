const path = require('path');

module.exports = {
//  optimization: {
//     minimize: false,  // 禁用压缩
//   },
  entry: './src/main.ts',
  target: 'node',
  mode: 'production',
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
};