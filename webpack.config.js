// Node.js path helper
const path = require('path');
// allow access to built-in plugins
const webpack = require('webpack');
// CSS extractor
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// custom JS optimizer
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// project metadata
const pkg = require('./package.json');

// webpack configurations
let config = {
  mode: 'production',
  entry: path.join(__dirname, pkg.main),
  output: {
    // use the entry chunk name as the file name
    filename: `${pkg.name}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `${pkg.name}.css`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          // inject css into DOM as <style /> node
          // 'style-loader',
          // extract as separate CSS file
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          // translate CSS into CommonJS
          'css-loader',
          // process with postcss (including autoprefix)
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [require('autoprefixer')],
            },
          },
          // compil sass to css
          'sass-loader',
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: true,
          mangle: false,
          ie8: false,
        },
      }),
    ],
  },
};

if (process.env.NODE_ENV === 'development') {
  config = Object.assign(config, {
    mode: 'development',
    devServer: {
      contentBase: __dirname,
      hot: true,
      open: {
        app: ['Chrome', '--incognito'],
      },
    },
    // source mapping
    devtool: 'eval-cheap-module-source-map',
    // logger
    stats: 'minimal',
  });
}

module.exports = config;
