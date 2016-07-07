const webpack       = require('webpack')
const webpackConfig = require('./webpack.config')
const debug         = require('debug')('compile')

;(function () {
  try {
    debug('Run compiler')
    webpack(webpackConfig).run(function (error, stats) {
      if (error) {
        throw error
      }
      console.log(stats.toString())
    })
  } catch (e) {
    debug('Compiler encountered an error.', e)
    process.exit(1)
  }
})()
