const webpack       = require('webpack')
const webpackConfig = require('../webpack.config')
const debug         = require('debug')('app:bin:compile')

;(function () {
  try {
    debug('Run compiler')
    webpack(webpackConfig).run(function (error, stats) {
      if (error) {
        throw error
      }
      debug(stats)
    })
  } catch (e) {
    debug('Compiler encountered an error.', e)
    process.exit(1)
  }
})()
