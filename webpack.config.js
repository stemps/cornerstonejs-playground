const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'CornerstoneJS Playground',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/img", to: "img" },
      ],
    }),
  ],
  devServer: {
    static: './dist',
  },
};
