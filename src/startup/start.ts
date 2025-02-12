import { Database, SarutaLogger } from '../core/index.js'
import cron from 'node-cron'
import fs from 'fs'
import http from 'http'
import express from 'express'
import backupRoutes from '../api/routes/backup.js'
import indexRoutes from '../api/routes/index.js'
import validationRoutes from '../api/routes/validation.js'
import lintRoutes from '../api/routes/lint.js'
import { ErrorMiddleware, RequestMiddleware } from '../middleware/index.js'
import { Configs } from '../configuration/configs.js'



export class Start {

  private static port = process.env.LIKI_PORT
  private static protocol = process.env.LIKI_PROTOCOL
  public static url = `${this.protocol}://localhost:${this.port}`

  public static async execute(test?: boolean): Promise<void> {
    if (test) {
      Configs.set(true)
    } else {
      Configs.set()
    }
    this.createDirectories()
    this.startApp()
    this.startPassiveJobs()
    Database.initialize()
  }



  private static async createDirectories(): Promise<void> {
    const DIRS_TO_CREATE: string[] = []
    DIRS_TO_CREATE.push(Configs.rootDirectory)
    DIRS_TO_CREATE.push(...(Object.values(Configs.coreDirectories)))
    DIRS_TO_CREATE.push(...(Object.values(Configs.backupDirectories)))
    DIRS_TO_CREATE.push(...(Object.values(Configs.videoTypeDirectories.staging)))
    DIRS_TO_CREATE.push(...(Object.values(Configs.videoTypeDirectories.production)))
    DIRS_TO_CREATE.push(...(Object.values(Configs.videoTypeDirectories.rejection)))

    for (const [, DIR] of DIRS_TO_CREATE.entries()) {
      try {
        fs.mkdirSync(DIR, { recursive: true })
      } catch {
        // Not a genuine error, directory exists
      }
    }
  }



  private static async startApp(): Promise<void> {
    const APP = express()
    const SERVER = http.createServer(APP)

    SERVER.listen(Start.port, () => {
      SarutaLogger.success(`Server is running on ${Start.url}`)
    })
    APP.use(express.json({ limit: '1gb' }))

    APP.use(RequestMiddleware.execute)
    APP.use('/', backupRoutes)
    APP.use('/', indexRoutes)
    APP.use('/', validationRoutes)
    APP.use('/', lintRoutes)
    APP.use(ErrorMiddleware.execute)
  }



  private static async startPassiveJobs(): Promise<void> {
    cron.schedule('0 0 * * *', () => {
      Database.backupAll()
      Database.lintAll()
    },
    {
      timezone: 'America/Detroit'
    })
  }
}

Start.execute()
