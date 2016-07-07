const webpack          = require('webpack')
const webpackConfig    = require('./webpack.config')
const debug            = require('debug')('app:bin:server')
const WebpackDevServer = require('webpack-dev-server')

;(function () {
  debug('Starting development server')
  const compile = webpack(webpackConfig)
  const server = new WebpackDevServer(compile, {
    publicPath: webpackConfig.output.publicPath,
    historyApiFallback: true,
    noInfo: true,
    stats: {
      colors: true,
      chunks: false
    }
  })
  server.listen(8080, 'localhost', function (err) {
    if (err) debug(err)
  })
})()
