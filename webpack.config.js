/* eslint-disable global-require */
// Expose webpack's built-in modules
const webpack = require('webpack');
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
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
// Path resolver
const fromRoot = subpath => path.resolve(process.cwd(), subpath);

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
    path: fromRoot('dist'),
    publicPath: '/test',
  },
  externals: {
    jquery: 'jQuery',
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    // Extract styles as CSS
    isProduction &&
      new MiniCssExtractPlugin({
        filename: `${pkg.name}.css`,
      }),
    // Copy bundled files to documentation directory
    isProduction &&
      new FileManagerPlugin({
        events: {
          onEnd: {
            copy: [{ source: 'dist', destination: 'docs/assets/skeletabs' }],
          },
        },
      }),
  ].filter(Boolean),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: isDevelopment
          ? 'babel-loader'
          : ['babel-loader', stringReplaceLoader],
      },
      {
        test: /\.scss$/,
        use: [
          // - development: inject css into DOM as <style /> node
          // - production: extract as separate CSS file for distribution
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
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

if (isDevelopment) {
  config = Object.assign(config, {
    mode: 'development',
    output: {
      filename: `${pkg.name}.js`,
      path: fromRoot('test'),
    },
    optimization: {},
    devServer: {
      hot: true,
      open: true,
      openPage: '/test',
      publicPath: '/test',
    },
    // source mapping
    devtool: 'eval-cheap-module-source-map',
    // logger
    stats: 'minimal',
  });
}

module.exports = config;
