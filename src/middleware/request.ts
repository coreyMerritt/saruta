import { SarutaLogger } from "../core/saruta_logger.js"
import { SarutaTime } from "../core/saruta_time.js"
import { LogFiles } from '../configuration/directories/index.js'
import fs from 'fs/promises'
import chalk from 'chalk'
import { Request, Response, NextFunction } from "express"
import { Configs } from "../configuration/configs.js"

const blue = chalk.blue

export class RequestMiddleware {

    public static async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
        process.stdout.write(`\n`)
        SarutaLogger.logTimestamp()
        process.stdout.write(blue(`Request Recieved\n\n`))

        fs.appendFile(`${Configs.logPaths.incomingRequest}`, 
            `[${SarutaTime.getCurrentDateTime()}]\n` +
            `\tURL: ${req.url}\n` +
            `\tMethod: ${req.method}\n` +
            `\tIP: ${req.socket.remoteAddress}\n` +
            `\tUser-Agent: ${req.headers['user-agent']}\n` +
            `\tHeaders: ${JSON.stringify(req.headers, null, 2)}\n\n`
        )

        next()
    }
}