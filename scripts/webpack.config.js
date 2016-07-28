const path = require('path')
const webpack = require('webpack')
const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  target: 'web',
  entry: './es5/index.js',

  output: {
    path: path.join(process.cwd(), 'dist'),
    publicPath: '/',
    filename: 'source-toolchain.min.js',
    library: 'SourceToolchain'
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },

  plugins: [
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
  ] : [])
}
