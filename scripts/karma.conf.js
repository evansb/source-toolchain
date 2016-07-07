const webpackConfig = require('./webpack.config')

const fileGlob = '../tests/**/*.spec.ts'
const singleRun = process.env.CI

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      fileGlob,
    ],
    exclude: [
    ],
    preprocessors: {
      [fileGlob]: ['webpack']
    },
    webpack: {
      module: webpackConfig.module,
      resolve: webpackConfig.resolve
    },
    client: {
      captureConsole: true
    },
    webpackMiddleware: {
      stats: {
        chunks: false
      }
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_ERROR,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun,
    concurrency: Infinity
  })
}
