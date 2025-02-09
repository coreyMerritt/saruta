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
        var directoriesToCreate: string[] = []
        directoriesToCreate.push(Configs.rootDirectory)
        directoriesToCreate.push(...(Object.values(Configs.coreDirectories)))
        directoriesToCreate.push(...(Object.values(Configs.backupDirectories)))
        directoriesToCreate.push(...(Object.values(Configs.videoTypeDirectories.staging)))
        directoriesToCreate.push(...(Object.values(Configs.videoTypeDirectories.production)))
        directoriesToCreate.push(...(Object.values(Configs.videoTypeDirectories.rejection)))
    
        for (const [, path] of directoriesToCreate.entries()) {
            try {
                fs.mkdirSync(path, { recursive: true })
            } catch {
                // Not a genuine error, directory exists
            }   
        }
    }

    private static async startApp(): Promise<void> {
        const app = express()
        const server = http.createServer(app)

        server.listen(Start.port, () => {
            SarutaLogger.success(`Server is running on ${Start.url}`)
        })
        app.use(express.json({ limit: '1gb' }))

        app.use(RequestMiddleware.execute)
        app.use(`/`, backupRoutes)
        app.use(`/`, indexRoutes)
        app.use(`/`, validationRoutes)
        app.use(`/`, lintRoutes)
        app.use(ErrorMiddleware.execute)
    }


    private static async startPassiveJobs(): Promise<void> {
        cron.schedule('0 0 * * *', () => {
            Database.backupAll()
        }, 
        {
            timezone: 'America/Detroit'
        })
    }
}

Start.execute()