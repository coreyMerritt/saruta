import { SarutaTime } from './saruta_time.js'
import fs from 'fs/promises'
import chalk from 'chalk'
import { Configs } from '../configuration/configs.js'



const BLUE = chalk.blue
const CYAN = chalk.cyan
const GREEN = chalk.green
const ORANGE = chalk.rgb(255, 165, 0)
const RED = chalk.red



export class SarutaLogger {

  public static async info(info: string): Promise<void> {
    SarutaLogger.logTimestamp()
    process.stdout.write(`${info}\n`)

    fs.appendFile(`${Configs.logPaths.general}`,
      `[${SarutaTime.getCurrentDateTime()}]\n` +
      `Info: ${info}\n\n`
    )
  }



  public static async error(error?: Error): Promise<void> {
    if (error) {
      SarutaLogger.logTimestamp()
      process.stderr.write(`${RED(error.message)}\n`)
      process.stderr.write(`${RED(error.stack)}\n`)

      fs.appendFile(
        `${Configs.logPaths.general}`,
        `[${SarutaTime.getCurrentDateTime()}]\n` +
        `${error.message}\n\n`
      )
      fs.appendFile(
        `${Configs.logPaths.errors}`,
        `[${SarutaTime.getCurrentDateTime()}]\n` +
        `${error.message}\n\n`
      )
    } else {
      SarutaLogger.logTimestamp()
      process.stderr.write(`${RED('An undefined error has occured.')}\n`)
      fs.appendFile(
        `${Configs.logPaths.general}`,
        `[${SarutaTime.getCurrentDateTime()}]\n` +
        'An undefined error has occured.\n\n'
      )
      fs.appendFile(
        `${Configs.logPaths.errors}`,
        `[${SarutaTime.getCurrentDateTime()}]\n` +
        'An undefined error has occured.\n\n'
      )
    }
  }



  public static async data(tag: string, data: string): Promise<void> {
    SarutaLogger.logTimestamp()
    process.stdout.write(`${tag}: ${CYAN(data)}\n`)

    fs.appendFile(`${Configs.logPaths.general}`,
      `[${SarutaTime.getCurrentDateTime()}]\n` +
      `${tag}: ${data}\n\n`
    )
  }



  public static async important(info: string): Promise<void> {
    SarutaLogger.logTimestamp()
    process.stdout.write(`${ORANGE(info)}\n`)

    fs.appendFile(`${Configs.logPaths.general}`,
      `[${SarutaTime.getCurrentDateTime()}]\n` +
      `Info: ${info}\n\n`
    )
  }



  public static async success(info: string): Promise<void> {
    SarutaLogger.logTimestamp()
    process.stdout.write(`${GREEN(info)}\n`)

    fs.appendFile(`${Configs.logPaths.general}`,
      `[${SarutaTime.getCurrentDateTime()}]\n` +
      `Info: ${info}\n\n`
    )
  }



  public static async logTimestamp(): Promise<void> {
    process.stdout.write(BLUE(`[${SarutaTime.getCurrentTime()}] `))
  }
}
