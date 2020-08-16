/* eslint-disable global-require */
// Node.js path helper
const path = require('path');
// CSS extractor
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// custom JS optimizer
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// project metadata
const pkg = require('./package.json');
/* eslint-disable global-require */

// Pre-defined string-replace-loader template
// 1. convert {{version}} to `version` value in package.json
const stringReplaceLoader = {
  loader: 'string-replace-loader',
  options: {
    search: /{{version}}/g,
    replace: pkg.version,
  },
};

// Inject processed stylesheets in a dynamic way.
// - development: inject css into DOM as <style /> node
// - production: extract as separate CSS file for distribution
const styleInjector =
  process.env.NODE_ENV === 'development'
    ? 'style-loader'
    : MiniCssExtractPlugin.loader;

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
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', stringReplaceLoader],
      },
      {
        test: /\.scss$/,
        use: [
          styleInjector,
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

if (process.env.NODE_ENV === 'development') {
  config = Object.assign(config, {
    mode: 'development',
    output: {
      filename: `${pkg.name}.js`,
      path: path.resolve(__dirname, 'test'),
    },
    plugins: [],
    optimization: {},
    devServer: {
      contentBase: path.resolve(__dirname, 'test'),
      hot: true,
    },
    // source mapping
    devtool: 'eval-cheap-module-source-map',
    // logger
    stats: 'minimal',
  });
}

module.exports = config;
