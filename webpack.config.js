var webpack = require('webpack')

module.exports = {
  entry: {
    'jediscript': './src/service.ts',
    'jediscript-lib': './lib/index.js'
  },

  output: {
    path: __dirname + './dist',
    filename: '[name].js'
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },

  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ],

    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: process.env.PRODUCTION ? [
    new webpack.optimize.UglifyJsPlugin({
      warnings: false
    })
  ] : []
}
