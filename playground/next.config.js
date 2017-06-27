const path = require('path')

module.exports = {
  webpack: config => {
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['source-toolchain$'] = path.resolve(
      __dirname,
      '..',
      'es5',
      'main.js'
    )
    return config
  }
}
