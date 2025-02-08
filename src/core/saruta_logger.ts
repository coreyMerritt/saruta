import { SarutaTime } from './saruta_time.js'
import fs from 'fs/promises'
import chalk from 'chalk'
import { Configs } from '../configuration/configs.js'

const blue = chalk.blue
const cyan = chalk.cyan
const green = chalk.green
const orange = chalk.rgb(255, 165, 0)
const red = chalk.red

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
            process.stderr.write(`${red(error.message)}\n`)
            process.stderr.write(`${red(error.stack)}\n`)

            fs.appendFile(`${Configs.logPaths.general}`, 
                `[${SarutaTime.getCurrentDateTime()}]\n` +
                `${error.message}\n\n`
            )
            fs.appendFile(`${Configs.logPaths.errors}`, 
                `[${SarutaTime.getCurrentDateTime()}]\n` +
                `${error.message}\n\n`
            )
        } else {
            SarutaLogger.logTimestamp()
            process.stderr.write(`${red(`An undefined error has occured.`)}\n`)
            fs.appendFile(`${Configs.logPaths.general}`, 
                `[${SarutaTime.getCurrentDateTime()}]\n` +
                `${`An undefined error has occured.`}\n\n`
            )
            fs.appendFile(`${Configs.logPaths.errors}`, 
                `[${SarutaTime.getCurrentDateTime()}]\n` +
                `${`An undefined error has occured.`}\n\n`
            )
        }
    }

    public static async data(tag: string, data: string): Promise<void> {
        SarutaLogger.logTimestamp()
        process.stdout.write(`${tag}: ${cyan(data)}\n`)

        fs.appendFile(`${Configs.logPaths.general}`, 
            `[${SarutaTime.getCurrentDateTime()}]\n` +
            `${tag}: ${data}\n\n`
        )
    }

    public static async important(info: string): Promise<void> {
        SarutaLogger.logTimestamp()
        process.stdout.write(`${orange(info)}\n`)

        fs.appendFile(`${Configs.logPaths.general}`, 
            `[${SarutaTime.getCurrentDateTime()}]\n` +
            `Info: ${info}\n\n`
        )
    }

    public static async success(info: string): Promise<void> {
        SarutaLogger.logTimestamp()
        process.stdout.write(`${green(info)}\n`)

        fs.appendFile(`${Configs.logPaths.general}`, 
            `[${SarutaTime.getCurrentDateTime()}]\n` +
            `Info: ${info}\n\n`
        )
    }

    public static async logTimestamp(): Promise<void> {
        process.stdout.write(blue(`[${SarutaTime.getCurrentTime()}] `))
    }
}