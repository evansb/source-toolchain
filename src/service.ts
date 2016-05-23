import { createParser } from './parser';
import { JSValue } from './interop'

declare type RunCallback = (err: Error, result: any) => any

declare type IConfig = {
  week: number
}

declare interface IService {
  config: IConfig
  compileAndRun (source: string, callback?: RunCallback)
}

function isValidConfig (config): boolean {
  return true
}

const defaultConfig: IConfig = {
  week: 3
}

class Service implements IService {
  config: IConfig

  constructor (_config?: IConfig) {
    let config = _config || defaultConfig
    if (isValidConfig(config)) {
      this.config = config
    }
  }

  compileAndRun (source, callback) {
    const jediParser = createParser(this.config.week)
    const AST = jediParser.parse(source)
    console.log(AST)
    callback(null, JSValue.True)
  }
}

export default Service
