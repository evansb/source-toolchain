const webpack          = require('webpack')
const webpackConfig    = require('../webpack.config')
const debug            = require('debug')('app:bin:server')
const WebpackDevServer = require('webpack-dev-server')

;(function () {
  debug('Start development server')
  const compile = webpack(webpackConfig)
  const server = new WebpackDevServer(compile)
  server.listen(8080)
})()
