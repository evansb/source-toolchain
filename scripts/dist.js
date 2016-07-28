const path          = require('path')
const webpack       = require('webpack')
const webpackConfig = require('./webpack.config')
const debug         = require('debug')('compile')
const rimraf        = require('rimraf')

;(function () {
  try {
    debug('Run compiler')
    webpack(webpackConfig).run(function (error, stats) {
      if (error) {
        throw error
      }
      console.log(stats.toString({
        timings: true,
        assets: true,
        chunkModules: true,
        chunks: false
      })) 
      rimraf(path.join(process.cwd(), 'dist', 'src'), () => {
        if (stats.hasErrors()) {
          process.exit(1)
        } else {
          process.exit(0)
        }
      })
    })
  } catch (e) {
    debug('Compiler encountered an error.', e)
    process.exit(1)
  }
})()
