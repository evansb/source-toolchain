const path = require('path')
const webpack = require('webpack')
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  entry: { 'source-toolchain': './src/index.ts' },

  output: {
    path: path.join(process.cwd(), 'dist'),
    publicPath: '/',
    filename: '[name].min.js',
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
        loader: 'awesome-typescript-loader',
        exclude: /(node_modules|test-utils|\.test\.ts$|\.d\.ts)/
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },

  plugins: [
    new ForkCheckerPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      },
      '__DEV__': isDevelopment
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

  node: {
    fs: 'empty'
  }
}
