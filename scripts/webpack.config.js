const path = require('path')
const webpack = require('webpack')
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const nodeModulesPath = path.join(process.cwd(), 'node_modules')
const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  entry: { 'source-toolchain': './src/index.ts' },

  output: {
    path: path.join(process.cwd(), 'dist'),
    publicPath: '/',
    filename: '[name].min.js',
    libraryTarget: 'umd',
    library: 'SourceToolchain'
  },

  resolve: {
    extensions: ['', '.ts', '.js'],
    moduleDirectories: ['node_modules']
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader' + (isDevelopment?'?tsconfig=tsconfig.dev.json':''),
        exclude: /(node_modules|test-utils|\.test\.ts$|\.d\.ts)/
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ],

    preLoaders: [
      { test: /\.tsx?$/, loader: 'tslint', exclude: /node_modules/ }
    ]
  },

  plugins: [
    new ForkCheckerPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  ].concat((!isDevelopment) ? [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        unused: true,
        dead_code: true,
        warnings: false
      }
    })
  ] : []),

  tslint: {
    emitErrors: true,
    formattersDirectory: path.join(nodeModulesPath,
      'tslint-loader', 'formatters')
  },

  node: {
    fs: 'empty'
  }
}
