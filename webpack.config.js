/* eslint-disable global-require */
// Node.js path helper
const path = require('path');
// CSS extractor
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// custom JS optimizer
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// File manager
const FileManagerPlugin = require('filemanager-webpack-plugin');
// project metadata
const pkg = require('./package.json');
/* eslint-disable global-require */

// Environment detector
const isDevMode = () => process.env.NODE_ENV === 'development';

// Pre-defined string-replace-loader template
// 1. convert {{version}} to `version` value in package.json
// 2. strip `// @dev-only ` part from comments
const stringReplaceLoader = {
  loader: 'string-replace-loader',
  options: {
    multiple: [
      {
        search: /{{version}}/g,
        replace: pkg.version,
      },
      {
        search: /\/\/ @dev-only /g,
        replace: '',
      },
    ],
  },
};

// Webpack configurations
let config = {
  mode: 'production',
  entry: path.join(__dirname, pkg.main),
  output: {
    filename: `${pkg.name}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `${pkg.name}.css`,
    }),
    // Copy bundled files to documentation directory
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{ source: 'dist', destination: 'docs/assets/skeletabs' }],
        },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: isDevMode()
          ? 'babel-loader'
          : ['babel-loader', stringReplaceLoader],
      },
      {
        test: /\.scss$/,
        use: [
          // - development: inject css into DOM as <style /> node
          // - production: extract as separate CSS file for distribution
          isDevMode() ? 'style-loader' : MiniCssExtractPlugin.loader,
          stringReplaceLoader,
          // interprete CSS to commonJS
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

if (isDevMode()) {
  config = Object.assign(config, {
    mode: 'development',
    output: {
      filename: `${pkg.name}.js`,
      path: path.resolve(__dirname, 'test'),
    },
    plugins: [],
    optimization: {},
    devServer: {
      open: true,
      openPage: '/test',
      hot: true,
    },
    // source mapping
    devtool: 'eval-cheap-module-source-map',
    // logger
    stats: 'minimal',
  });
}

module.exports = config;
